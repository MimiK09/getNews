const axios = require("axios");
const NewsAPI = require("newsapi");
const snoowrap = require("snoowrap");
const puppeteer = require("puppeteer");
const moment = require("moment-timezone");

const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const reddit_app_id = process.env.REDDIT_APP_ID;
const reddit_app_password = process.env.REDDIT_APP_PASSWORD;
const google_news_api = process.env.NEWSAPI;

/////////////////////////////////////////////////////////
// GET FLAIRS FROM REDDIT ////  GET FLAIRS FROM REDDIT //
/////////////////////////////////////////////////////////
const getFlairs = async () => {
	try {
		const response = await axios.post(
			"https://www.reddit.com/api/v1/access_token",
			`grant_type=password&username=${username}&password=${password}`,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization:
						"Basic " +
						Buffer.from(`${reddit_app_id}:${reddit_app_password}`).toString(
							"base64"
						),
				},
			}
		);

		const accessToken = response.data.access_token;

		const reddit = new snoowrap({
			userAgent: "make a post", // name of the app
			accessToken: accessToken, // access token
		});

		const flairs = await reddit
			.getSubreddit("coreedusud")
			.getLinkFlairTemplates();


		return flairs;
	} catch (error) {
		// Gérez les erreurs éventuelles
		console.error("Erreur lors de la récupération des flairs :", error);
	}
};

///////////////////////////////////////////
///////////////////////////////////////////

///////////////////////////////////////////////////////////////
// SCRAP YONHAP FR //// SCRAP YONHAP FR //// SCRAP YONHAP FR //
///////////////////////////////////////////////////////////////

// Function to scrap news from Yonhap fr , get additionnal datas about news (to be added in the Database)
async function scrapeYonhapDataFr() {
	const browser = await puppeteer.launch();

	const page = await browser.newPage();

	const url = "https://fr.yna.co.kr/news";

	await page.goto(url);

	// Waiting page
	await page.waitForSelector(".smain-list-type01");

	// Extract elements and organize
	const results = await page.evaluate(() => {
		try {
			// Getting today's Date
			const today = new Date();

			const jour = String(today.getDate()).padStart(2, "0");
			const mois = String(today.getMonth() + 1).padStart(2, "0"); // January is 0
			const annee = String(today.getFullYear()).slice(-2);

			const todayFormatted = `${jour}.${mois}.${annee}`;

			// Get all articles
			const articles = document.querySelectorAll(
				".smain-list-type01 li article"
			);

			const yonhapData = [];

			// For each article
			articles.forEach((article) => {
				const title = article.querySelector(".tit a").textContent;
				const link = article.querySelector(".tit a").href;
				const details = article.querySelector(".date").textContent;

				// Creation of the date adding the year we are
				const dateMatch = details.match(/\b\d{2}\.\d{2}\b/);
				const date = dateMatch[0];
				const dateComplete = date + "." + annee;

				// Refusal of a few articles
				if (
					title === "KOSPI-ouverture" ||
					title === "KOSDAQ-ouverture" ||
					title === "FOREX-ouverture" ||
					title === "KOSPI-clôture" ||
					title === "KOSDAQ-clôture" ||
					title === "FOREX-clôture" ||
					title === "FOREX-Cours à 15h30" ||
					title === "Les principaux titres des quotidiens coréens" ||
					title === "Un jour dans l'histoire de la Corée"
				) {
				} else {
					// Creation of the entry
					yonhapData.push({
						title: title,
						link: link,
						dateUpload: todayFormatted,
						dateComplete: dateComplete,
					});
				}
			});

			return yonhapData;
		} catch (error) {
			console.error("An error occured in function scrapeYonhapData :", error);
		}
	});
	return results;
}
///////////////////////////////////////////
///////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
// GET NEWS FROM GOOGLE q:Corée ////  GET NEWS FROM GOOGLE q:Corée //
/////////////////////////////////////////////////////////////////////

async function getNewsFromGoogle() {
	// Determine today's day and yesterday's day
	const today = new Date();

	const jour = String(today.getDate()).padStart(2, "0");
	const mois = String(today.getMonth() + 1).padStart(2, "0"); // January is 0
	const annee = String(today.getFullYear()).slice(-2); // Get 2 last digit of the year

	const todayFormatted = `${jour}.${mois}.${annee}`;

	const daysBefore = new Date(today);
	daysBefore.setDate(today.getDate() - 2);
	const daysBeforeFormatted = daysBefore.toISOString().split("T")[0];

	try {
		const newsapi = new NewsAPI(`${google_news_api}`);
		const response = await newsapi.v2.everything({
			q: "corée",
			language: "fr",
			sortBy: "publishedAt",
			from: daysBeforeFormatted,
			searchIn: "title,description",
		});

		let articleList = response.articles;
		let googleDatas = [];

		// creation of a loop to select articles and format the date of the news

		for (let i = 0; i < articleList.length; i++) {
			let newDate = new Date(articleList[i].publishedAt);

			let jour = String(newDate.getDate()).padStart(2, "0");
			let mois = String(newDate.getMonth() + 1).padStart(2, "0"); // January is 0
			let annee = String(newDate.getFullYear()).slice(-2);

			let newDateFormatted = `${jour}.${mois}.${annee}`;

			googleDatas.push({
				title: articleList[i].title,
				link: articleList[i].url,
				dateUpload: todayFormatted,
				dateComplete: newDateFormatted,
			});
		}
		return googleDatas;
	} catch (error) {
		console.error("problème lors de la récupération des données google", error);
	}
}

///////////////////////////////////////////
///////////////////////////////////////////

///////////////////////////////////////////
// PUBLISH ON REDDIT // PUBLISH ON REDDIT //
///////////////////////////////////////////

const publishOnReddit = async (tab) => {
	// Get an access token
	const response = await axios.post(
		"https://www.reddit.com/api/v1/access_token",
		`grant_type=password&username=${username}&password=${password}`,
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization:
					"Basic " +
					Buffer.from(`${reddit_app_id}:${reddit_app_password}`).toString(
						"base64"
					),
			},
		}
	);

	const accessToken = response.data.access_token;

	// Initialization
	const flairs = await getFlairs();

	const postLink = async (accessToken, tab) => {
		try {
			// Initialization of a Snoowrap client with access token
			const reddit = new snoowrap({
				userAgent: "make a post", // name of the app
				accessToken: accessToken, // access token
			});

			// Using client to post a link after getting flair ID
			for (let i = 0; i < tab.length; i++) {
				//Getting the good flair ID to the link

				const getFlairTemplateId = (flairText) => {
					const flair = flairs.find((f) => f.flair_text === flairText);

					return flair ? flair.flair_template_id : null;
				};

				let flair_id = await getFlairTemplateId(tab[i].redditFlair);

				//Post a link
				const submission = await reddit.getSubreddit("coreedusud").submitLink({
					title: tab[i].title,
					url: tab[i].link,
				});
				await submission.selectFlair({
					flair_template_id: flair_id,
				});

				console.log("submit =>", submission, "title => ", tab[i].title);
			} // Display details of published news
		} catch (error) {
			console.error("problème lors de la publication", error);
		}
	};

	// Function called to post a link
	postLink(accessToken, tab);
};

///////////////////////////////////////////
///////////////////////////////////////////


const isDateWithinXDays = (date, X) => {
	// Obtenir la date du jour format timestamp
	const todayDate = Date.now();

	// Calculer la différence en millisecondes entre les deux dates
	const diffInMs = todayDate - date;

	// Convertir la différence en jours (1 jour = 24h * 60m * 60s * 1000ms)
	const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

	// Retourner vrai si la différence est inférieure ou égale à 2 jours
	return diffInDays <= X;
};

///////////////////////////////////////////
///////////////////////////////////////////

module.exports = {
	getFlairs,
	scrapeYonhapDataFr,
	getNewsFromGoogle,
	publishOnReddit,
	isDateWithinXDays,
};
