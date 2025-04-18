const express = require("express");
const router = express.Router();
const axios = require("axios");
const fetchGoogleSheet = require("./services/fetchGoogleSheet");
const tokenManager = require("./services/tokenManager");

// Variables d'environnement
const THREADS_APP_ID = process.env.THREADS_APP_ID;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET;
const REDIRECT_URI = process.env.THREADS_APP_REDIRECT_URI;
const SCOPE = "threads_basic,threads_content_publish";

// Route pour initier le processus d'authentification
router.get("/loginthread", (req, res) => {
	const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code`;
	console.log("se rendre sur => ", authUrl);
	res.redirect(authUrl);
});

// Route pour gérer le callback après l'autorisation et récupérer le token
router.get("/callbackloginthread", async (req, res) => {
	const code = req.query.code;
	if (!code) {
		return res.status(400).send("Code d'autorisation manquant");
	}
	try {
		// Préparation des données pour l'échange du code
		const formData = new URLSearchParams();
		formData.append("client_id", THREADS_APP_ID);
		formData.append("client_secret", THREADS_APP_SECRET);
		formData.append("code", code);
		formData.append("grant_type", "authorization_code");
		formData.append("redirect_uri", REDIRECT_URI);

		// Échange du code contre un token d'accès
		const response = await axios.post(
			"https://graph.threads.net/oauth/access_token",
			formData.toString(),
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}
		);

		// Stockage des données pour une utilisation ultérieure
		const { access_token, user_id } = response.data;

		const publishResponse = await axios.post(
			"http://localhost:3000/threads/publish-threads",
			{ accessToken: access_token, userId: user_id }, // On ne passe pas de body, les tokens sont stockés globalement
			{
				headers: { "Content-Type": "application/json" },
			}
		);

		// Redirection vers la publication du thread
		res.status(200).send("Thread publié");
	} catch (error) {
		console.error(
			"Erreur lors de l'échange du code:",
			error.response?.data || error.message
		);
		res.status(500).send("Erreur lors de l'échange du code");
	}
});

// Route pour publier un thread
router.post("/threads/publish-threads", async (req, res) => {
	const { accessToken, userId } = req.body;


	// 1️⃣ Vérification de l'authentification
	// Vérifie que l'utilisateur est bien authentifié avant de continuer
	if (!accessToken || !userId) {
		return res
			.status(401)
			.send("Non authentifié. Veuillez vous connecter d'abord.");
	}

	try {
		// 2️⃣ Récupération et découpage des news
		// Récupération des contenus depuis Google Sheets
		const tabFromGoogleSheet = await fetchGoogleSheet("Liste Threads!A:E",[0]);
		// Découpe chaque news en plusieurs parties de moins de 500 caractères
		const tabWithLittleSections = tabFromGoogleSheet.map((news) => {
			const sections = [];

			// Extraction du titre (avant le premier " - ") et du reste du texte
			let [title, ...textArray] = news.split(" - ");
			let text = textArray.join(" - ").trim();

			// Découpe du texte en sections de maximum 500 caractères
			while (text.length > 0) {
				// Espace restant disponible après ajout du titre et séparateur
				let remainingLength = 500 - title.length - 3;

				// Recherche du dernier point avant la limite pour éviter de couper une phrase
				let endIndex = text.lastIndexOf(".", remainingLength);
				if (endIndex === -1) endIndex = remainingLength; // Si aucun point trouvé, on coupe au max

				// Ajout de la section avec le titre et une partie du texte
				sections.push(title + " - " + text.slice(0, endIndex + 1).trim());

				// Suppression du texte déjà utilisé et continuation
				text = text.slice(endIndex + 1).trim();
			}

			return sections;
		});

		// 3️⃣ Publication des threads
		let publishedThreads = [];

		// Parcours de chaque ensemble de sections (chaque thread)
		for (let sections of tabWithLittleSections) {
			if (sections.length === 0) continue; // Ignore les éléments vides

			let previousPostId = null; // Utilisé pour les réponses en thread
			for (let [index, text] of sections.entries()) {
				// Étape 1 : Création d'un conteneur de média pour le post
				const createContainer = await axios.post(
					`https://graph.threads.net/v1.0/me/threads`,
					null,
					{
						params: {
							media_type: "TEXT",
							text,
							...(previousPostId && { reply_to_id: previousPostId }), // Répond au post précédent s'il existe
							access_token: accessToken,
						},
						headers: { "Content-Type": "application/json" },
					}
				);

				// Pause pour éviter les limitations de l'API
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Étape 2 : Publication du post
				const publishPost = await axios.post(
					`https://graph.threads.net/v1.0/me/threads_publish`,
					null,
					{
						params: {
							creation_id: createContainer.data.id,
							access_token: accessToken,
						},
						headers: { "Content-Type": "application/json" },
					}
				);

				// Stockage de l'ID du post publié pour gérer les réponses en thread
				previousPostId = publishPost.data.id;

				// Enregistrement du thread uniquement si c'est le premier post de la série
				if (index === 0) {
					publishedThreads.push({
						threadId: previousPostId,
						content: sections,
					});
				}

				// Pause avant la publication du post suivant dans le thread
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}

		// 4️⃣ Réponse envoyée au client
		console.log("Threads publiés", publishedThreads);
		res.status(200).json({
			success: true,
			message: "Threads publiés avec succès",
			threads: publishedThreads,
		});
	} catch (error) {
		// Gestion des erreurs et réponse appropriée
		console.error(
			"Erreur lors de la publication du thread:",
			error.response?.data || error.message
		);
		res.status(500).json({
			success: false,
			error: "Erreur lors de la publication du thread",
			details: error.response?.data || error.message,
		});
	}
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const fs = require("fs").promises;
// const path = require("path");
// const fetchGoogleSheet = require("./services/fetchGoogleSheet");

// // Variables d'environnement
// const THREADS_APP_ID = process.env.THREADS_APP_ID;
// const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET;
// const REDIRECT_URI = process.env.THREADS_APP_REDIRECT_URI;
// const TOKEN_FILE_PATH = path.join(__dirname, "./data/threads_tokens.json");

// // Page d'accueil avec options claires
// router.get("/threads", (req, res) => {
// 	res.send(`
//     <html>
//       <body>
//         <h1>Gestionnaire de Threads</h1>
//         <p>Choisissez une action:</p>
//         <ul>
//           <li><a href="/loginthread">Se connecter à Threads (nouvelle authentification)</a></li>
//           <li><a href="/threads/dashboard">Accéder au dashboard (utilise token existant si disponible)</a></li>
//           <li><a href="/threads/check-token">Vérifier l'état du token</a></li>
//         </ul>
//       </body>
//     </html>
//   `);
// });

// // Vérifiez simplement l'existence et la validité du token
// router.get("/threads/check-token", async (req, res) => {
// 	try {
// 		let message = "Vérification du token:";

// 		// Vérifier si le fichier existe
// 		try {
// 			await fs.access(TOKEN_FILE_PATH);
// 			message += "<br>✅ Fichier de token trouvé";

// 			// Lire le contenu
// 			const data = await fs.readFile(TOKEN_FILE_PATH, "utf8");
// 			const tokenData = JSON.parse(data);

// 			if (tokenData.accessToken) {
// 				message += "<br>✅ Token d'accès présent";

// 				if (tokenData.expiresAt) {
// 					const now = Date.now();
// 					const expiration = new Date(tokenData.expiresAt);
// 					const isExpired = now > tokenData.expiresAt;

// 					message += `<br>⏰ Expiration: ${expiration.toLocaleString()} (${
// 						isExpired ? "EXPIRÉ" : "valide"
// 					})`;
// 				}
// 			} else {
// 				message += "<br>❌ Pas de token d'accès";
// 			}
// 		} catch (err) {
// 			if (err.code === "ENOENT") {
// 				message += "<br>❌ Fichier de token non trouvé";
// 			} else {
// 				message += `<br>❌ Erreur lors de la lecture: ${err.message}`;
// 			}
// 		}

// 		res.send(`
//       <html>
//         <body>
//           <h2>${message}</h2>
//           <p><a href="/threads">Retour à l'accueil</a></p>
//         </body>
//       </html>
//     `);
// 	} catch (error) {
// 		res.status(500).send(`Erreur: ${error.message}`);
// 	}
// });

// // Route de login simplifiée
// router.get("/loginthread", (req, res) => {
// 	const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=threads_basic,threads_content_publish&response_type=code`;
// 	console.log("Redirection vers URL d'authentification:", authUrl);
// 	res.redirect(authUrl);
// });

// // Callback avec debugging
// router.get("/callbackloginthread", async (req, res) => {
// 	const code = req.query.code;

// 	if (!code) {
// 		return res.status(400).send("Code d'autorisation manquant");
// 	}

// 	try {
// 		console.log("Code reçu:", code);

// 		// Préparation des données pour l'échange du code
// 		const formData = new URLSearchParams();
// 		formData.append("client_id", THREADS_APP_ID);
// 		formData.append("client_secret", THREADS_APP_SECRET);
// 		formData.append("code", code);
// 		formData.append("grant_type", "authorization_code");
// 		formData.append("redirect_uri", REDIRECT_URI);

// 		console.log("Échange du code contre un token...");

// 		// Échange du code contre un token d'accès
// 		const response = await axios.post(
// 			"https://graph.threads.net/oauth/access_token",
// 			formData.toString(),
// 			{
// 				headers: {
// 					"Content-Type": "application/x-www-form-urlencoded",
// 				},
// 			}
// 		);

// 		console.log("Réponse reçue:", response.data);

// 		const { access_token, user_id } = response.data;

// 		// Assurer que le répertoire existe
// 		const dirPath = path.dirname(TOKEN_FILE_PATH);
// 		try {
// 			await fs.access(dirPath);
// 		} catch (error) {
// 			await fs.mkdir(dirPath, { recursive: true });
// 			console.log("Répertoire data créé");
// 		}

// 		// Stocker le token
// 		await fs.writeFile(
// 			TOKEN_FILE_PATH,
// 			JSON.stringify(
// 				{
// 					accessToken: access_token,
// 					userId: user_id,
// 					expiresAt: Date.now() + 5184000000, // ~60 jours (estimation)
// 					obtainedAt: Date.now(),
// 				},
// 				null,
// 				2
// 			),
// 			"utf8"
// 		);

// 		console.log("Token stocké avec succès");

// 		res.send(`
//       <html>
//         <body>
//           <h1>Authentification réussie!</h1>
//           <p>Token obtenu et stocké pour l'utilisateur ${user_id}</p>
//           <p><a href="/threads/dashboard">Aller au dashboard</a></p>
//         </body>
//       </html>
//     `);
// 	} catch (error) {
// 		console.error(
// 			"Erreur d'authentification:",
// 			error.response?.data || error.message
// 		);
// 		res.status(500).send(`
//       <html>
//         <body>
//           <h1>Erreur d'authentification</h1>
//           <pre>${JSON.stringify(
// 						error.response?.data || error.message,
// 						null,
// 						2
// 					)}</pre>
//           <p><a href="/threads">Retour à l'accueil</a></p>
//         </body>
//       </html>
//     `);
// 	}
// });

// // Dashboard simplifié
// router.get("/threads/dashboard", async (req, res) => {
// 	try {
// 		// Vérifier si un token existe
// 		let hasToken = false;
// 		let userId = null;

// 		try {
// 			const data = await fs.readFile(TOKEN_FILE_PATH, "utf8");
// 			const tokenData = JSON.parse(data);
// 			if (tokenData.accessToken) {
// 				hasToken = true;
// 				userId = tokenData.userId;
// 			}
// 		} catch (err) {
// 			// Token non trouvé ou invalide
// 		}

// 		if (!hasToken) {
// 			return res.send(`
//         <html>
//           <body>
//             <h1>Pas encore authentifié</h1>
//             <p>Vous devez vous connecter d'abord.</p>
//             <p><a href="/loginthread">Se connecter</a></p>
//           </body>
//         </html>
//       `);
// 		}

// 		res.send(`
//       <html>
//         <body>
//           <h1>Dashboard de publication Threads</h1>
//           <p>Utilisateur connecté: ${userId}</p>
//           <form action="/threads/publish-direct" method="post">
//             <button type="submit">Publier des threads</button>
//           </form>
//           <hr>
//           <p><a href="/threads/check-token">Vérifier l'état du token</a></p>
//           <form action="/threads/logout" method="post">
//             <button type="submit">Se déconnecter</button>
//           </form>
//         </body>
//       </html>
//     `);
// 	} catch (error) {
// 		res.status(500).send(`Erreur: ${error.message}`);
// 	}
// });

// // Publication avec la logique complète de threads
// router.post("/threads/publish-direct", async (req, res) => {
// 	// Vérifier si un token existe
// 	let accessToken = null;

// 	try {
// 		const data = await fs.readFile(TOKEN_FILE_PATH, "utf8");
// 		const tokenData = JSON.parse(data);
// 		accessToken = tokenData.accessToken;
// 	} catch (err) {
// 		return res
// 			.status(401)
// 			.send("Non authentifié. <a href='/loginthread'>Se connecter</a>");
// 	}

// 	console.log("Début du processus de publication...");

// 	try {
// 		// 2️⃣ Récupération et découpage des news
// 		// Récupération des contenus depuis Google Sheets
// 		const tabFromGoogleSheet = await fetchGoogleSheet();

// 		// Découpe chaque news en plusieurs parties de moins de 500 caractères
// 		const tabWithLittleSections = tabFromGoogleSheet.map((news) => {
// 			const sections = [];

// 			// Extraction du titre (avant le premier " - ") et du reste du texte
// 			let [title, ...textArray] = news.split(" - ");
// 			let text = textArray.join(" - ").trim();

// 			// Découpe du texte en sections de maximum 500 caractères
// 			while (text.length > 0) {
// 				// Espace restant disponible après ajout du titre et séparateur
// 				let remainingLength = 500 - title.length - 3;

// 				// Recherche du dernier point avant la limite pour éviter de couper une phrase
// 				let endIndex = text.lastIndexOf(".", remainingLength);
// 				if (endIndex === -1) endIndex = remainingLength; // Si aucun point trouvé, on coupe au max

// 				// Ajout de la section avec le titre et une partie du texte
// 				sections.push(title + " - " + text.slice(0, endIndex + 1).trim());

// 				// Suppression du texte déjà utilisé et continuation
// 				text = text.slice(endIndex + 1).trim();
// 			}

// 			return sections;
// 		});

// 		// 3️⃣ Publication des threads
// 		let publishedThreads = [];

// 		// Parcours de chaque ensemble de sections (chaque thread)
// 		for (let sections of tabWithLittleSections) {
// 			if (sections.length === 0) continue; // Ignore les éléments vides

// 			let previousPostId = null; // Utilisé pour les réponses en thread
// 			for (let [index, text] of sections.entries()) {
// 				// Étape 1 : Création d'un conteneur de média pour le post
// 				const createContainer = await axios.post(
// 					`https://graph.threads.net/v1.0/me/threads`,
// 					null,
// 					{
// 						params: {
// 							media_type: "TEXT",
// 							text,
// 							...(previousPostId && { reply_to_id: previousPostId }), // Répond au post précédent s'il existe
// 							access_token: accessToken,
// 						},
// 						headers: { "Content-Type": "application/json" },
// 					}
// 				);

// 				// Pause pour éviter les limitations de l'API
// 				await new Promise((resolve) => setTimeout(resolve, 2000));

// 				// Étape 2 : Publication du post
// 				const publishPost = await axios.post(
// 					`https://graph.threads.net/v1.0/me/threads_publish`,
// 					null,
// 					{
// 						params: {
// 							creation_id: createContainer.data.id,
// 							access_token: accessToken,
// 						},
// 						headers: { "Content-Type": "application/json" },
// 					}
// 				);

// 				// Stockage de l'ID du post publié pour gérer les réponses en thread
// 				previousPostId = publishPost.data.id;

// 				// Enregistrement du thread uniquement si c'est le premier post de la série
// 				if (index === 0) {
// 					publishedThreads.push({
// 						threadId: previousPostId,
// 						content: sections,
// 					});
// 				}

// 				// Pause avant la publication du post suivant dans le thread
// 				await new Promise((resolve) => setTimeout(resolve, 2000));
// 			}
// 		}

// 		// 4️⃣ Réponse envoyée au client
// 		console.log("Threads publiés", publishedThreads);
// 		res.status(200).json({
// 			success: true,
// 			message: "Threads publiés avec succès",
// 			threads: publishedThreads,
// 		});
// 	} catch (error) {
// 		// Gestion des erreurs et réponse appropriée
// 		console.error(
// 			"Erreur lors de la publication du thread:",
// 			error.response?.data || error.message
// 		);
// 		res.status(500).json({
// 			success: false,
// 			error: "Erreur lors de la publication du thread",
// 			details: error.response?.data || error.message,
// 		});
// 	}
// });

// // Déconnexion (supprime le token)
// router.post("/threads/logout", async (req, res) => {
// 	try {
// 		await fs.unlink(TOKEN_FILE_PATH);
// 		res.redirect("/threads");
// 	} catch (error) {
// 		res.status(500).send(`Erreur lors de la déconnexion: ${error.message}`);
// 	}
// });

// module.exports = router;
