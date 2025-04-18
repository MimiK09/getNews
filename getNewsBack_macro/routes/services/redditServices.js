const axios = require("axios");
const snoowrap = require("snoowrap");
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const reddit_app_id = process.env.REDDIT_APP_ID;
const reddit_app_password = process.env.REDDIT_APP_PASSWORD;

/////////////////////////////////////////////////////////
// GET FLAIRS FROM REDDIT ////  GET FLAIRS FROM REDDIT //
/////////////////////////////////////////////////////////
const getFlairs = async () => {
	try {
		const response = await axios.post(
			"https://www.reddit.com/api/v1/access_token",
			`grant_type=password&username=${username}&password=${password}`,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization:
						"Basic " +
						Buffer.from(`${reddit_app_id}:${reddit_app_password}`).toString(
							"base64"
						),
				},
			}
		);

		const accessToken = response.data.access_token;

		const reddit = new snoowrap({
			userAgent: "make a post", // name of the app
			accessToken: accessToken, // access token
		});

		const flairs = await reddit
			.getSubreddit("coreedusud")
			.getLinkFlairTemplates();

		return flairs;
	} catch (error) {
		// Gérez les erreurs éventuelles
		console.error("Erreur lors de la récupération des flairs :", error);
	}
};

///////////////////////////////////////////
///////////////////////////////////////////

///////////////////////////////////////////
// PUBLISH ON REDDIT // PUBLISH ON REDDIT //
///////////////////////////////////////////

const publishOnReddit_link = async (tab) => {
	// Get an access token
	const response = await axios.post(
		"https://www.reddit.com/api/v1/access_token",
		`grant_type=password&username=${username}&password=${password}`,
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization:
					"Basic " +
					Buffer.from(`${reddit_app_id}:${reddit_app_password}`).toString(
						"base64"
					),
			},
		}
	);

	const accessToken = response.data.access_token;

	// Initialization
	const flairs = await getFlairs();

	const postLink = async (accessToken, tab) => {
		try {
			// Initialization of a Snoowrap client with access token
			const reddit = new snoowrap({
				userAgent: "make a post", // name of the app
				accessToken: accessToken, // access token
			});

			// Using client to post a link after getting flair ID
			for (let i = 0; i < tab.length; i++) {
				//Getting the good flair ID to the link

				const getFlairTemplateId = (flairText) => {
					const flair = flairs.find((f) => f.flair_text === flairText);

					return flair ? flair.flair_template_id : null;
				};

				let flair_id = await getFlairTemplateId(tab[i].redditFlair);

				//Post a link
				const submission = await reddit.getSubreddit("coreedusud").submitLink({
					title: tab[i].title,
					url: tab[i].link,
				});
				await submission.selectFlair({
					flair_template_id: flair_id,
				});

				console.log("submit =>", submission, "title => ", tab[i].title);
			} // Display details of published news
		} catch (error) {
			console.error("problème lors de la publication", error);
		}
	};

	// Function called to post a link
	postLink(accessToken, tab);
};

const publishOnReddit_content = async (tab) => {
	// Get an access token

	const response = await axios.post(
		"https://www.reddit.com/api/v1/access_token",
		`grant_type=password&username=${username}&password=${password}`,
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization:
					"Basic " +
					Buffer.from(`${reddit_app_id}:${reddit_app_password}`).toString(
						"base64"
					),
			},
		}
	);

	const accessToken = response.data.access_token;

	const postLink = async (accessToken, tab) => {
		try {
			// Initialization of a Snoowrap client with access token
			const reddit = new snoowrap({
				userAgent: "make a post", // name of the app
				accessToken: accessToken, // access token
			});

			// Using client to post a link after getting flair ID
			for (let i = 0; i < tab.length; i++) {
				//Post
				const submission = await reddit
					.getSubreddit("coreedusud")
					.submitSelfpost({
						title: tab[i].title,
						text: tab[i].content,
					});

				console.log("submit =>", submission, "title => ", tab[i].title);
			} // Display details of published news
		} catch (error) {
			console.error("problème lors de la publication", error);
		}
	};

	// Function called to post a link
	postLink(accessToken, tab);
};
///////////////////////////////////////////
///////////////////////////////////////////

module.exports = {
	getFlairs,
	publishOnReddit_link,
	publishOnReddit_content,
};
