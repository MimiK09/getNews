const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const getSelectorBySource = async (source) => {
	switch (source) {
		case "yonhapEN":
		case "yonhapFR":
			return ".story-news";
		case "koreaherald":
			return ".news_content";
		case "koreatimes":
			return ".EditorContents_contents__yyFoA";
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

const fetchWithCheerio = async (url, selector, source) => {
	const response = await axios.get(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
		},
	});
	const html = response.data;
	const $ = cheerio.load(html);

	if (source === "joongang") {
		const elementHtml = $(selector).html();
		if (!elementHtml) return "";
		return await extractTextBetweenBr(elementHtml);
	}

	const element = $(selector);
	if (element.length === 0) return "";

	const paragraphs = element.find("p");
	if (paragraphs.length === 0) return "";

	const texts = paragraphs.map((i, p) => $(p).text().trim()).get();
	return texts.join("\n").trim();
};

const fetchWithPuppeteer = async (url, selector) => {
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();

	await page.setUserAgent(
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0"
	);

	await page.goto(url, { waitUntil: "networkidle2" });
	await page.waitForSelector(selector, { timeout: 10000 });

	const content = await page.$$eval(`${selector} p`, (nodes) =>
		nodes.map((n) => n.innerText.trim()).join("\n")
	);

	await browser.close();
	return content;
};

const fetchArticleContent = async (url, source) => {
	const selector = await getSelectorBySource(source);
	if (!selector) {
		console.error("Source inconnue");
		return "";
	}

	try {
		// Korea Times est dynamique → Puppeteer car contenu qui évolue (la classe de la div parente)
		if (source === "koreatimes") {
			return await fetchWithPuppeteer(url, selector);
		}

		// Les autres → Axios + Cheerio
		return await fetchWithCheerio(url, selector, source);
	} catch (err) {
		console.error("Erreur lors du chargement de l'article :", err.message);
		return "";
	}
};

module.exports = {
	fetchArticleContent,
};
