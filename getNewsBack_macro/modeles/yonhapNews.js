const mongoose = require("mongoose");
const dotenv = require('dotenv').config()

// si lien avec un autre modèle, alors il faut importer avec un require les autres modèles

const yonhapNews = mongoose.model(`${dotenv.parsed.DATABASE_DOCUMENT_FOR_REDDIT}`, {
	title: { type: String, require: true },
	link: { type: String, unique: true, require: true },
	dateUpload: { type: String, require: true },
	dateComplete: { type: String, require: true },
	publishReddit: { type: Boolean, require: true },
	status: { type: String, require: true },
	redditFlair: { type: String, require: true, default: "Actualité" },
});

module.exports = yonhapNews;
