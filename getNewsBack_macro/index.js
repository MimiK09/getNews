const express = require("express");
const app = express();
const dotenv = require('dotenv').config()
const serveur = process.env.SERVEUR;
const mongoose = require("mongoose");
const cors = require("cors");
const loadEnv = require("./config/loadEnv"); // Importer la fonction de chargement

// Charger l'environnement
loadEnv();

app.use(cors());
app.use(express.json());

mongoose.connect(`${process.env.DATABASE}/${process.env.DATABASE_COLLECTION}`);
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
