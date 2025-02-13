const express = require("express");
const app = express();
const dotenv = require('dotenv').config()
const serveur = dotenv.parsed.SERVEUR;
const mongoose = require("mongoose");
const cors = require("cors");


app.use(cors());
app.use(express.json());

mongoose.connect(`${dotenv.parsed.DATABASE}/${dotenv.parsed.DATABASE_COLLECTION}`);
const db = mongoose.connection;

const newsRedditRoutes = require('./routes/newsRedditRoutes');
app.use(newsRedditRoutes)

const newsThreadRoutes = require('./routes/newsThreadRoutes');
app.use(newsThreadRoutes)

const newsCoreeInfoRoutes = require('./routes/newsCoreeInfoRoutes');
app.use(newsCoreeInfoRoutes)


app.listen(serveur, () => {
	console.log("Serveur backend démarré sur le port ", serveur);
});
