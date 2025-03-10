const express = require("express");
const router = express.Router();
const axios = require("axios");

const THREADS_APP_ID = process.env.META_APP_ID; 
const REDIRECT_URI = process.env.META_REDIRECT_URI; 
const SCOPE = "threads_basic,threads_content_publish"; 

// Redirige l'utilisateur vers cette URL pour l'autoriser
router.get("/login", (req, res) => {
	const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code`;
	console.log("authUrl =>", authUrl);
	res.status(500).send("login ended");
	
});

router.get("/auth", async (req, res) => {
	// const code = req.query.code; // Le code d'autorisation passé dans l'URL

	try {
		const response = await axios.post(
			"https://graph.threads.net/oauth/access_token",
			null,
			{
				params: {
					client_id: THREADS_APP_ID,
					client_secret: THREADS_APP_SECRET,
					code: code,
					grant_type: "authorization_code",
					redirect_uri: REDIRECT_URI,
				},
			}
		);

		// Si l'échange est réussi, vous obtenez l'access token
		const { access_token, user_id } = response.data;

		res.json({
			access_token,
			user_id,
		});
	} catch (error) {
		console.error("Erreur lors de l'échange du code:", error.response.data);
		res.status(500).send("Erreur lors de l'échange du code");
	}
});

module.exports = router;
