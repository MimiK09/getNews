const express = require("express");
const router = express.Router();
const fetchGoogleSheet = require("./services/fetchGoogleSheet");
const puppeteer = require("puppeteer");
const twitter_username = process.env.TWITTER_USERNAME;
const twitter_password = process.env.TWITTER_PASSWORD;

// Route de test depuis Postman
router.get("/twitterTest", async (req, res) => {
	const tabFromGoogleSheet = await fetchGoogleSheet(
		"Liste Threads!A:G",
		[1, 2]
	);

	///////////////
	// FUNCTIONS
	///////////////

	const splitTextForTwitter = ({ title, text }) => {
		const LIMIT = 280;
		const SEPARATOR = " - ";
		const MORE_TEXT = "...Lire la suite";

		if (!title || !text) return [];

		let remaining = text.trim();
		const tweets = [];
		let isFirstTweet = true;

		while (remaining.length > 0) {
			const prefix = isFirstTweet ? title + SEPARATOR : "";
			const baseAvailable = LIMIT - prefix.length;

			if (baseAvailable <= 0) {
				throw new Error("Titre trop long pour Twitter");
			}

			const isLastTweet = remaining.length <= baseAvailable;
			const available = isLastTweet
				? baseAvailable
				: baseAvailable - MORE_TEXT.length;

			// Si tout tient
			if (remaining.length <= available) {
				tweets.push(prefix + remaining);
				break;
			}

			// Découpe intelligente
			let chunk = remaining.slice(0, available);

			let cutIndex = Math.max(
				chunk.lastIndexOf("."),
				chunk.lastIndexOf(";"),
				chunk.lastIndexOf(",")
			);

			if (cutIndex === -1) cutIndex = chunk.lastIndexOf(" ");
			if (cutIndex === -1) cutIndex = available;

			const part = remaining.slice(0, cutIndex + 1).trim();
			tweets.push(prefix + part + MORE_TEXT);

			remaining = remaining.slice(cutIndex + 1).trim();
			isFirstTweet = false;
		}

		return tweets;
	};

	console.log("tabFromGoogleSheet ", tabFromGoogleSheet);

	///////////////
	// BOUCLE SUR LES ELEMENTS DE GOOGLE SHEETS
	///////////////

	for (let i = 0; i < tabFromGoogleSheet.length; i++) {
		const title = tabFromGoogleSheet[i].title;
		const text = tabFromGoogleSheet[i].content;

		///////////////
		//// SEPARATION EN TWEET DE -de 280 caractères
		///////////////
		const tab_parts_tweet = await splitTextForTwitter({ title, text });
		console.log("voici les tweets pour i =>", i, "=>   ", tab_parts_tweet);

		///////////////
		//// PUBLICATION EN UTILISANT PUPPETEER
		///////////////
	}

	res.status(200).send("ok");
});

module.exports = router;
