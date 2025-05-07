
const axios = require("axios");
const snoowrap = require("snoowrap");
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const reddit_app_id = process.env.REDDIT_APP_ID;
const reddit_app_password = process.env.REDDIT_APP_PASSWORD;

/////////////////////////////////////////////////////////
// GET ACCESS TOKEN /////////////////////////////////////
/////////////////////////////////////////////////////////
const getRedditAccessToken = async () => {
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
    return response.data.access_token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token Reddit :", error);
    throw error;
  }
};

/////////////////////////////////////////////////////////
// GET FLAIRS FROM REDDIT ////  GET FLAIRS FROM REDDIT //
/////////////////////////////////////////////////////////
const getFlairs = async () => {
  try {
    const accessToken = await getRedditAccessToken();

    const reddit = new snoowrap({
      userAgent: "make a post",
      accessToken: accessToken,
    });

    const flairs = await reddit
      .getSubreddit("coreedusud")
      .getLinkFlairTemplates();

    return flairs;
  } catch (error) {
    console.error("Erreur lors de la récupération des flairs :", error);
  }
};

/////////////////////////////////////////////////////////
// SUBMIT POST (LINK or TEXT) ///////////////////////////
/////////////////////////////////////////////////////////
const submitPost = async ({ reddit, type, title, content, url, flair_id }) => {
  const subreddit = reddit.getSubreddit("coreedusud");

  const submission = await subreddit[
    type === "link" ? "submitLink" : "submitSelfpost"
  ]({
    title,
    ...(type === "link" ? { url } : { text: content }),
  });

  if (flair_id) {
    await submission.selectFlair({ flair_template_id: flair_id });
  }

  console.log("submit =>", submission, "title =>", title);
};

///////////////////////////////////////////
// PUBLISH ON REDDIT - LINK POST /////////
///////////////////////////////////////////
const publishOnReddit_link = async (tab) => {
  try {
    const accessToken = await getRedditAccessToken();
    const flairs = await getFlairs();

    const reddit = new snoowrap({
      userAgent: "make a post",
      accessToken: accessToken,
    });

    const getFlairTemplateId = (flairText) => {
      const flair = flairs.find((f) => f.flair_text === flairText);
      return flair ? flair.flair_template_id : null;
    };

    for (let i = 0; i < tab.length; i++) {
      try {
        const flair_id = getFlairTemplateId(tab[i].redditFlair);

        await submitPost({
          reddit,
          type: "link",
          title: tab[i].title,
          url: tab[i].link,
          flair_id,
        });
      } catch (postError) {
        console.error("Erreur lors de la soumission du lien :", postError);
      }
    }
  } catch (error) {
    console.error("Erreur dans publishOnReddit_link :", error);
  }
};

///////////////////////////////////////////
// PUBLISH ON REDDIT - TEXT POST /////////
///////////////////////////////////////////
const publishOnReddit_content = async (tab) => {
  try {
    const accessToken = await getRedditAccessToken();

    const reddit = new snoowrap({
      userAgent: "make a post",
      accessToken: accessToken,
    });

    for (let i = 0; i < tab.length; i++) {
      try {
        await submitPost({
          reddit,
          type: "text",
          title: tab[i].title,
          content: tab[i].content,
        });
      } catch (postError) {
        console.error("Erreur lors de la soumission du post texte :", postError);
      }
    }
  } catch (error) {
    console.error("Erreur dans publishOnReddit_content :", error);
  }
};

module.exports = {
  getFlairs,
  publishOnReddit_link,
  publishOnReddit_content,
};
