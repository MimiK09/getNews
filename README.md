# getNews

getNewsMacro est une application web complète permettant de récupérer, traiter, évaluer et publier des actualités sur la Corée du Sud à partir de différentes sources (RSS, Google News, Yonhap, etc.), puis de les diffuser automatiquement sur plusieurs plateformes (Reddit, Threads). Le projet est organisé en deux parties : un back-end Node.js/Express et un front-end React/Vite.


## Fonctionnalités
Récupération d’actualités : Extraction automatique de news via flux RSS, Google News, Yonhap.
Scraping avancé : Utilisation de Puppeteer et Cheerio pour enrichir les contenus.
Évaluation et validation : Interface pour valider, taguer et organiser les news avant publication.
Publication multiplateforme : Diffusion automatisée sur Reddit (avec sélection de flair) et Threads.
Gestion de la base de données : Stockage, nettoyage automatique des anciennes news, génération de fichiers JSON pour intégration externe.
Interface utilisateur moderne : Front-end React avec navigation, visualisation et gestion des actualités.

## Architecture
getNewsMacro/
│
├── getNewsBack_macro/   # Back-end Node.js/Express (API, scraping, BDD, publication)
├── getNewsFront_macro/  # Front-end React (interface utilisateur)
├── node_modules/        # Dépendances globales
├── package.json         # Dépendances globales (presque vide, tout est dans les sous-projets)
└── README.md
Back-end : API REST, gestion BDD MongoDB/Mongoose, scraping, publication Reddit/Threads, scripts d’automatisation.
Front-end : Application React (Vite), pages pour chaque étape (flux RSS, Reddit, Threads), gestion des états et interactions utilisateurs.

## Installation
Prérequis
Node.js >= 18
npm >= 9
MongoDB (local ou distant)
(optionnel) Clés API pour Google, Reddit, Threads, etc.
Installation des dépendances
bash
### Back-end
cd getNewsBack_macro
npm install

### Front-end
cd ../getNewsFront_macro
npm install
Configuration
Variables d’environnement
Remplis les fichiers 
.env
 dans chaque dossier (
getNewsBack_macro/.env
, 
getNewsFront_macro/.env
) selon les modèles fournis (.env.example ou 
.env.test
), avec tes clés API, URL MongoDB, etc.
Lancement du projet
bash
### Lancer le back-end
cd getNewsBack_macro
npm start

### Lancer le front-end
cd ../getNewsFront_macro
npm run dev
Utilisation
Accède à l’interface web via l’URL locale affichée par Vite (souvent http://localhost:5173).
Utilise les différentes pages pour :
Visualiser les news récupérées
Sélectionner, taguer et valider les news
Publier sur Reddit/Threads
Nettoyer la base de données

## Technologies utilisées 
Back-end : Node.js, Express, Mongoose, Puppeteer, Cheerio, Axios, dotenv, newsapi, snoowrap, Google APIs, etc.
Front-end : React, Vite, Axios, React Router, dotenv
Base de données : MongoDB


## Endpoints API

### newsCoreeInfoRoutes.js

- **GET `/testN8N`**
  - *Description* : Envoie toutes les news (BDD + RSS) à un workflow N8N pour intégration externe.
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true }
    ```
    ou
    ```json
    { "success": false, "error": "message" }
    ```

- **GET `/fetchRssFeed`**
  - *Description* : Récupère news BDD + nouveaux flux RSS, met à jour la BDD avec les news manquantes.
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true, "dataFromBack": [ ... ] }
    ```

- **POST `/validateNewsFromRSSFeed`**
  - *Description* : Valide manuellement une sélection de news RSS, enrichit leur contenu, statut → "waiting".
  - *Entrée (body)* :
    ```json
    { "data": [ { "url": "string", "keyword": "string" }, ... ] }
    ```
  - *Sortie* :
    ```json
    { "success": true, "successCount": 2, "failedCount": 0 }
    ```

- **POST `/validateNewsFromRSSFeed_auto`**
  - *Description* : Valide automatiquement des news (pour automatisation), enrichit et passe à "waiting".
  - *Entrée (body)* :
    ```json
    { "data": [ { "title": "string", "keyword": "string" }, ... ] }
    ```
  - *Sortie* :
    ```json
    { "success": true, "successCount": 2, "failedCount": 0 }
    ```

- **GET `/generateJSONfromRSSFeed`**
  - *Description* : Génère un JSON des news récentes (statut "waiting", publiées il y a moins de 2 jours).
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true, "dataFromBack": [ ... ], "dataFromBackLength": 12 }
    ```

- **POST `/changeStatusJSONNews`**
  - *Description* : Met à jour le statut des news du JSON (ex : "published", "deleted") dans la BDD.
  - *Entrée (body)* :
    ```json
    { "data": [ { "url": "string", "status": "published" | "deleted" }, ... ] }
    ```
  - *Sortie* :
    ```json
    { "success": true, "message": "News status updated successfully" }
    ```

- **GET `/mediaFromWordpress`**
  - *Description* : Récupère des médias/images depuis un site Wordpress (API WP REST).
  - *Entrée* : aucune (auth via .env).
  - *Sortie* :
    ```json
    [ { "id": 123, "title": "string", "url": "string", "altText": "string", "mimeType": "string", "caption": "string" }, ... ]
    ```

- **DELETE `/cleandatabase`**
  - *Description* : Supprime toutes les news "displayed" datant de plus de 10 jours.
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true, "message": "X news deleted.", "deleted": ["title1", ...] }
    ```

---

### newsRedditRoutes.js

- **GET `/getNewsForRedditFr`**
  - *Description* : Récupère les news à publier sur Reddit, les stocke si nouvelles.
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true, "data": [ ... ] }
    ```

- **POST `/publishReddit`**
  - *Description* : Publie automatiquement sur Reddit toutes les news prêtes (statut "ok", non publiées).
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true, "data": [ ... ] }
    ```

- **POST `/publishReddit_content`**
  - *Description* : Publie sur Reddit des contenus enrichis depuis Google Sheets.
  - *Entrée* : aucune (données récupérées côté back).
  - *Sortie* :
    ```json
    { "success": true, "data": [ ... ] }
    ```

- **GET `/evaluateNewsRedditFR`**
  - *Description* : Récupère les news en attente pour Reddit + les flairs disponibles.
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "success": true, "data": [ ... ], "flairs": [ ... ] }
    ```

- **POST `/validateNews`**
  - *Description* : Met à jour le statut des news après évaluation (ex : "ok" pour publier, "no" pour refuser), assigne le flair choisi.
  - *Entrée (body)* :
    ```json
    { "data": [ { "id": "string", "action": "publish" | "delete", "flair": "string" }, ... ] }
    ```
  - *Sortie* :
    ```json
    { "success": true, "dataSent": [ ... ] }
    ```

---

### newsThreadRoutes.js

- **GET `/loginthread`**
  - *Description* : Fournit une URL d’authentification OAuth Threads (Meta) à ouvrir dans le navigateur.
  - *Entrée* : aucune.
  - *Sortie* :
    ```json
    { "authUrl": "https://threads.net/oauth/authorize?..." }
    ```

- **GET `/callbackloginthread`**
  - *Description* : Callback OAuth Threads : échange le code d’autorisation contre un token, puis publie sur Threads.
  - *Entrée* :
    - Query param : `code` (string)
  - *Sortie* :
    - Succès :
      ```
      Thread publié avec succès
      ```
    - Échec :
      ```
      Erreur lors de l'échange du code
      ```

- **POST `/threads/publish-threads`**
  - *Description* : Publie automatiquement une série de threads sur Threads.net à partir de contenus Google Sheets.
  - *Entrée (body)* :
    ```json
    { "accessToken": "string", "userId": "string" }
    ```
  - *Sortie* :
    ```json
    { "success": true, "message": "Threads publiés avec succès", "threads": [ ... ] }
    ```

---

Pour chaque endpoint, les données d'entrée sont à envoyer dans le body (POST) ou en query (GET) selon la méthode. Les réponses sont toujours au format JSON sauf mention contraire.

---