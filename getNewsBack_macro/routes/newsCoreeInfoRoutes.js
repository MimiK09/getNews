const express = require("express");
const router = express.Router();
const axios = require("axios");
const { isDateWithinXDays } = require("./services/newsServices");
const { fetchArticleContent } = require("./services/scrapNewsCoreeInfo");
const fetchRSSFeeds = require("./services/fetchRSSFeed");
const fetchBDD = require("./services/fetchBDDCoreeInfo");
const rssFeedNews = require("../modeles/rssFeedNews");

////////////////////// NEW //////////////////////////
////////////////////// NEW //////////////////////////
////////////////////// NEW //////////////////////////
////////////////////// NEW //////////////////////////

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

		const changeStatus = async () => {
			for (const news of newTab) {
				const existingBDDNews = await rssFeedNews.findOne({ url: news.url });
				if (existingBDDNews) {
					existingBDDNews.status = "displayed";
					await existingBDDNews.save();
				}
			}
		};

		const newTab = await checkNews();
		const finalTab = [...newTab, ...listNewsBDD];
		await changeStatus();
		res.status(200).json({
			success: true,
			dataFromBack: finalTab,
		});
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

router.post("/validateNewsFromRSSFeed", async (req, res) => {
	try {
		let listNews = req.body.data;
		for (let news of listNews) {
			// Retrouver la news correspondante en BDD
			const newsFounded = await rssFeedNews.findOne({ url: news.url });

			// cas où status = displayed => scrap + changement status
			if (newsFounded.status == "displayed") {
				let final_description = await fetchArticleContent(
					newsFounded.url,
					newsFounded.source
				);
				newsFounded.complete_description = final_description;
				newsFounded.status = "waiting";
				newsFounded.keyword = news.keyword;
				await newsFounded.save();
			}
		}
		res.status(200).json({ sucess: "succès value" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

////////////////////// NO CHANGE //////////////////////////
////////////////////// NO CHANGE //////////////////////////
////////////////////// NO CHANGE //////////////////////////
////////////////////// NO CHANGE //////////////////////////

router.get("/generateJSONfromRSSFeed", async (req, res) => {
	try {
		console.log("je passe 1")
		const allNews = await rssFeedNews.find();
		console.log("je passe 2")

		let listNews = [];
		console.log("je passe 3")


		for (let i = 0; i < allNews.length; i++) {
			// ne s'occuper que des news dont la date de publication est inférieure à X jours
			const isDateWithinXDay = await isDateWithinXDays(
				allNews[i].publishedDate,
				2
			);

			// si la date est inférieure à X jours
			if (isDateWithinXDay && allNews[i].status == "waiting") {
				listNews.push(allNews[i]);
			} else if (!isDateWithinXDay && allNews[i].status == "waiting") {
				allNews[i].status = "outdated";
				await allNews[i].save();
			}
		}
		res.status(200).json({
			success: true,
			dataFromBack: listNews,
			dataFromBackLength: listNews.length,
		});
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

router.post("/changeStatusJSONNews", async (req, res) => {
	try {
		const newsToUpdate = req.body.data;

		for (let i = 0; i < newsToUpdate.length; i++) {
			const news = await rssFeedNews.findOne({ url: newsToUpdate[i].url });

			if (news) {
				if (newsToUpdate[i].status == "published") {
					news.status = "published";
					await news.save();
				}
				if (newsToUpdate[i].status == "delete") {
					news.status = "deleted";
					await news.save();
				}
			} else {
				console.log(
					"news introuvable",
					newsToUpdate[i].title,
					"-",
					newsToUpdate[i].url
				);
			}
		}
		res.status(200).json({
			success: "Base de donnée mise à jour",
		});
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

router.get("/mediaFromWordpress", async (req, res) => {
	const siteUrl = process.env.WP_SITE_URL;
	const username = process.env.WP_USERNAME;
	const password = process.env.WP_PASSWORD;

	// Authentification basique en encodant le nom d'utilisateur et le mot de passe en Base64
	const auth = Buffer.from(`${username}:${password}`).toString("base64");

	// Fonction pour récupérer les médias

	try {
		const response = await axios.get(`${siteUrl}/wp-json/wp/v2/media`, {
			headers: {
				Authorization: `Basic ${auth}`,
			},
			params: {
				per_page: 100, // Nombre de médias à récupérer par page
				page: 1, // Numéro de la page à récupérer
				search: "Image générique",
			},
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
		console.error(
			"Erreur lors de la récupération des médias :",
			error.response ? error.response.data : error.message
		);
	}
});

router.delete("/cleandatabase", async (req, res) => {
	try {
		const rssFeedNewsFounded = await rssFeedNews.find({
			status: "outdated",
		});
		for (let i = 0; i < rssFeedNewsFounded.length; i++) {
			let result = isDateWithinXDays(rssFeedNewsFounded[i].publishedDate, 10);
			if (!result) {
				console.log("ancienne news supprimée", rssFeedNewsFounded[i]);
			}
		}
	} catch (error) {
		console.error("La suppression n'a pas eu lieu", error.response);
	}
});


module.exports = router;
