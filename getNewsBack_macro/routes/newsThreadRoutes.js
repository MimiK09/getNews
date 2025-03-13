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

// Route pour gérer le callback après l'autorisation
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
		res.redirect("/threads/publish-test");
	} catch (error) {
		console.error(
			"Erreur lors de l'échange du code:",
			error.response?.data || error.message
		);
		res.status(500).send("Erreur lors de l'échange du code");
	}
});

// Route pour publier un thread de test
router.get("/threads/publish-test", async (req, res) => {
	if (!global.threadsAccessToken || !global.threadsUserId) {
		return res
			.status(401)
			.send("Non authentifié. Veuillez vous connecter d'abord.");
	}

	try {
		const content = "test initial";
		// Étape 1: Créer un conteneur de média
		const createContainer = await axios.post(
			`https://graph.threads.net/v1.0/me/threads`,
			null,
			{
				params: {
					media_type: "TEXT",
					text: content,
					access_token: global.threadsAccessToken,
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		const mediaContainerId = createContainer.data.id;

		// Attente pour le traitement
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Étape 2: Publier le conteneur
		const publishResponse = await axios.post(
			`https://graph.threads.net/v1.0/me/threads_publish`,
			null,
			{
				params: {
					creation_id: mediaContainerId,
					access_token: global.threadsAccessToken,
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		console.log("Thread publié avec succès => ", content);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		const createResponse = await axios.post(
			`https://graph.threads.net/v1.0/me/threads`,
			null,
			{
				params: {
					media_type: "TEXT",
					text: "suite",
					reply_to_id: publishResponse.data.id,
					access_token: global.threadsAccessToken, // Ajout du token d'accès ici
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		console.log("createResponse", createResponse.data);

		const publishAnswer = await axios.post(
			`https://graph.threads.net/v1.0/me/threads_publish`,
			null,
			{
				params: {
					creation_id: createResponse.data.id,
					access_token: global.threadsAccessToken,
				},
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		console.log("publishAnswer", publishAnswer.data);

		// Réponse au client
		res.status(200).json({
			success: true,
			message: "Thread publié avec succès",
			thread_id: publishResponse.data.id,
			content: content,
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
