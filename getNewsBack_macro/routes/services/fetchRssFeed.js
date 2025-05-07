const axios = require("axios");
const xml2js = require("xml2js");
const isDateWithinXDays = require("./newsServices");

const tab_rssUrl = [
	{
		name: "koreaherald",
		url: "https://www.koreaherald.com/rss/newsAll",
	},
	{ name: "yonhapEN", url: "https://en.yna.co.kr/RSS/news.xml" },
	{ name: "yonhapFR", url: "https://fr.yna.co.kr/RSS/news.xml" },
	{ name: "joongang", url: "https://koreajoongangdaily.joins.com/xmls/joins" },
	{ name: "koreatimes", url: "https://www.koreatimes.co.kr/www/rss/rss.xml" },
];

const fetchRSSFeeds = async () => {
	console.log("==== Démarrage de la récupération des flux RSS ====");
	let listNews = [];
	let successCount = 0;
	let errorCount = 0;

	// Parcourir les différents flux RSS
	for (let i = 0; i < tab_rssUrl.length; i++) {
		try {
			console.log(
				`\n[INFO] Traitement de la source: ${tab_rssUrl[i].name} (${i + 1}/${
					tab_rssUrl.length
				})`
			);
			console.log(`[INFO] URL: ${tab_rssUrl[i].url}`);

			// Faire une requête HTTP GET pour récupérer le contenu du flux RSS
			const response = await axios.get(tab_rssUrl[i].url, {
				timeout: 10000, // Timeout de 10 secondes
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; RSSFetcher/1.0)",
				},
			});

			// Parser le contenu XML avec xml2js

			const parseXML = () => {
				return new Promise((resolve, reject) => {
					xml2js.parseString(response.data, (err, result) => {
						if (err) {
							reject(err);
						} else {
							resolve(result);
						}
					});
				});
			};

			const result = await parseXML();

			// Vérifier si les données sont au format attendu
			if (!result.rss || !result.rss.channel || !result.rss.channel[0]) {
				console.log(
					`[ATTENTION] Format RSS non standard pour ${tab_rssUrl[i].name}, structure attendue non trouvée`
				);
				errorCount++;
				continue;
			}

			// Parcourir et traiter les éléments du flux RSS
			const items = result.rss.channel[0].item;

			if (!items || items.length === 0) {
				console.log(
					`[ATTENTION] Aucun élément trouvé dans le flux RSS: ${tab_rssUrl[i].name}`
				);
				continue;
			}

			console.log(`[INFO] ${items.length} éléments trouvés dans le flux`);

			let itemsAdded = 0;

			items.forEach((item, index) => {
				try {
					if (!item.pubDate || !item.pubDate[0]) {
						console.log(
							`[ATTENTION] Élément #${index} sans date de publication, ignoré`
						);
						return;
					}

					// Traitement de la date
					let pubDateStr = item.pubDate[0];
					let itemTimestampDate;

					try {
						itemTimestampDate = new Date(pubDateStr).getTime();
						if (isNaN(itemTimestampDate)) {
							console.log(
								`[ATTENTION] Format de date invalide: "${pubDateStr}", élément ignoré`
							);
							return;
						}
					} catch (dateError) {
						console.log(
							`[ERREUR] Impossible de parser la date: "${pubDateStr}", élément ignoré`
						);
						return;
					}

					// Vérifier si la date est dans la période souhaitée
					const isDateWithinXDay = isDateWithinXDays(itemTimestampDate, 1);

					if (isDateWithinXDay) {
						const url = item.url || item.link;
						const description = item.description || [""];
						const title =
							item.title && item.title[0]
								? item.title[0]
								: "Titre non disponible";

						if (!url || !url[0]) {
							console.log(
								`[ATTENTION] Élément sans URL, ignoré: "${title.substring(
									0,
									30
								)}..."`
							);
							return;
						}

						listNews.push({
							title: title,
							url: url[0],
							publishedDate: itemTimestampDate,
							description: description[0],
							source: tab_rssUrl[i].name,
						});

						itemsAdded++;
					}
				} catch (itemError) {
					console.log(
						`[ERREUR] Problème lors du traitement de l'élément #${index}: ${itemError.message}`
					);
				}
			});

			successCount++;
		} catch (error) {
			errorCount++;
			if (error.response) {
				// Erreur de réponse du serveur
				console.log(
					`[ERREUR] Source ${tab_rssUrl[i].name} - Erreur HTTP ${error.response.status}: ${error.response.statusText}`
				);
			} else if (error.request) {
				// Pas de réponse reçue
				console.log(
					`[ERREUR] Source ${tab_rssUrl[i].name} - Aucune réponse reçue: ${error.message}`
				);
			} else {
				// Erreur lors de la configuration de la requête
				console.log(`[ERREUR] Source ${tab_rssUrl[i].name} - ${error.message}`);
			}
			console.log("[INFO] Continuation avec la source suivante...");
		}
	}

	console.log("\n==== Récapitulatif ====");
	console.log(
		`[INFO] Sources traitées avec succès: ${successCount}/${tab_rssUrl.length}`
	);
	console.log(`[INFO] Sources en erreur: ${errorCount}/${tab_rssUrl.length}`);
	console.log(
		`[INFO] Total des articles récents récupérés: ${listNews.length}`
	);
	console.log("==== Fin du traitement ====\n");

	return listNews;
};

module.exports = fetchRSSFeeds;
