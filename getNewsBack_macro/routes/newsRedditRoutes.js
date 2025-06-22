const express = require("express");
const router = express.Router();
const scrapeYonhapDataFr = require("./services/scrapYonhapData");
const {
	getFlairs,
	publishOnReddit_link,
	publishOnReddit_content,
} = require("./services/redditServices");
const fetchGoogleSheet = require("./services/fetchGoogleSheet");
const getNewsFromGoogle = require("./services/fetchGoogleNews");
const yonhapNews = require("../modeles/yonhapNews");
const validateNewsReddit = require('../middlewares/validateNewsReddit');

///////////////////////////////////////////
// API get news from google & Yonhap
///////////////////////////////////////////
router.get("/getNewsForRedditFr", async (req, res) => {
	try {
		const dataGoogle = await getNewsFromGoogle();
		console.log("getNewsFromGoogle")
		const dataYonhap = await scrapeYonhapDataFr();
		console.log("scrapeYonhapDataFr")

		const fullDatas = dataGoogle.concat(dataYonhap);
		let savedNews = [];

		for (let i = 0; i < fullDatas.length; i++) {
			const yonhapNewsFounded = await yonhapNews.findOne({
				link: fullDatas[i].link,
			});
			if (!yonhapNewsFounded) {
				const newYonhapNews = new yonhapNews({
					title: fullDatas[i].title,
					link: fullDatas[i].link,
					dateUpload: fullDatas[i].dateUpload,
					dateComplete: fullDatas[i].dateComplete,
					publishReddit: false,
					redditFlair: "Actualité",
					status: "waiting",
				});
				await newYonhapNews.save();
				savedNews.push(newYonhapNews);
			} else {
				console.log("la news est déjà en Database : ", yonhapNewsFounded.title);
			}
		}

		res.status(200).json({ success: true, data: savedNews });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

///////////////////////////////////////////
// API pour publier sur Reddit
///////////////////////////////////////////
router.post("/publishReddit", async (req, res) => {
	try {
		const yonhapNewsFounded = await yonhapNews.find({
			status: "ok",
			publishReddit: false,
		});

		await publishOnReddit_link(yonhapNewsFounded);

		for (let i = 0; i < yonhapNewsFounded.length; i++) {
			const yonhapNewsToUpdate = await yonhapNews.findOne({
				_id: yonhapNewsFounded[i]._id,
			});
			yonhapNewsToUpdate.publishReddit = true;
			await yonhapNewsToUpdate.save();
		}

		res.status(200).json({ success: true, data: yonhapNewsFounded });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

router.post("/publishReddit_content", async (req, res) => {
	try {
		tab = await fetchGoogleSheet("Liste Threads!A:G", [1, 2]);
		await publishOnReddit_content(tab);
		res.status(200).json({ success: true, data: tab });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

///////////////////////////////////////////
// API pour évaluer les news
///////////////////////////////////////////
router.get("/evaluateNewsRedditFR", async (req, res) => {
	try {
		const flairs = await getFlairs();
		const yonhapNewsFounded = await yonhapNews.find({
			status: "waiting",
			publishReddit: false,
		});
		res
			.status(200)
			.json({ success: true, data: yonhapNewsFounded, flairs: flairs });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

///////////////////////////////////////////
// API pour valider les news
///////////////////////////////////////////
router.post("/validateNews", validateNewsReddit, async (req, res) => {
	try {
		const dataSent = req.body.data;

		for (let j = 0; j < dataSent.length; j++) {
			if (dataSent[j].action === "publish") {
				const yonhapNewsFounded = await yonhapNews.findOne({
					_id: dataSent[j].id,
				});
				yonhapNewsFounded.status = "ok";
				yonhapNewsFounded.redditFlair = dataSent[j].flair;
				await yonhapNewsFounded.save();
			} else if (dataSent[j].action === "delete") {
				const yonhapNewsFounded = await yonhapNews.findOne({
					_id: dataSent[j].id,
				});
				yonhapNewsFounded.status = "no";
				await yonhapNewsFounded.save();
			}
		}
		res.status(200).json({ success: true, dataSent: dataSent });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

module.exports = router;
