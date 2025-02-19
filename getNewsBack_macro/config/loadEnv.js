const { execSync } = require("child_process");
const dotenv = require("dotenv");
const fs = require("fs");

const loadEnv = () => {
  try {
    // Récupérer la branche actuelle avec une alternative compatible
    const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

    // Déterminer le fichier .env à charger
    const envFile = branch === "main" ? ".env" : ".env.test";

    // Vérifier si le fichier existe et le charger
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
      console.log(`✅ Chargement de ${envFile} (branche: ${branch})`);
    } else {
      console.error(`⚠️ Fichier ${envFile} introuvable !`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Impossible de récupérer la branche Git.");
    process.exit(1);
  }
};

// Exporter la fonction
module.exports = loadEnv;
