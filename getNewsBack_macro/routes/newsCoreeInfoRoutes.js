// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const isDateWithinXDays = require("./services/newsServices");
// const { fetchArticleContent } = require("./services/scrapNewsCoreeInfo");
// const fetchRSSFeeds = require("./services/fetchRSSFeed");
// const fetchBDD = require("./services/fetchBDDCoreeInfo");
// const rssFeedNews = require("../modeles/rssFeedNews");

// const N8N_JSON_URL = process.env.N8N_JSON_URL;

// router.get("/testN8N", async (req, res) => {
// 	try {
// 		const listNewsBDD = await fetchBDD();
// 		const listNewsRSS = await fetchRSSFeeds();

// 		const checkNews = async () => {
// 			let tableau = [];
// 			for (const news of listNewsRSS) {
// 				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });

// 				if (!existingBDDNews) {
// 					const newRssFeedNews = new rssFeedNews({
// 						title: news.title,
// 						url: news.url,
// 						publishedDate: news.publishedDate,
// 						status: "new",
// 						source: news.source,
// 					});
// 					await newRssFeedNews.save();
// 					tableau.push(newRssFeedNews);
// 				}
// 			}
// 			return tableau;
// 		};

// 		const changeStatus = async () => {
// 			for (const news of newTab) {
// 				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });
// 				if (existingBDDNews) {
// 					existingBDDNews.status = "displayed";
// 					await existingBDDNews.save();
// 				}
// 			}
// 		};

// 		const newTab = await checkNews();
// 		const finalTab = [...newTab, ...listNewsBDD];
// 		await changeStatus();
// 		let testN8N = {
// 			data: finalTab,
// 		};

// 		await axios
// 			.get(N8N_JSON_URL, testN8N)
// 			.then((response) => {
// 				console.log("Données envoyées avec succès :", response.data);
// 			})
// 			.catch((error) => {
// 				console.error("Erreur lors de l'envoi des données :", error);
// 			});
// 	} catch (error) {
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// router.get("/fetchRssFeed", async (req, res) => {
// 	try {
// 		const listNewsBDD = await fetchBDD();
// 		const listNewsRSS = await fetchRSSFeeds();

// 		const checkNews = async () => {
// 			let tableau = [];
// 			for (const news of listNewsRSS) {
// 				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });

// 				if (!existingBDDNews) {
// 					const newRssFeedNews = new rssFeedNews({
// 						title: news.title,
// 						url: news.url,
// 						publishedDate: news.publishedDate,
// 						status: "new",
// 						source: news.source,
// 					});
// 					await newRssFeedNews.save();
// 					tableau.push(newRssFeedNews);
// 				}
// 			}
// 			return tableau;
// 		};

// 		const changeStatus = async () => {
// 			for (const news of newTab) {
// 				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });
// 				if (existingBDDNews) {
// 					existingBDDNews.status = "displayed";
// 					await existingBDDNews.save();
// 				}
// 			}
// 		};

// 		const newTab = await checkNews();
// 		const finalTab = [...newTab, ...listNewsBDD];
// 		await changeStatus();

// 		res.status(200).json({
// 			success: true,
// 			dataFromBack: finalTab,
// 		});
// 	} catch (error) {
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// router.post("/validateNewsFromRSSFeed", async (req, res) => {
// 	try {
// 		let listNews = req.body.data;
// 		for (let news of listNews) {
// 			// Retrouver la news correspondante en BDD
// 			const newsFounded = await rssFeedNews.findOne({ url: news.url });

// 			// cas où status = displayed => scrap + changement status
// 			if (newsFounded.status == "displayed") {
// 				let final_description = await fetchArticleContent(
// 					newsFounded.url,
// 					newsFounded.source
// 				);
// 				console.log("news en train d'être srappée =>", newsFounded.title);
// 				newsFounded.complete_description = final_description;
// 				newsFounded.status = "waiting";
// 				newsFounded.keyword = news.keyword;
// 				await newsFounded.save();
// 			}
// 		}
// 		res.status(200).json({ sucess: "succès value" });
// 	} catch (error) {
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// router.post("/validateNewsFromRSSFeed_auto", async (req, res) => {
// 	try {
// 		let listNews = req.body.data;

// 		for (let news of listNews) {
// 			try {
// 				// Retrouver la news correspondante en BDD
// 				const newsFounded = await rssFeedNews.findOne({ title: news.title });

// 				if (!newsFounded) {
// 					console.warn(`❌ News non trouvée : ${news.title}`);
// 					continue;
// 				}

// 				// cas où status = displayed => scrap + changement status
// 				if (newsFounded.status === "displayed") {
// 					let final_description = await fetchArticleContent(
// 						newsFounded.url,
// 						newsFounded.source
// 					);

// 					console.log("✅ News scrappée =>", newsFounded.title);

// 					newsFounded.complete_description = final_description;
// 					newsFounded.status = "waiting";
// 					newsFounded.keyword = news.keyword;
// 					await newsFounded.save();
// 				} else {
// 					console.log(
// 						`ℹ️ News ignorée (status différent de 'displayed') : ${news.title}`
// 					);
// 				}
// 			} catch (error) {
// 				console.error(`❗ Erreur sur la news "${news.title}":`, error.message);
// 			}
// 		}
// 	} catch (error) {
// 		console.error("Erreur générale du traitement :", error.message);
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// router.get("/generateJSONfromRSSFeed", async (req, res) => {
// 	try {
// 		const allNews = await rssFeedNews.find();

// 		let listNews = [];

// 		for (let i = 0; i < allNews.length; i++) {
// 			// ne s'occuper que des news dont la date de publication est inférieure à X jours
// 			const isDateWithinXDay = await isDateWithinXDays(
// 				allNews[i].publishedDate,
// 				2
// 			);

// 			// si la date est inférieure à X jours
// 			if (isDateWithinXDay && allNews[i].status == "waiting") {
// 				listNews.push(allNews[i]);
// 			} else if (!isDateWithinXDay && allNews[i].status == "waiting") {
// 				allNews[i].status = "outdated";
// 				await allNews[i].save();
// 			}
// 		}
// 		res.status(200).json({
// 			success: true,
// 			dataFromBack: listNews,
// 			dataFromBackLength: listNews.length,
// 		});
// 	} catch (error) {
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// router.post("/changeStatusJSONNews", async (req, res) => {
// 	try {
// 		const newsToUpdate = req.body.data;

// 		for (let i = 0; i < newsToUpdate.length; i++) {
// 			const news = await rssFeedNews.findOne({ url: newsToUpdate[i].url });

// 			if (news) {
// 				if (newsToUpdate[i].status == "published") {
// 					news.status = "published";
// 					await news.save();
// 				}
// 				if (newsToUpdate[i].status == "delete") {
// 					news.status = "deleted";
// 					await news.save();
// 				}
// 			} else {
// 				console.log(
// 					"news introuvable",
// 					newsToUpdate[i].title,
// 					"-",
// 					newsToUpdate[i].url
// 				);
// 			}
// 		}
// 		res.status(200).json({
// 			success: "Base de donnée mise à jour",
// 		});
// 	} catch (error) {
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// router.get("/mediaFromWordpress", async (req, res) => {
// 	const siteUrl = process.env.WP_SITE_URL;
// 	const username = process.env.WP_USERNAME;
// 	const password = process.env.WP_PASSWORD;

// 	// Authentification basique en encodant le nom d'utilisateur et le mot de passe en Base64
// 	const auth = Buffer.from(`${username}:${password}`).toString("base64");

// 	// Fonction pour récupérer les médias

// 	try {
// 		const response = await axios.get(`${siteUrl}/wp-json/wp/v2/media`, {
// 			headers: {
// 				Authorization: `Basic ${auth}`,
// 			},
// 			params: {
// 				per_page: 100, // Nombre de médias à récupérer par page
// 				page: 1, // Numéro de la page à récupérer
// 				search: "Image générique",
// 			},
// 		});
// 		if (response.status === 200) {
// 			const mediaList = response.data.map((media) => ({
// 				id: media.id,
// 				title: media.title.rendered,
// 				url: media.source_url,
// 				altText: media.alt_text,
// 				mimeType: media.mime_type,
// 				caption: media.caption.rendered,
// 			}));
// 			res.status(200).json(mediaList);
// 		}
// 	} catch (error) {
// 		console.error(
// 			"Erreur lors de la récupération des médias :",
// 			error.response ? error.response.data : error.message
// 		);
// 	}
// });

// router.delete("/cleandatabase", async (req, res) => {
// 	try {
// 		const rssFeedNewsFounded = await rssFeedNews.find({ status: "displayed" });
// 		let deletedNews = [];

// 		for (let news of rssFeedNewsFounded) {
// 			const isRecent = isDateWithinXDays(news.publishedDate, 10);

// 			if (!isRecent) {
// 				await rssFeedNews.deleteOne({ _id: news._id });
// 				console.log("🗑️ Ancienne news supprimée :", news.title);
// 				deletedNews.push(news.title);
// 			}
// 		}

// 		res.status(200).json({
// 			success: true,
// 			message: `${deletedNews.length} news supprimées.`,
// 			deleted: deletedNews,
// 		});
// 	} catch (error) {
// 		res.status(500).json({ success: false, error: error.message });
// 	}
// });

// module.exports = router;



const express = require("express");
const router = express.Router();
const axios = require("axios");
const isDateWithinXDays = require("./services/newsServices");
const { fetchArticleContent } = require("./services/scrapNewsCoreeInfo");
const fetchRSSFeeds = require("./services/fetchRSSFeed");
const fetchBDD = require("./services/fetchBDDCoreeInfo");
const rssFeedNews = require("../modeles/rssFeedNews");

const N8N_JSON_URL = process.env.N8N_JSON_URL;

/**
 * Test sending news to N8N
 */
router.get("/testN8N", async (req, res) => {
	try {
		const listNewsBDD = await fetchBDD();
		const listNewsRSS = await fetchRSSFeeds();

		const checkNews = async () => {
			let tableau = [];
			for (const news of listNewsRSS) {
				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });

				if (!existingBDDNews) {
					const newRssFeedNews = new rssFeedNews({
						title: news.title,
						url: news.url,
						publishedDate: news.publishedDate,
						status: "new",
						source: news.source,
					});
					await newRssFeedNews.save();
					tableau.push(newRssFeedNews);
				}
			}
			return tableau;
		};

		const newTab = await checkNews();
		const finalTab = [...newTab, ...listNewsBDD];

		const changeStatus = async () => {
			for (const news of newTab) {
				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });
				if (existingBDDNews) {
					existingBDDNews.status = "displayed";
					await existingBDDNews.save();
				}
			}
		};

		await changeStatus();

		const testN8N = { data: finalTab };

		await axios.get(N8N_JSON_URL, testN8N)
			.then((response) => {
				console.log("✅ Data sent to N8N successfully:", response.data);
			})
			.catch((error) => {
				console.error("❌ Error sending data to N8N:", error.message);
			});

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("❗ Error in /testN8N:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Fetch RSS feeds and update database
 */
router.get("/fetchRssFeed", async (req, res) => {
	try {
		const listNewsBDD = await fetchBDD();
		const listNewsRSS = await fetchRSSFeeds();

		const checkNews = async () => {
			let tableau = [];
			for (const news of listNewsRSS) {
				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });
				if (!existingBDDNews) {
					const newRssFeedNews = new rssFeedNews({
						title: news.title,
						url: news.url,
						publishedDate: news.publishedDate,
						status: "new",
						source: news.source,
					});
					await newRssFeedNews.save();
					tableau.push(newRssFeedNews);
				}
			}
			return tableau;
		};

		const newTab = await checkNews();
		const finalTab = [...newTab, ...listNewsBDD];

		const changeStatus = async () => {
			for (const news of newTab) {
				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });
				if (existingBDDNews) {
					existingBDDNews.status = "displayed";
					await existingBDDNews.save();
				}
			}
		};

		await changeStatus();

		res.status(200).json({
			success: true,
			dataFromBack: finalTab,
		});
	} catch (error) {
		console.error("❗ Error in /fetchRssFeed:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Validate selected news manually
 */
router.post("/validateNewsFromRSSFeed", async (req, res) => {
	try {
		const listNews = req.body.data;
		let successCount = 0;
		let failedCount = 0;

		for (let news of listNews) {
			try {
				const newsFounded = await rssFeedNews.findOne({ url: news.url });
				if (newsFounded && newsFounded.status === "displayed") {
					const final_description = await fetchArticleContent(
						newsFounded.url,
						newsFounded.source
					);
					console.log("✅ News scrapped:", newsFounded.title);

					newsFounded.complete_description = final_description;
					newsFounded.status = "waiting";
					newsFounded.keyword = news.keyword;
					await newsFounded.save();
					successCount++;
				} else {
					console.warn(`⚠️ News ignored or not found: ${news?.title}`);
				}
			} catch (err) {
				console.error(`❌ Error processing news ${news?.title}:`, err.message);
				failedCount++;
			}
		}
		res.status(200).json({ success: true, successCount, failedCount });
	} catch (error) {
		console.error("❗ Error in /validateNewsFromRSSFeed:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Validate news from auto input
 */
router.post("/validateNewsFromRSSFeed_auto", async (req, res) => {
	try {
		const listNews = req.body.data;
		let successCount = 0;
		let failedCount = 0;

		for (let news of listNews) {
			try {
				const newsFounded = await rssFeedNews.findOne({ title: news.title });
				if (!newsFounded) {
					console.warn(`⚠️ News not found: ${news.title}`);
					continue;
				}

				if (newsFounded.status === "displayed") {
					const final_description = await fetchArticleContent(
						newsFounded.url,
						newsFounded.source
					);
					console.log("✅ News scrapped:", newsFounded.title);

					newsFounded.complete_description = final_description;
					newsFounded.status = "waiting";
					newsFounded.keyword = news.keyword;
					await newsFounded.save();
					successCount++;
				} else {
					console.log(`ℹ️ News skipped (not 'displayed'): ${news.title}`);
				}
			} catch (error) {
				console.error(`❗ Error on news "${news.title}":`, error.message);
				failedCount++;
			}
		}
		res.status(200).json({ success: true, successCount, failedCount });
	} catch (error) {
		console.error("❗ General error in /validateNewsFromRSSFeed_auto:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Generate JSON file from recent RSS news
 */
router.get("/generateJSONfromRSSFeed", async (req, res) => {
	try {
		const allNews = await rssFeedNews.find();
		let listNews = [];

		for (let news of allNews) {
			try {
				const isRecent = await isDateWithinXDays(news.publishedDate, 2);

				if (isRecent && news.status === "waiting") {
					listNews.push(news);
				} else if (!isRecent && news.status === "waiting") {
					news.status = "outdated";
					await news.save();
				}
			} catch (err) {
				console.error(`❗ Error processing news for JSON export:`, err.message);
			}
		}

		res.status(200).json({
			success: true,
			dataFromBack: listNews,
			dataFromBackLength: listNews.length,
		});
	} catch (error) {
		console.error("❗ Error in /generateJSONfromRSSFeed:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Update news status manually
 */
router.post("/changeStatusJSONNews", async (req, res) => {
	try {
		const newsToUpdate = req.body.data;

		for (let newsInput of newsToUpdate) {
			try {
				const news = await rssFeedNews.findOne({ url: newsInput.url });

				if (news) {
					if (newsInput.status === "published") {
						news.status = "published";
					}
					if (newsInput.status === "delete") {
						news.status = "deleted";
					}
					await news.save();
				} else {
					console.warn("⚠️ News not found:", newsInput.title, "-", newsInput.url);
				}
			} catch (err) {
				console.error(`❗ Error updating news ${newsInput.title}:`, err.message);
			}
		}

		res.status(200).json({
			success: true,
			message: "News status updated successfully",
		});
	} catch (error) {
		console.error("❗ Error in /changeStatusJSONNews:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Fetch media from Wordpress
 */
router.get("/mediaFromWordpress", async (req, res) => {
	const siteUrl = process.env.WP_SITE_URL;
	const username = process.env.WP_USERNAME;
	const password = process.env.WP_PASSWORD;
	const auth = Buffer.from(`${username}:${password}`).toString("base64");

	try {
		const response = await axios.get(`${siteUrl}/wp-json/wp/v2/media`, {
			headers: { Authorization: `Basic ${auth}` },
			params: { per_page: 100, page: 1, search: "Image générique" },
		});

		if (response.status === 200) {
			const mediaList = response.data.map((media) => ({
				id: media.id,
				title: media.title.rendered,
				url: media.source_url,
				altText: media.alt_text,
				mimeType: media.mime_type,
				caption: media.caption.rendered,
			}));

			res.status(200).json(mediaList);
		}
	} catch (error) {
		console.error("❗ Error fetching media from Wordpress:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Clean old displayed news
 */
router.delete("/cleandatabase", async (req, res) => {
	try {
		const rssFeedNewsFounded = await rssFeedNews.find({ status: "displayed" });
		let deletedNews = [];

		for (let news of rssFeedNewsFounded) {
			try {
				const isRecent = await isDateWithinXDays(news.publishedDate, 10);

				if (!isRecent) {
					await rssFeedNews.deleteOne({ _id: news._id });
					console.log("🗑️ Deleted old news:", news.title);
					deletedNews.push(news.title);
				}
			} catch (err) {
				console.error(`❗ Error deleting news ${news.title}:`, err.message);
			}
		}

		res.status(200).json({
			success: true,
			message: `${deletedNews.length} news deleted.`,
			deleted: deletedNews,
		});
	} catch (error) {
		console.error("❗ Error in /cleandatabase:", error.message);
		res.status(500).json({ success: false, error: error.message });
	}
});

module.exports = router;
