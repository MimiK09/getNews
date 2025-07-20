const puppeteer = require("puppeteer");

///////////////////////////////////////////////////////////////
// SCRAP YONHAP FR //// SCRAP YONHAP FR //// SCRAP YONHAP FR //
///////////////////////////////////////////////////////////////
const scrapeYonhapDataFr = async () => {
	console.log("Début du scrapping Yonhap");

	const browser = await puppeteer.launch({
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--disable-gpu",
			"--window-size=1920x1080",
			"--disable-web-security",
			"--disable-features=VizDisplayCompositor",
			"--no-first-run",
			"--disable-background-timer-throttling",
			"--disable-renderer-backgrounding",
			"--disable-backgrounding-occluded-windows"
		],
	});

	try {
		const page = await browser.newPage();

		// Configuration de la page avec optimisations
		await page.setViewport({ width: 1920, height: 1080 });
		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
		);

		// Désactiver les images et CSS pour accélérer le chargement
		await page.setRequestInterception(true);
		page.on('request', (req) => {
			const resourceType = req.resourceType();
			if (resourceType === 'stylesheet' || resourceType === 'image' || resourceType === 'font') {
				req.abort();
			} else {
				req.continue();
			}
		});

		// Gérer les erreurs de page
		page.on('error', (error) => {
			console.log('Erreur de page:', error.message);
		});

		page.on('pageerror', (error) => {
			console.log('Erreur JavaScript sur la page:', error.message);
		});

		const url = "https://fr.yna.co.kr/news";

		// Tentative de navigation avec plusieurs stratégies
		let response;
		try {
			console.log("Tentative de navigation vers:", url);
			response = await page.goto(url, {
				timeout: 60000, // Augmenter le timeout à 60 secondes
				waitUntil: 'domcontentloaded' // Attendre seulement le DOM, pas toutes les ressources
			});
		} catch (error) {
			console.log("Première tentative échouée, essai avec networkidle0");
			response = await page.goto(url, {
				timeout: 60000,
				waitUntil: 'networkidle0'
			});
		}

		if (!response) {
			throw new Error("Impossible de naviguer vers la page");
		}

		if (!response.ok()) {
			throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
		}

		console.log("Page chargée, recherche des articles...");

		// Attendre que le contenu se charge avec plusieurs tentatives
		let contentFound = false;
		const selectors = [
			".smain-list-type01",
			".list-type01",
			".main-list",
			".news-list",
			"article",
			".article-list",
			"[class*='list']",
			"[class*='article']"
		];

		for (const selector of selectors) {
			try {
				console.log(`Recherche du sélecteur: ${selector}`);
				await page.waitForSelector(selector, {
					timeout: 10000,
					visible: true,
				});
				console.log(`Sélecteur trouvé: ${selector}`);
				contentFound = true;
				break;
			} catch (error) {
				console.log(`Sélecteur ${selector} introuvable, essai suivant...`);
			}
		}

		if (!contentFound) {
			console.log("Aucun sélecteur trouvé, analyse du HTML...");
			const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
			console.log("Contenu de la page:", bodyText);
		}

		// Attendre un peu plus pour s'assurer que le contenu dynamique est chargé
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Extract elements and organize
		const results = await page.evaluate(() => {
			try {
				// Getting today's Date
				const today = new Date();
				const jour = String(today.getDate()).padStart(2, "0");
				const mois = String(today.getMonth() + 1).padStart(2, "0");
				const annee = String(today.getFullYear()).slice(-2);
				const todayFormatted = `${jour}.${mois}.${annee}`;

				// Essayer différents sélecteurs de manière plus flexible
				let articles = [];
				
				const selectorStrategies = [
					() => document.querySelectorAll(".smain-list-type01 li article"),
					() => document.querySelectorAll(".smain-list-type01 article"),
					() => document.querySelectorAll(".list-type01 li article"),
					() => document.querySelectorAll(".list-type01 article"),
					() => document.querySelectorAll("article"),
					() => document.querySelectorAll(".news-item"),
					() => document.querySelectorAll(".article-item"),
					() => document.querySelectorAll("[class*='article']"),
					() => document.querySelectorAll("li a[href*='view']"),
					() => document.querySelectorAll("a[href*='/news/']")
				];

				for (let i = 0; i < selectorStrategies.length; i++) {
					try {
						articles = selectorStrategies[i]();
						if (articles.length > 0) {
							console.log(`Articles trouvés avec la stratégie ${i + 1}: ${articles.length} articles`);
							break;
						}
					} catch (e) {
						console.log(`Erreur avec la stratégie ${i + 1}:`, e.message);
					}
				}

				if (articles.length === 0) {
					// Dernière tentative : analyser toute la page
					const allLinks = document.querySelectorAll('a[href]');
					const newsLinks = Array.from(allLinks).filter(link => 
						link.href && (
							link.href.includes('/news/') || 
							link.href.includes('/view/') ||
							link.textContent.trim().length > 10
						)
					);
					
					if (newsLinks.length > 0) {
						articles = newsLinks.slice(0, 20); // Limiter à 20 pour éviter le spam
						console.log(`Articles trouvés via liens génériques: ${articles.length}`);
					}
				}

				if (articles.length === 0) {
					return {
						error: "Aucun article trouvé",
						debug: {
							bodyLength: document.body.innerHTML.length,
							title: document.title,
							url: window.location.href,
							sampleHTML: document.body.innerHTML.substring(0, 1000)
						}
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
						let titleElement, title, link;

						if (article.tagName === 'A') {
							// Si c'est déjà un lien
							titleElement = article;
							title = article.textContent?.trim();
							link = article.href;
						} else {
							// Essayer différents sélecteurs pour le titre et le lien
							titleElement =
								article.querySelector(".tit a") ||
								article.querySelector("h3 a") ||
								article.querySelector("h2 a") ||
								article.querySelector("h1 a") ||
								article.querySelector("a") ||
								article.querySelector(".title") ||
								article.querySelector("[class*='title']");

							if (titleElement) {
								title = titleElement.textContent?.trim();
								link = titleElement.href;
							}
						}

						if (!title || !link) {
							console.log(`Article ${index}: Titre ou lien manquant`);
							return;
						}

						// Nettoyer le titre
						title = title.replace(/\s+/g, ' ').trim();

						if (title.length < 5 || excludedTitles.some(excluded => title.includes(excluded))) {
							return;
						}

						// Essayer de trouver la date
						let dateElement =
							article.querySelector(".date") ||
							article.querySelector(".time") ||
							article.querySelector(".datetime") ||
							article.querySelector("[class*='date']") ||
							article.querySelector("[class*='time']");

						let dateComplete = todayFormatted; // Par défaut aujourd'hui

						if (dateElement) {
							const details = dateElement.textContent;
							const dateMatch = details.match(/\b\d{2}\.\d{2}\b/);
							if (dateMatch) {
								dateComplete = dateMatch[0] + "." + annee;
							}
						}

						// S'assurer que l'URL est complète
						if (link && !link.startsWith('http')) {
							link = new URL(link, window.location.origin).href;
						}

						yonhapData.push({
							title: title,
							link: link,
							dateUpload: todayFormatted,
							dateComplete: dateComplete,
						});
					} catch (error) {
						console.error(`Erreur lors du traitement de l'article ${index}:`, error);
					}
				});

				console.log(`${yonhapData.length} articles traités avec succès`);
				return yonhapData;
			} catch (error) {
				console.error("Erreur dans l'évaluation:", error);
				return { 
					error: error.message,
					stack: error.stack
				};
			}
		});

		await browser.close();

		if (results?.error) {
			console.error("Erreur retournée:", results.error);
			if (results.debug) {
				console.log("Informations de debug:", results.debug);
			}
			return results;
		}

		console.log(`Scraping terminé avec succès: ${results.length} articles`);
		return results;
	} catch (error) {
		console.error("Erreur générale:", error.message);
		await browser.close();
		throw error;
	}
};

module.exports = scrapeYonhapDataFr;