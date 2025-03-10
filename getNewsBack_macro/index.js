const express = require("express");
const app = express();
const loadEnv = require("./config/loadEnv"); // Charger d'abord l'env !
loadEnv(); // Charge l'environnement correct

const mongoose = require("mongoose");
const cors = require("cors");

const serveur = process.env.SERVEUR; // Maintenant l'ENV est bien défini !

app.use(cors());
app.use(express.json());

// 🛠 Ajout d'un log pour voir la BDD utilisée
console.log("Connexion à la BDD :", `${process.env.DATABASE}/${process.env.DATABASE_COLLECTION}`);

mongoose.connect(`${process.env.DATABASE}/${process.env.DATABASE_COLLECTION}`);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Erreur de connexion MongoDB :"));
db.once("open", () => {
	console.log("Connexion MongoDB réussie !");
});

const newsRedditRoutes = require('./routes/newsRedditRoutes');
app.use(newsRedditRoutes)

const newsThreadRoutes = require('./routes/newsThreadRoutes');
app.use(newsThreadRoutes)

const newsCoreeInfoRoutes = require('./routes/newsCoreeInfoRoutes');
app.use(newsCoreeInfoRoutes)


app.listen(serveur, () => {
	console.log("Serveur backend démarré sur le port ", serveur);
});
