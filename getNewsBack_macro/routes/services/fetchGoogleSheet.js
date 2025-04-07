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
	"token.json"
);
const CREDENTIALS_PATH = path.join(
	process.cwd(),
	"routes",
	"services",
	"documents",
	"secret",
	"credentials.json"
);

const fetchGoogleSheet = async () => {
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

		async function listMajors(auth) {
			const sheets = google.sheets({ version: "v4", auth });
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: "1-zQHBYRfAq7VIIGBu2obpMPydRDBAgJi3AGS9jDxQnM",
				range: "Liste Threads!A:E",
			});
			const rows = res.data.values;
			if (!rows || rows.length === 0) {
				console.log("No data found.");
				return;
			}

			const tab = [];
			rows.forEach((row) => {
				tab.push(`${row[0]}`);
				console.log(`${row[0]}`);
			});
            return tab
		}
		const tabToExport = authorize().then(listMajors);
        return tabToExport
	} catch (error) {
		console.error;
	}
};

module.exports = fetchGoogleSheet;
