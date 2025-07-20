const express = require("express");
const router = express.Router();
const axios = require("axios");
const fetchGoogleSheet = require("./services/fetchGoogleSheet");

// Variables d'environnement
const THREADS_APP_ID = process.env.THREADS_APP_ID;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET;
const REDIRECT_URI = process.env.THREADS_APP_REDIRECT_URI;
const SCOPE = "threads_basic,threads_content_publish";

// Route pour initier le processus d'authentification
router.get("/loginthread", (req, res) => {
	const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code`;
	console.log("se rendre sur => ", authUrl);
	res.json({ authUrl });
});

// Route pour gérer le callback après l'autorisation et récupérer le token
router.get("/callbackloginthread", async (req, res) => {
	const { code } = req.query;

	if (!code) {
		return res.status(400).send("Code d'autorisation manquant");
	}

	try {
		// Préparation des données pour l'échange du code
		const formData = new URLSearchParams({
			client_id: THREADS_APP_ID,
			client_secret: THREADS_APP_SECRET,
			code,
			grant_type: "authorization_code",
			redirect_uri: REDIRECT_URI,
		});

		// Échange du code contre un token d'accès
		const response = await axios.post(
			"https://graph.threads.net/oauth/access_token",
			formData.toString(),
			{
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			}
		);

		// Extraction des données retournées
		const { access_token, user_id } = response.data;

		// Vérification des permissions avant de publier
		const permissionsCheck = await checkThreadsPermissions(
			access_token,
			user_id
		);
		if (!permissionsCheck.canPublish) {
			return res.status(403).json({
				success: false,
				error: "Permissions insuffisantes pour publier",
				details: permissionsCheck.message,
			});
		}

		// Appel à l'API pour publier les threads
		const publishResponse = await axios.post(
			"http://localhost:3000/threads/publish-threads",
			{
				accessToken: access_token,
				userId: user_id,
			},
			{
				headers: { "Content-Type": "application/json" },
			}
		);

		// Réponse finale
		res.status(200).send("Thread publié avec succès");
	} catch (error) {
		console.error(
			"Erreur lors de l'échange du code:",
			error.response?.data || error.message
		);
		res.status(500).send("Erreur lors de l'échange du code");
	}
});

// Fonction pour vérifier les permissions
async function checkThreadsPermissions(accessToken, userId) {
	try {
		// Vérification du profil utilisateur
		const profileResponse = await axios.get(
			`https://graph.threads.net/v1.0/me`,
			{
				params: {
					fields: "id,username,threads_profile_picture_url",
					access_token: accessToken,
				},
			}
		);

		console.log("Profil utilisateur:", profileResponse.data);

		// Pour Threads, on teste directement la capacité de créer un post
		// en faisant un appel de test (sans publier)
		try {
			const testContainer = await axios.post(
				`https://graph.threads.net/v1.0/me/threads`,
				null,
				{
					params: {
						media_type: "TEXT",
						text: "Test de permissions - ce post ne sera pas publié",
						access_token: accessToken,
					},
					headers: { "Content-Type": "application/json" },
				}
			);

			console.log("Test de création réussi:", testContainer.data.id);

			// Si on arrive ici, on a les permissions pour créer des posts
			return {
				canPublish: true,
				message: "Permissions OK - capable de créer des posts",
				testContainerId: testContainer.data.id,
			};
		} catch (testError) {
			console.error(
				"Erreur lors du test de création:",
				testError.response?.data || testError.message
			);

			// Analyse de l'erreur pour déterminer si c'est un problème de permissions
			if (testError.response?.data?.error?.code === 10) {
				return {
					canPublish: false,
					message:
						"Permission threads_content_publish manquante ou non accordée",
					error: testError.response.data.error,
				};
			}

			return {
				canPublish: false,
				message: "Erreur lors du test de permissions",
				error: testError.response?.data || testError.message,
			};
		}
	} catch (error) {
		console.error(
			"Erreur lors de la vérification du profil:",
			error.response?.data || error.message
		);
		return {
			canPublish: false,
			message: "Erreur lors de la vérification du profil utilisateur",
			error: error.response?.data || error.message,
		};
	}
}

// Route pour publier un thread
router.post("/threads/publish-threads", async (req, res) => {
	const { accessToken, userId } = req.body;

	// 1️⃣ Vérification de l'authentification
	if (!accessToken || !userId) {
		return res
			.status(401)
			.send("Non authentifié. Veuillez vous connecter d'abord.");
	}

	try {
		// 2️⃣ Récupération et découpage des news
		const tabFromGoogleSheet = await fetchGoogleSheet("Liste Threads!A:E", [0]);

		// Amélioration du découpage avec validation
		const tabWithLittleSections = tabFromGoogleSheet
			.map((news) => {
				if (!news || typeof news !== "string") return [];

				const sections = [];
				let [title, ...textArray] = news.split(" - ");

				if (!title) return [];

				let text = textArray.join(" - ").trim();

				// Si le texte est court, on garde tout ensemble
				if ((title + " - " + text).length <= 500) {
					sections.push(title + " - " + text);
					return sections;
				}

				// Découpe du texte en sections de maximum 500 caractères
				while (text.length > 0) {
					let remainingLength = 500 - title.length - 3;

					if (remainingLength <= 0) {
						console.warn("Titre trop long:", title.length, "caractères");
						break;
					}

					let endIndex = text.lastIndexOf(".", remainingLength);
					if (endIndex === -1) {
						endIndex = text.lastIndexOf(" ", remainingLength);
					}
					if (endIndex === -1) endIndex = remainingLength;

					sections.push(title + " - " + text.slice(0, endIndex + 1).trim());
					text = text.slice(endIndex + 1).trim();
				}

				return sections;
			})
			.filter((sections) => sections.length > 0);

		console.log("Sections préparées:", tabWithLittleSections);

		// 3️⃣ Publication des threads avec gestion d'erreur améliorée
		let publishedThreads = [];

		for (let sections of tabWithLittleSections) {
			if (sections.length === 0) continue;

			let previousPostId = null;
			let threadSuccess = true;

			for (let [index, text] of sections.entries()) {
				try {
					console.log(
						`Publication post ${index + 1}/${sections.length}:`,
						text.substring(0, 100) + "..."
					);

					// Validation de la longueur du texte
					if (text.length > 500) {
						console.warn(
							`Texte trop long (${text.length} caractères), troncature...`
						);
					}

					console.log("index => ", index);
					console.log("previousPostId => ", previousPostId);

					// Étape 1 : Création d'un conteneur
					const createContainer = await axios.post(
						"https://graph.threads.net/v1.0/me/threads",
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
					// quand bug : enlever testeur, enlever autotidation, remettre autorisation, remettre testeur
					// quand bug utiliser graph API et faire debugger token
					console.log("Conteneur créé:", createContainer.data.id);

					// Pause pour éviter les limitations
					await new Promise((resolve) => setTimeout(resolve, 1000));

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

					console.log("Post publié:", publishPost.data.id);

					previousPostId = publishPost.data.id;

					// Enregistrement du thread principal
					if (index === 0) {
						publishedThreads.push({
							threadId: previousPostId,
							content: sections,
						});
					}

					// Pause avant le post suivant
					await new Promise((resolve) => setTimeout(resolve, 1000));
				} catch (postError) {
					console.error(
						`Erreur post ${index + 1}:`,
						postError.response?.data || postError.message
					);
					threadSuccess = false;
					break; // Arrête ce thread en cas d'erreur
				}
			}

			if (!threadSuccess) {
				console.log("Thread interrompu à cause d'une erreur");
			}

			// Pause entre les threads
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		// 4️⃣ Réponse finale
		console.log(
			"Publication terminée. Threads publiés:",
			publishedThreads.length
		);
		res.status(200).json({
			success: true,
			message: `${publishedThreads.length} thread(s) publié(s) avec succès`,
			threads: publishedThreads,
		});
	} catch (error) {
		console.error(
			"Erreur lors de la publication:",
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
