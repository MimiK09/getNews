const puppeteer = require("puppeteer");

///////////////////////////////////////////////////////////////
// SCRAP YONHAP FR //// SCRAP YONHAP FR //// SCRAP YONHAP FR //
///////////////////////////////////////////////////////////////
const scrapeYonhapDataFr = async () => {
	console.log("Début du scrapping Yonhap");

	const browser = await puppeteer.launch({
		headless: true, // False pour debugger, passer à true en production
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--disable-gpu",
			"--window-size=1920x1080",
		],
	});

	try {
		const page = await browser.newPage();

		// Configuration de la page
		await page.setViewport({ width: 1920, height: 1080 });
		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
		);

		// Gestion des erreurs de navigation
		page.on("requestfailed", (request) => {
			console.log(
				"Requête échouée:",
				request.url(),
				request.failure().errorText
			);
		});

		const url = "https://fr.yna.co.kr/news";

		// Navigation avec timeout et gestion d'erreurs
		const response = await page.goto(url, {
			waitUntil: "networkidle2", // Attendre que le réseau soit stable
			timeout: 30000, // 30 secondes de timeout
		});

		if (!response.ok()) {
			throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
		}

		// Attendre que le contenu se charge
		try {
			await page.waitForSelector(".smain-list-type01", {
				timeout: 15000,
				visible: true,
			});
		} catch (error) {
			const bodyHTML = await page.content();

			// Essayer d'autres sélecteurs possibles
			const alternativeSelectors = [
				".list-type01",
				".main-list",
				".news-list",
				"article",
				".article-list",
			];

			for (const selector of alternativeSelectors) {
				try {
					await page.waitForSelector(selector, { timeout: 2000 });
					break;
				} catch (e) {
					console.log(`Sélecteur ${selector} introuvable`);
				}
			}
		}

		// Extract elements and organize
		const results = await page.evaluate(() => {
			try {
				// Getting today's Date
				const today = new Date();
				const jour = String(today.getDate()).padStart(2, "0");
				const mois = String(today.getMonth() + 1).padStart(2, "0");
				const annee = String(today.getFullYear()).slice(-2);
				const todayFormatted = `${jour}.${mois}.${annee}`;

				// Essayer différents sélecteurs
				let articles = document.querySelectorAll(
					".smain-list-type01 li article"
				);

				if (articles.length === 0) {
					// Sélecteurs alternatifs
					const alternativeSelectors = [
						".list-type01 li article",
						".main-list li article",
						"article",
						".news-item",
						".article-item",
					];

					for (const selector of alternativeSelectors) {
						articles = document.querySelectorAll(selector);
						if (articles.length > 0) {
							console.log(`Articles trouvés avec: ${selector}`);
							break;
						}
					}
				}

				if (articles.length === 0) {
					return {
						error: "Aucun article trouvé",
						html: document.body.innerHTML.substring(0, 2000),
					};
				}

				const yonhapData = [];
				const excludedTitles = [
					"KOSPI-ouverture",
					"KOSDAQ-ouverture",
					"FOREX-ouverture",
					"KOSPI-clôture",
					"KOSDAQ-clôture",
					"FOREX-clôture",
					"FOREX-Cours à 15h30",
					"Les principaux titres des quotidiens coréens",
					"Un jour dans l'histoire de la Corée",
				];

				// For each article
				articles.forEach((article, index) => {
					try {
						// Essayer différents sélecteurs pour le titre et le lien
						let titleElement =
							article.querySelector(".tit a") ||
							article.querySelector("h3 a") ||
							article.querySelector("h2 a") ||
							article.querySelector("a");

						let dateElement =
							article.querySelector(".date") ||
							article.querySelector(".time") ||
							article.querySelector(".datetime");

						if (!titleElement) {
							console.log(`Article ${index}: Titre introuvable`);
							return;
						}

						const title = titleElement.textContent?.trim();
						const link = titleElement.href;

						if (!title || excludedTitles.includes(title)) {
							return;
						}

						let dateComplete = todayFormatted; // Par défaut aujourd'hui

						if (dateElement) {
							const details = dateElement.textContent;
							const dateMatch = details.match(/\b\d{2}\.\d{2}\b/);
							if (dateMatch) {
								dateComplete = dateMatch[0] + "." + annee;
							}
						}

						yonhapData.push({
							title: title,
							link: link,
							dateUpload: todayFormatted,
							dateComplete: dateComplete,
						});
					} catch (error) {
						console.error(
							`Erreur lors du traitement de l'article ${index}:`,
							error
						);
					}
				});

				console.log(`${yonhapData.length} articles traités avec succès`);
				return yonhapData;
			} catch (error) {
				console.error("Erreur dans l'évaluation:", error);
				return { error: error.message };
			}
		});

		await browser.close();

		if (results?.error) {
			console.error("Erreur retournée:", results.error);
			if (results.html) {
				console.log("HTML retourné:", results.html);
			}
		}

		return results;
	} catch (error) {
		console.error("Erreur générale:", error.message);
		await browser.close();
		throw error;
	}
};

// Version avec retry automatique
const scrapeYonhapDataFrWithRetry = async (maxRetries = 3) => {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`Tentative ${attempt}/${maxRetries}`);
			const results = await scrapeYonhapDataFr();

			if (
				results &&
				!results.error &&
				Array.isArray(results) &&
				results.length > 0
			) {
				console.log(`Succès à la tentative ${attempt}`);
				return results;
			} else {
				throw new Error("Résultats vides ou invalides");
			}
		} catch (error) {
			console.error(`Tentative ${attempt} échouée:`, error.message);

			if (attempt === maxRetries) {
				throw new Error(
					`Échec après ${maxRetries} tentatives: ${error.message}`
				);
			}

			// Attendre avant de réessayer
			await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
		}
	}
};

module.exports = scrapeYonhapDataFr;
