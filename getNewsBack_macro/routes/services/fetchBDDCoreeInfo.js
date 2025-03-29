const {
	isDateWithinXDays,
} = require("./newsServices");

const rssFeedNews = require("../../modeles/rssFeedNews");

const fetchBDDCoreeInfo = async (status) => {
	let listNews = [];
    const rssFeedNewsFounded = await rssFeedNews.find({
        status: { $in: ["waiting", "displayed"] }
      });

	// Parcourir les différents élément de la BDD
	for (let i = 0; i < rssFeedNewsFounded.length; i++) {
		if (isDateWithinXDays(rssFeedNewsFounded[i].publishedDate, 1)) {
			listNews.push(rssFeedNewsFounded[i]);
		} else {
			// console.log("News vieille de plus de 2 jours");
		}
	}
	return listNews;
};

module.exports = fetchBDDCoreeInfo;
