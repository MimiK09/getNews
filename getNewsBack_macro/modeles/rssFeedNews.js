const mongoose = require("mongoose");

// si lien avec un autre modèle, alors il faut importer avec un require les autres modèles

const rssFeedNews = mongoose.model(
	`${process.env.DATABASE_DOCUMENT_RSS_FEED}`,
	{
		title: { type: String, require: true },
		url: { type: String, unique: true, require: true },
		publishedDate: { type: String, require: true },
		complete_description: { type: String, require: false },
		status: { type: String, require: true },
		source: { type: String, require: true },
	}
);

module.exports = rssFeedNews;
