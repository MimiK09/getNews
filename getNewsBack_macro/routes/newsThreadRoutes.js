const express = require("express");
const router = express.Router();

router.get("/test", async (req, res) => {
	try {
		console.log("it works");
		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

module.exports = router;
