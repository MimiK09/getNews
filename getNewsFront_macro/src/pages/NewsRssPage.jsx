import axios from "axios";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import NewsItem from "../components/NewsItem";
import NewsJSONItem from "../components/NewsJSONItem";
import "./NewsPages.css";
import "../App.css";
import loadingGif from "../assets/pictures/Loading.gif";

const NewsRssPage = (props) => {
	/**
	 * 📌 Liste des actualités récupérées depuis le flux RSS (BDD après fetch)
	 * Exemple d'un élément stocké dans rssNewsList :
	 * {
	 *   title: "Titre de l'article",
	 *   url: "https://example.com/article",
	 *   source: "Nom du site",
	 *   publishedDate: 1700000000000, // Timestamp en millisecondes
	 *   complete_description: "Description complète de l'article"
	 * }
	 */
	const [rssNewsList, setRssNewsList] = useState([]);

	/**
	 * 📌 Indicateur d'attente (loading) lors des appels API
	 * Valeurs possibles : true (en cours de chargement) / false (chargement terminé)
	 */
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * 📌 Liste des URLs des actualités sélectionnées pour être envoyées en BDD.
	 * Exemple de contenu :
	 * ["https://example.com/article1", "https://example.com/article2"]
	 */
	const [selectedArticlesForDatabase, setSelectedArticlesForDatabase] =
		useState([]);

	/**
	 * 📌 Liste des actualités en attente de validation sous format JSON.
	 * Exemple d'un élément stocké dans pendingNewsJSON :
	 * {
	 *   title: "Titre de l'article",
	 *   url: "https://example.com/article",
	 *   source: "Nom du site",
	 *   publishedDate: 1700000000000, // Timestamp
	 *   complete_description: "Description complète",
	 *   status: "pending" // Statut en attente
	 * }
	 */
	const [pendingNewsJSON, setPendingNewsJSON] = useState([]);

	/**
	 * 📌 Liste des modifications de statut pour les actualités JSON.
	 * Utilisé pour envoyer les changements (publier, supprimer, conserver).
	 * Exemple :
	 * [
	 *   { url: "https://example.com/article1", title: "Titre 1", status: "published" },
	 *   { url: "https://example.com/article2", title: "Titre 2", status: "delete" }
	 * ]
	 */
	const [jsonNewsStatusChanges, setJsonNewsStatusChanges] = useState([]);

	/**
	 * 📌 Vue actuellement affichée à l'utilisateur.
	 * Valeurs possibles : "none" (aucune vue), "rss" (vue RSS), "json" (vue JSON)
	 */
	const [currentView, setCurrentView] = useState("none");

	/**
	 * 📌 Message d'information affiché à l'utilisateur.
	 * Exemple : "Les news ont bien été envoyées en BDD"
	 */
	const [message, setMessage] = useState("");

	/**
	 * 📌 Liste des images disponibles depuis WordPress.
	 * Exemple d'un élément stocké :
	 * {
	 *   id: 123,
	 *   url: "https://example.com/image.jpg",
	 *   title: "Titre de l'image",
	 *   altText: "Description de l'image"
	 * }
	 */
	const [availableImages, setAvailableImages] = useState([]);

	/**
	 * 📌 Liste des tags saisi
	 * Exemple d'un élément stocké :
	 * [tag1, tag2, tag3]
	 */
	const [createdTags, setCreatedTags] = useState([]);

	// Get news from RSS feeds
	const fetchRssNews = async () => {
		setMessage("");
		setIsLoading(true);
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/fetchRssFeed`
			);
			setRssNewsList(response.data.dataFromBack);
			setCurrentView("rss"); // Show RSS news
		} catch (error) {
			console.error("Error getting news from RSS");
		}
		setIsLoading(false);
	};

	const toggleNewsSelection = (event, url) => {
		setSelectedArticlesForDatabase((prev) => {
			const updatedSet = new Set(prev); // Convertir en Set pour une gestion unique
			if (updatedSet.has(url)) {
				updatedSet.delete(url); // Supprimer l'article s'il est déjà sélectionné
			} else {
				updatedSet.add(url); // Ajouter l'article s'il n'est pas encore sélectionné
			}
			return [...updatedSet]; // Retourner un tableau à partir du Set
		});
	};

	// Send news to the Back
	const submitSelectedNews = async (event) => {
		event.preventDefault();
		setMessage("");
		setIsLoading(true);

		let articlesToSend = [];

		for (let i = 0; i < selectedArticlesForDatabase.length; i++) {
			for (let j = 0; j < rssNewsList.length; j++) {
				if (selectedArticlesForDatabase[i] === rssNewsList[j].url) {
					articlesToSend.push(rssNewsList[j]);
				}
			}
		}

		try {
			const response = await axios.post(
				`${
					import.meta.env.VITE_REACT_APP_SERVER_ADDRESS
				}/validateNewsFromRSSFeed`,
				{
					data: articlesToSend,
				}
			);
		} catch (error) {
			console.error("Error sending news or getting details");
		}

		setIsLoading(false);
		setSelectedArticlesForDatabase([]);
		setCurrentView("none");
		setMessage(
			"Les news sélectionnées ont bien été envoyées en BDD avec une description complète"
		);
	};

	// Add a button to get news with waiting status (limit 2 days), JSON format
	const fetchPendingJsonNews = async () => {
		setMessage("");
		setIsLoading(true);

		try {
			const [responseDetails, responseImage] = await Promise.all([
				axios.get(
					`${
						import.meta.env.VITE_REACT_APP_SERVER_ADDRESS
					}/generateJSONfromRSSFeed`
				),
				axios.get(
					`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/mediaFromWordpress`
				),
			]);

			setAvailableImages(responseImage.data);
			setPendingNewsJSON(responseDetails.data.dataFromBack);
			setCurrentView("json");
		} catch (error) {
			console.error("Error generating the JSON");
		}

		setIsLoading(false);
	};

	const convertDate = (timestamp) => {
		// Convertir le timestamp en nombre
		const numericTimestamp = Number(timestamp);

		// Vérifier si la conversion en nombre est correcte
		if (isNaN(numericTimestamp)) {
			return "Invalid timestamp";
		}

		// Convertir le timestamp en une date
		const date = new Date(numericTimestamp);

		// Vérifier si la date est valide
		if (isNaN(date.getTime())) {
			return "Invalid Date";
		}

		// Récupérer le jour, le mois et l'année
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const year = date.getFullYear();

		// Retourner la date au format DD.MM.YYYY
		return `${day}.${month}.${year}`;
	};

	// Function to handle status change (publish/delete)
	const updateJsonNewsStatus = (url, title, status) => {
		setJsonNewsStatusChanges((prevChanges) => {
			const existingChange = prevChanges.find((item) => item.url === url);
			if (existingChange) {
				// Update the existing status change
				return prevChanges.map((item) =>
					item.url === url ? { url, title, status } : item
				);
			} else {
				// Add a new status change
				return [...prevChanges, { url, title, status }];
			}
		});
	};

	const submitStatusChanges = async (event) => {
		event.preventDefault();
		setIsLoading(true);
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/changeStatusJSONNews`,
				{
					data: jsonNewsStatusChanges,
				}
			);
		} catch (error) {
			console.error("Error submitting status changes");
		}
		setJsonNewsStatusChanges([]);
		setPendingNewsJSON([]);
		setMessage("Les statuts ont bien été mis à jour");
		setIsLoading(false);
	};

	const switchView = (view) => {
		setCurrentView(view);
		setMessage("");
	};

	const globalAction = async (event, action) => {
		event.preventDefault();

		// Parcourir tous les éléments de pendingNewsJSON et mettre leur statut = action
		pendingNewsJSON.forEach((element) => {
			updateJsonNewsStatus(
				element.url,
				element.title,
				(element.status = action)
			);
		});
	};

	// Ajouter un tag lorsqu'un espace ou "Enter" est saisi
	const handleAddTag = (event, inputValue) => {
		console.log("je passe 1 => ", inputValue);
		if (
			(event.key === " " ||
				event.key === "Enter" ||
				event.key === "Space" ||
				event.key === ",") &&
			inputValue.trim() !== ""
		) {
			event.preventDefault();
			const newTag = inputValue.trim();
			console.log("je passe 2 input ", inputValue);
			setCreatedTags((prevTags) => {
				console.log("je passe 3");
				if (!prevTags.includes(newTag)) {
					return [...prevTags, newTag];
				}
				return prevTags;
			});
		}
	};

	return (
		<div className="general-bloc">
			<h2>Get news from RSS feeds and get a JSON</h2>
			{currentView === "none" && (
				<div>
					<p>Veuillez sélectionner une option pour afficher les nouvelles.</p>
				</div>
			)}
			<div className="view_bloc">
				<button className="view_tag" onClick={() => switchView("rss")}>
					RSS view
				</button>
				<button className="view_tag" onClick={() => switchView("json")}>
					JSON view
				</button>
				<button
					className="ActionBtn"
					onClick={() => {
						fetchRssNews();
					}}
				>
					Get news
				</button>
				<button
					className="ActionBtn"
					onClick={() => {
						fetchPendingJsonNews();
					}}
				>
					Generate JSON
				</button>
			</div>
			{isLoading && (
				<div className="WaitingMsg">
					<p>Waiting</p>
					<img src={loadingGif} />
				</div>
			)}
			{currentView === "rss" && rssNewsList.length > 0 && (
				<div>
					<form>
						<div className="NewsRSSContainer">
							{rssNewsList.map((element) => (
								<NewsItem
									key={element.url}
									element={element}
									toggleNewsSelection={toggleNewsSelection}
									createdTags={createdTags}
									handleAddTag={handleAddTag}
								/>
							))}
						</div>
						<button
							className="ValidateButton"
							onClick={(event) => {
								submitSelectedNews(event);
							}}
						>
							Envoyer en BDD
						</button>
					</form>
				</div>
			)}
			{currentView === "json" && pendingNewsJSON.length > 0 && (
				<div>
					<div className="all_action_bloc">
						<button
							onClick={(event) => {
								globalAction(event, "delete");
							}}
						>
							Tout supprimer
						</button>
						<button
							onClick={(event) => {
								globalAction(event, "no change");
							}}
						>
							Tout garder
						</button>
					</div>
					<form>
						<div className="NewsRSSContainer">
							{pendingNewsJSON.map((element) => (
								<NewsJSONItem
									key={element.url}
									element={element}
									availableImages={availableImages}
									convertDate={convertDate}
									updateJsonNewsStatus={updateJsonNewsStatus}
									jsonNewsStatusChanges={jsonNewsStatusChanges}
								/>
							))}
						</div>
						<button
							className="ValidateButton"
							onClick={(event) => {
								submitStatusChanges(event);
							}}
						>
							Valider les changements
						</button>
					</form>
				</div>
			)}
			{message && <div className="message">{message}</div>}

			<Link to="/">Aller sur HomePage</Link>
		</div>
	);
};

export default NewsRssPage;
