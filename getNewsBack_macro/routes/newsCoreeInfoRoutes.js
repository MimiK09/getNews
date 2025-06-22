const express = require("express");
const router = express.Router();
const axios = require("axios");
const isDateWithinXDays = require("./services/newsServices");
const { fetchArticleContent } = require("./services/scrapNewsCoreeInfo");
const fetchRSSFeeds = require("./services/fetchRSSFeed");
const fetchBDD = require("./services/fetchBDDCoreeInfo");
const rssFeedNews = require("../modeles/rssFeedNews");
const { validateNewsFromRSSFeed } = require('../middlewares/validateNewsCoreeInfo');

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
router.post("/validateNewsFromRSSFeed", validateNewsFromRSSFeed, async (req, res) => {
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
router.post("/validateNewsFromRSSFeed_auto", validateNewsFromRSSFeed, async (req, res) => {
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
