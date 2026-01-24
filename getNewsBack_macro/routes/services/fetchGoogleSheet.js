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

