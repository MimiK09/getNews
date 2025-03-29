const axios = require("axios");
const cheerio = require("cheerio");

const getSelectorBySource = async (source) => {
	switch (source) {
		case "yonhapEN":
		case "yonhapFR":
			return ".story-news";
		case "koreaherald":
			return ".news_content";
		case "koreatimes":
			return "#startts";
		case "joongang":
			return "#article_body";
		default:
			return null;
	}
};

const extractTextBetweenBr = async (html) => {
	const $ = cheerio.load(html);
	let result = "";

	$("body")
		.contents()
		.each((i, elem) => {
			if (elem.type === "text") {
				result += elem.data.trim() + " ";
			} else if (elem.type === "tag") {
				if (elem.name === "br") {
					result += "\n";
				} else {
					result += $(elem).text().trim() + " ";
				}
			}
		});

	return result.trim();
};

const fetchArticleContent = async (url, source) => {
	try {
		const response = await axios.get(url);
		const html = response.data;
		const $ = cheerio.load(html);

		// Obtenir le sélecteur basé sur la source
		const selector = await getSelectorBySource(source);
		if (!selector) {
			console.error("Source inconnue");
			return "";
		}

		if (source === "joongang") {
			// Cas spécifique pour le site avec des balises <br>
			const elementHtml = $(selector).html();
			const text = extractTextBetweenBr(elementHtml);
			return text;
		} else {
			// Sélectionner l'élément et récupérer le texte dans les balises <p>
			const element = $(selector);
			const paragraphs = element.find("p");
			const texts = paragraphs.map((i, p) => $(p).text().trim()).get();
			let final_description = "";
			if (texts.length === 0) {
				console.log("Aucun texte trouvé dans les balises <p>.");
			} else {
				texts.forEach((text) => {
					final_description += text;
				});
			}
			return final_description;
		}
	} catch (err) {
		console.error("Erreur lors du chargement de la page :", err);
		return "";
	}
};

module.exports = {
	fetchArticleContent,
};
