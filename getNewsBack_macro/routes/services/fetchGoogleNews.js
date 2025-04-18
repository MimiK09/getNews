const NewsAPI = require("newsapi");

const google_news_api = process.env.NEWSAPI;

const getNewsFromGoogle = async () => {
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
};

module.exports = getNewsFromGoogle;
