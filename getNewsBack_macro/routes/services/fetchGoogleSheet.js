const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

const TOKEN_PATH = path.join(
	process.cwd(),
	"routes",
	"services",
	"documents",
	"secret",
	"token_googlesheet.json"
);
const CREDENTIALS_PATH = path.join(
	process.cwd(),
	"routes",
	"services",
	"documents",
	"secret",
	"credentials_googlesheet.json"
);

const fetchGoogleSheet = async (range, listColumns) => {
	try {
		async function loadSavedCredentialsIfExist() {
			try {
				const content = await fs.readFile(TOKEN_PATH);
				const credentials = JSON.parse(content);
				return google.auth.fromJSON(credentials);
			} catch (err) {
				return null;
			}
		}

		async function saveCredentials(client) {
			const content = await fs.readFile(CREDENTIALS_PATH);
			const keys = JSON.parse(content);
			const key = keys.installed || keys.web;
			const payload = JSON.stringify({
				type: "authorized_user",
				client_id: key.client_id,
				client_secret: key.client_secret,
				refresh_token: client.credentials.refresh_token,
			});
			await fs.writeFile(TOKEN_PATH, payload);
		}

		async function authorize() {
			try {
				let client = await loadSavedCredentialsIfExist();
				if (client) {
					// Test the refresh token
					try {
						await client.getAccessToken();
						console.log("Token refreshed successfully.");
						return client;
					} catch (refreshError) {
						console.error("Failed to refresh token:", refreshError);
						console.log("Attempting re-authentication.");
						client = null; // Force re-authentication
					}
				}

				if (!client) {
					client = await authenticate({
						scopes: SCOPES,
						keyfilePath: CREDENTIALS_PATH,
					});
					if (client.credentials) {
						await saveCredentials(client);
					}
				}
				return client;
			} catch (authError) {
				console.error("Authentication error:", authError);
				throw authError; // Re-throw the error
			}
		}

		async function listMajors(auth, range, listColumns) {
			const sheets = google.sheets({ version: "v4", auth });
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: "1-zQHBYRfAq7VIIGBu2obpMPydRDBAgJi3AGS9jDxQnM",
				range: range,
			});
			const rows = res.data.values;
			if (!rows || rows.length === 0) {
				console.log("No data found.");
				return;
			}

			if (listColumns.length === 1) {
				const tabWithNewsFromGS = [];
				rows.forEach((row) => {
					tabWithNewsFromGS.push(`${row[`${listColumns[0]}`]}`);
					console.log(
						`je récupère depuis googlesheet : ${row[`${listColumns[0]}`]}`
					);
				});
				return tabWithNewsFromGS;
			} else {
				const tabWithNewsFromGS = [];
				rows.forEach((row) => {
					tabWithNewsFromGS.push({
						title: `${row[`${listColumns[0]}`]}`,
						content: `${row[`${listColumns[1]}`]}`,
					});
					console.log(
						`je récupère depuis googlesheet : ${{
							title: `${row[`${listColumns[0]}`]}`,
							content: `${row[`${listColumns[1]}`]}`,
						}}`
					);
				});
				return tabWithNewsFromGS;
			}
		}
		const tabToExport = authorize().then((auth) =>
			listMajors(auth, range, listColumns)
		);
		return tabToExport;
	} catch (error) {
		console.error;
	}
};

module.exports = fetchGoogleSheet;



////////
//NEWS
////////

// const fs = require("fs").promises;
// const path = require("path");
// const process = require("process");
// const { authenticate } = require("@google-cloud/local-auth");
// const { google } = require("googleapis");
// const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// // Chemins ajustés en fonction de la structure de dossiers réelle
// const TOKEN_PATH = path.join(
//   process.cwd(),
//   "getNewsBack_macro",
//   "routes",
//   "services",
//   "documents",
//   "secret",
//   "token_googlesheet.json"
// );
// const CREDENTIALS_PATH = path.join(
//   process.cwd(),
//   "getNewsBack_macro",
//   "routes",
//   "services",
//   "documents",
//   "secret",
//   "credentials_googlesheet.json"
// );

// // Vérifier si les fichiers existent
// const checkCredentialsFiles = async () => {
//   try {
//     await fs.access(CREDENTIALS_PATH);
//     console.log("✅ Fichier credentials trouvé à:", CREDENTIALS_PATH);
//   } catch (error) {
//     console.error("❌ ERREUR: Fichier credentials non trouvé à:", CREDENTIALS_PATH);
//     console.log("\nAssurez-vous que vos fichiers d'authentification Google sont bien présents.");
//     console.log("Vous pouvez aussi modifier les chemins TOKEN_PATH et CREDENTIALS_PATH dans le code.");
//   }
// };

// /**
//  * Convertit une lettre de colonne (A, B, C...) en index numérique (0, 1, 2...)
//  * @param {string} columnLetter - Lettre de la colonne (A-Z, AA-ZZ)
//  * @return {number} Index numérique de la colonne
//  */
// function columnLetterToIndex(columnLetter) {
//   let result = 0;
//   for (let i = 0; i < columnLetter.length; i++) {
//     result = result * 26 + (columnLetter.charCodeAt(i) - 64);
//   }
//   return result - 1; // -1 car l'index commence à 0
// }

// /**
//  * Récupère les données d'une Google Sheet avec spécification de colonnes par lettres
//  * @param {string} range - Plage de cellules (ex: "Sheet1!A1:D10")
//  * @param {string[]} columnLetters - Tableau de lettres de colonnes à extraire (ex: ["A", "C"])
//  * @param {object} options - Options supplémentaires
//  * @param {string[]} options.headers - Noms des propriétés pour les objets de sortie
//  * @return {Promise<Array>} Données extraites de la feuille
//  */
// const fetchGoogleSheet = async (range, columnLetters, options = {}) => {
//   try {
//     async function loadSavedCredentialsIfExist() {
//       try {
//         const content = await fs.readFile(TOKEN_PATH);
//         const credentials = JSON.parse(content);
//         return google.auth.fromJSON(credentials);
//       } catch (err) {
//         return null;
//       }
//     }

//     async function saveCredentials(client) {
//       const content = await fs.readFile(CREDENTIALS_PATH);
//       const keys = JSON.parse(content);
//       const key = keys.installed || keys.web;
//       const payload = JSON.stringify({
//         type: "authorized_user",
//         client_id: key.client_id,
//         client_secret: key.client_secret,
//         refresh_token: client.credentials.refresh_token,
//       });
//       await fs.writeFile(TOKEN_PATH, payload);
//     }

//     async function authorize() {
//       try {
//         let client = await loadSavedCredentialsIfExist();
//         if (client) {
//           // Test the refresh token
//           try {
//             await client.getAccessToken();
//             console.log("Token refreshed successfully.");
//             return client;
//           } catch (refreshError) {
//             console.error("Failed to refresh token:", refreshError);
//             console.log("Attempting re-authentication.");
//             client = null; // Force re-authentication
//           }
//         }
//         if (!client) {
//           client = await authenticate({
//             scopes: SCOPES,
//             keyfilePath: CREDENTIALS_PATH,
//           });
//           if (client.credentials) {
//             await saveCredentials(client);
//           }
//         }
//         return client;
//       } catch (authError) {
//         console.error("Authentication error:", authError);
//         throw authError; // Re-throw the error
//       }
//     }

//     async function getSheetData(auth, range, columnLetters, options) {
//       const sheets = google.sheets({ version: "v4", auth });
//       const res = await sheets.spreadsheets.values.get({
//         spreadsheetId: "1-zQHBYRfAq7VIIGBu2obpMPydRDBAgJi3AGS9jDxQnM",
//         range: range,
//       });
      
//       const rows = res.data.values;
//       if (!rows || rows.length === 0) {
//         console.log("No data found.");
//         return [];
//       }

//       // Convertir les lettres de colonnes en indices
//       const columnIndices = columnLetters.map(letter => columnLetterToIndex(letter));
      
//       // Si les headers sont fournis, les utiliser comme noms de propriétés
//       const headers = options.headers || columnLetters;
      
//       return rows.map(row => {
//         if (columnIndices.length === 1) {
//           // Si une seule colonne est demandée, retourner directement la valeur
//           return row[columnIndices[0]] || "";
//         } else {
//           // Sinon, créer un objet avec les valeurs demandées
//           const result = {};
//           columnIndices.forEach((index, i) => {
//             result[headers[i]] = row[index] || "";
//           });
//           return result;
//         }
//       });
//     }

//     const tabToExport = authorize().then(auth =>
//       getSheetData(auth, range, columnLetters, options)
//     );
    
//     return tabToExport;
//   } catch (error) {
//     console.error("Error in fetchGoogleSheet:", error);
//     throw error;
//   }
// };

// module.exports = fetchGoogleSheet;

// // Code de test (sera exécuté uniquement si ce fichier est lancé directement avec Node.js)
// if (require.main === module) {
//   // Vérifie d'abord si les fichiers d'authentification existent
//   checkCredentialsFiles();
  
//   // Fonction de test autonome
//   async function testFetchGoogleSheet() {
//     try {
//       console.log("=== TEST 1: Récupération d'une seule colonne ===");
//       const test1 = await fetchGoogleSheet(
//         "Details_V2!A1:Z10", // Ajustez la plage selon votre feuille
//         ["A"]
//       );
//       console.log("Résultat (colonne A):", test1);

//       console.log("\n=== TEST 2: Récupération de plusieurs colonnes ===");
//       const test2 = await fetchGoogleSheet(
//         "Details_V2!A1:Z10", // Ajustez la plage selon votre feuille
//         ["A", "C", "E"]
//       );
//       console.log("Résultat (colonnes A, C, E):", test2);

//       console.log("\n=== TEST 3: Récupération avec noms personnalisés ===");
//       const test3 = await fetchGoogleSheet(
//         "Details_V2!A1:Z10", // Ajustez la plage selon votre feuille
//         ["A", "B"], 
//         { headers: ["title", "content"] }
//       );
//       console.log("Résultat avec headers personnalisés:", test3);
//     } catch (error) {
//       console.error("Erreur lors du test:", error);
//     }
//   }

//   // Exécution du test
//   console.log("Démarrage des tests...");
//   testFetchGoogleSheet()
//     .then(() => console.log("Tests terminés avec succès!"))
//     .catch((err) => console.error("Tests échoués:", err));
// }