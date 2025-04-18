
const puppeteer = require("puppeteer");

///////////////////////////////////////////////////////////////
// SCRAP YONHAP FR //// SCRAP YONHAP FR //// SCRAP YONHAP FR //
///////////////////////////////////////////////////////////////

// Function to scrap news from Yonhap fr , get additionnal datas about news (to be added in the Database)
const scrapeYonhapDataFr = async () => {
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
};
///////////////////////////////////////////
///////////////////////////////////////////

module.exports = scrapeYonhapDataFr;
