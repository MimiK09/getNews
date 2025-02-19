import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";  // Importer fileURLToPath

try {

  // Récupérer la branche Git actuelle
  const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();


  // Déterminer le fichier .env à utiliser
  const envFile = branch === "main" ? ".env" : ".env.test";

  // Convertir import.meta.url en chemin local
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Déterminer le chemin vers le fichier .env
  const envPath = path.join(__dirname, "..", envFile);

  if (!fs.existsSync(envPath)) {
    console.error(`⚠️ Fichier ${envFile} introuvable !`);
    process.exit(1);
  }

  // Créer un fichier temporaire .env.local pour que Vite le prenne en compte
  const envLocalPath = path.join(__dirname, "..", ".env.local");
  fs.copyFileSync(envPath, envLocalPath);

  console.log(`✅ Chargement de ${envFile} (branche: ${branch})`);
} catch (error) {
  console.error("❌ Impossible de récupérer la branche Git.");
  console.error(error);  // Afficher l'erreur complète
  process.exit(1);
}
