import axios from "axios";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./NewsPages.css";
import "../App.css";
import loadingGif from "../assets/pictures/Loading.gif"

const NewsRedditPage = (props) => {
	// To manage different messages from the back (success of the req)
	const [message, setMessage] = useState("");
	// List of news from the
	const [newsList, setNewsList] = useState();
	// To manage waiting status
	const [isLoading, setIsLoading] = useState(false);
	// List of news to be updated in the
	const [dataToSend, setDataToSend] = useState([]);
	// List of existing flairs on Reddit
	const [listFlairs, setListFlairs] = useState();

	useEffect(() => {
		if (newsList && newsList.length > 0) {
			const initialData = newsList.map((news) => ({
				id: news._id,
				title: news.title,
				flair: "Actualité", // To improve, if flair change on reddit => no comminication
				action: "delete", // Default action
			}));
			setDataToSend(initialData);
		}
	}, [newsList]);

	// Call to the API to launch scrapping and get news to evaluate
	const handleGettingNews = async () => {
		setIsLoading(true);
		setNewsList(null);
		const response = await axios.get(
			`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/getNewsForRedditFr`
		);
		setIsLoading(false);
		setMessage("News récupérées et enregistrées en BDD");
	};

	// Launch publication of the news on reddit
	const handleRedditPublish = async () => {
		setIsLoading(true);
		setNewsList(null);
		const response = await axios.post(
			`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/publishReddit`
		);
		setIsLoading(false);
		setMessage("News publiées sur Reddit");
	};

	// Get the news from the database
	const handleEvaluateNews = async () => {
		setIsLoading(true);
		const response = await axios.get(
			`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/evaluateNewsRedditFR`
		);
		setIsLoading(false);
		setNewsList(response.data.data);
		setListFlairs(response.data.flairs);
	};

	// Generate a list of changes on each news
	// const handleTitleChange = (event, elementId) => {
	// 	let newTab = [...dataToSend];
	// 	let updated = false;
	// 	// Looking for an existing entry in dataToSend with the copy newTab with the same ID

	// 	if (event.target.value.length > 20) {
	// 		for (let i = 0; i < newTab.length; i++) {
	// 			console.log("je prends la boucle, tour n°", i);
	// 			if (newTab[i].id === elementId) {
	// 				console.log(
	// 					"je prends le premier if, valeur tableau du if confirmé =>",
	// 					newTab[i].id
	// 				);
	// 				newTab[i].title = event.target.value;
	// 				updated = true;
	// 				break;
	// 			}
	// 		}
	// 		// If not existing entry, create one and push it in newTab
	// 		if (!updated) {
	// 			console.log("je prends le second if =>", event.target.value);
	// 			newTab.push({ id: elementId, title: event.target.value });
	// 		}
	// 		event.preventDefault();
	// 		setDataToSend(newTab);
	// 	} else {
	// 		console.log("titre trop court");
	// 	}
	// };

	// Generate a list of changes on each news
	const handleFlairChange = (event, elementId) => {
		let newTab = [...dataToSend];
		let updated = false;
		for (let i = 0; i < newTab.length; i++) {
			if (newTab[i].id === elementId) {
				newTab[i].flair = event.target.value;
				updated = true;
				break;
			}
		}
		if (!updated) {
			newTab.push({ id: elementId, flair: event.target.value });
		}
		event.preventDefault();
		setDataToSend(newTab);
	};

	// Generate a list of changes on each news
	const handleActionChange = (event, elementId) => {
		let newTab = [...dataToSend];
		let updated = false;
		for (let i = 0; i < newTab.length; i++) {
			if (newTab[i].id === elementId) {
				newTab[i].action = event.target.value;
				updated = true;
				break;
			}
		}
		if (!updated) {
			newTab.push({ id: elementId, action: event.target.value });
		}
		event.preventDefault();
		setDataToSend(newTab);
	};

	// Validate and send each change on the news
	const handleValidateNews = async (event) => {
		setIsLoading(true);
		event.preventDefault();
		let data = dataToSend;
		const response = await axios.post(
			`${import.meta.env.VITE_REACT_APP_SERVER_ADDRESS}/validateNews`,
			{
				data: data,
			}
		);

		setIsLoading(false);
		setMessage("Les news ont été réévaluées");
		setNewsList(null);
		setDataToSend([]);
	};

	return (
		<>
			<div className="general-bloc">
				<h2>Get news and publish on Reddit</h2>
				<button className="ActionBtn" onClick={handleGettingNews}>
					Get news
				</button>
				<button className="ActionBtn" onClick={handleEvaluateNews}>
					Evaluate news
				</button>
				<button className="ActionBtn" onClick={handleRedditPublish}>
					Publish on Reddit
				</button>

				{isLoading ? (
					<div className="WaitingMsg"><p>Waiting</p><img src={loadingGif} /></div>
				) : (
					<div className="NewsRedditContainer">
						{!newsList ? (
							<div>{message && <div className="message">{message}</div>}</div>
						) : (
							<form>
								{newsList.map((element) => (
									<div key={element._id} className="NewsItem">
										<p>{element.title}</p>
										{/* <input
											type="text"
											id="title_input"
											name="title"
											onChange={(event) => {
												handleTitleChange(event, element._id);
											}}
										/> */}
										<p>{element.dateComplete}</p>
										<p className="newsListUrl">{element.link}</p>
										<label>Flair Reddit : </label>
										<select
											name="flair"
											id="flair"
											onChange={(event) => {
												handleFlairChange(event, element._id);
											}}
										>
											<option value="Actualité">Actualité</option>
											{listFlairs.map((element) => (
												<option
													key={element.flair_text}
													value={element.flair_text}
												>
													{element.flair_text}
												</option>
											))}
										</select>
										<label>Action : </label>
										<select
											name="action"
											id="action"
											onChange={(event) =>
												handleActionChange(event, element._id)
											}
										>
											<option value="delete">Supprimer</option>
											<option value="waiting">En attente</option>
											<option value="publish">Publier</option>
										</select>
									</div>
								))}
								<button className="ValidateButton" onClick={handleValidateNews}>
									Valider les données
								</button>
							</form>
						)}
					</div>
				)}
				<Link to="/">Aller sur HomePage</Link>
			</div>
		</>
	);
};

export default NewsRedditPage;
