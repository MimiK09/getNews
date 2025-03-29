const axios = require("axios");
const xml2js = require("xml2js");
const { isDateWithinXDays } = require("./newsServices");

const tab_rssUrl = [
	{
		name: "koreaherald",
		url: "https://www.koreaherald.com/rss/newsAll",
		//https://www.koreaherald.com/rss/newsAll
	},
	{ name: "yonhapEN", url: "https://en.yna.co.kr/RSS/news.xml" },
	{ name: "yonhapFR", url: "https://fr.yna.co.kr/RSS/news.xml" },
	{ name: "joongang", url: "https://koreajoongangdaily.joins.com/xmls/joins" },
	{ name: "koreatimes", url: "https://www.koreatimes.co.kr/www/rss/rss.xml" },
];

const fetchRssFeeds = async () => {
	let listNews = [];
	// Parcourir les différents flux RSS
	for (let i = 0; i < tab_rssUrl.length; i++) {
		// Faire une requête HTTP GET pour récupérer le contenu du flux RSS
		const { data } = await axios.get(tab_rssUrl[i].url);
		console.log("source  => ", tab_rssUrl[i]);
		// Parser le contenu XML avec xml2js
		xml2js.parseString(data, (err, result) => {
			if (err) {
				throw new Error("Erreur lors du parsing du flux RSS:", err);
			}

			// Parcourir et afficher les éléments du flux RSS
			const items = result.rss.channel[0].item;
			items.forEach((item) => {
				// le cas où je suis sur yonhap FR (traitement de la date)
				let itemTimestampDate = new Date(item.pubDate[0]).getTime();;

				// ne s'occuper que des news dont la date de publication est inférieure à X jours
				const isDateWithinXDay = isDateWithinXDays(itemTimestampDate, 1);
				// si la date est inférieure à X jours
				if (isDateWithinXDay) {
					const url = item.url || item.link;
					const description = item.description || "";

					listNews.push({
						title: item.title[0],
						url: url[0],
						publishedDate: itemTimestampDate,
						description: description[0],
						source: tab_rssUrl[i].name,
					});
				}
			});
		});
	}
	return listNews;
};

module.exports = fetchRssFeeds;
