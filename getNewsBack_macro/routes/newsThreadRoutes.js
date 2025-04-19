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
    const { code } = req.query;  // Utilisation de la déstructuration pour simplifier

    if (!code) {
        return res.status(400).send("Code d'autorisation manquant");
    }

    try {
        // Préparation des données pour l'échange du code
        const formData = new URLSearchParams({
            client_id: THREADS_APP_ID,
            client_secret: THREADS_APP_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });

        // Échange du code contre un token d'accès
        const response = await axios.post("https://graph.threads.net/oauth/access_token", formData.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        // Extraction des données retournées
        const { access_token, user_id } = response.data;

        // Appel à l'API pour publier les threads (si nécessaire)
        const publishResponse = await axios.post("http://localhost:3000/threads/publish-threads", {
            accessToken: access_token,
            userId: user_id
        }, {
            headers: { "Content-Type": "application/json" }
        });

        // Réponse finale
        res.status(200).send("Thread publié avec succès");
    } catch (error) {
        console.error("Erreur lors de l'échange du code:", error.response?.data || error.message);
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

