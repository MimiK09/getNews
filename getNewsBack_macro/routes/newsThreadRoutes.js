const express = require("express");
const router = express.Router();
const axios = require("axios");

// Variables d'environnement
const THREADS_APP_ID = process.env.THREADS_APP_ID;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET;
const REDIRECT_URI = process.env.THREADS_APP_REDIRECT_URI;
const SCOPE = "threads_basic,threads_content_publish";

// Route pour initier le processus d'authentification
router.get("/login", (req, res) => {
	const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code`;
	console.log("se rendre sur => ", authUrl);
	res.redirect(authUrl);
});

// Route pour gérer le callback après l'autorisation et récupérer le token
router.get("/callback", async (req, res) => {
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
		global.threadsAccessToken = access_token;
		global.threadsUserId = user_id;

		// Redirection vers la publication du thread
		res.redirect("/threads/publish-threads");
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
	if (!global.threadsAccessToken || !global.threadsUserId) {
		return res
			.status(401)
			.send("Non authentifié. Veuillez vous connecter d'abord.");
	}

	try {
		// prévoir fonction pour traiter un tableau et en faire un nouveau avec des news divisées

		// Prévoir un tableau avec des objets de type
		// objet avec prop content et en valeur de content : un tableau
		// si tableau de content est de longueur 1 alors seulement un post
		// le seul élement serait le initial content
		// si tableau est de longueur 2 alors post et réponse
		//// le premier élément du tableau serait le intialContent
		//// le second serait contentAnswer
		// si tableau longueur > 2, faire un message de non traitement

		//Récupérer les datas à intégrer dans les threads
		const initialContent = "test initial";
		const contentAnswer = "réponse";

		// Faire une boucle sur la liste des threads à publier
		// Étape 1: Créer un conteneur de média
		const createContainer = await axios.post(
			`https://graph.threads.net/v1.0/me/threads`,
			null,
			{
				params: {
					media_type: "TEXT",
					text: initialContent,
					access_token: global.threadsAccessToken,
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		const containerId = createContainer.data.id;

		// Attente pour le traitement
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Étape 2: Publier le conteneur
		const publishPost = await axios.post(
			`https://graph.threads.net/v1.0/me/threads_publish`,
			null,
			{
				params: {
					creation_id: containerId,
					access_token: global.threadsAccessToken,
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Gestion d'une réponse - cas d'un post initial trop long
		// Étape 1: Créer un conteneur de média

		const createResponseContainer = await axios.post(
			`https://graph.threads.net/v1.0/me/threads`,
			null,
			{
				params: {
					media_type: "TEXT",
					text: contentAnswer,
					reply_to_id: publishPost.data.id,
					access_token: global.threadsAccessToken, // Ajout du token d'accès ici
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		// Étape 2: Publier le conteneur
		const publishAnswer = await axios.post(
			`https://graph.threads.net/v1.0/me/threads_publish`,
			null,
			{
				params: {
					creation_id: createResponseContainer.data.id,
					access_token: global.threadsAccessToken,
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		// Réponse au client
		res.status(200).json({
			success: true,
			message: "Thread publié avec succès",
			post_id: publishPost.data.id,
			answer_id: publishAnswer.data.id,
			content: [initialContent, contentAnswer],
		});
	} catch (error) {
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
