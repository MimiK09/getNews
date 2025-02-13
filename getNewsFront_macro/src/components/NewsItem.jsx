import React, { useState } from "react";
import "./NewsItem.css";

const NewsItem = ({ element, toggleNewsSelection }) => {
	let newValue = "";
	let backgroundColorClass = "";

	switch (element.status) {
		case "new":
			newValue = "New";
			backgroundColorClass = "background-violet";
			break;
		case "deleted":
			newValue = "Supprimée";
			backgroundColorClass = "background-gray";
			break;
		case "published":
			newValue = "Publiée";
			backgroundColorClass = "background-green";
			break;
		case "waiting":
			newValue = "En attente";
			backgroundColorClass = "background-gray";
			break;
		case "displayed":
			newValue = "Déjà affichée";
			// No background for "displayed" case
			backgroundColorClass = "";
			break;
	}

	const formatTimestamp = (timestamp) => {
		// Convertir en nombre si c'est une chaîne
		const timestampNumber = Number(timestamp);

		// Vérifiez si le timestamp est valide
		const date = new Date(timestampNumber);

		// Vérifiez si la date est valide
		if (isNaN(date.getTime())) {
			return "Date invalide"; // Gérer les timestamps invalides
		}

		// Obtenir le jour, le mois et l'année
		const day = String(date.getDate()).padStart(2, "0"); // Ajoute un 0 devant si nécessaire
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Janvier est 0
		const year = date.getFullYear();

		// Retourner la date au format DD.MM.YYYY
		return `${day}.${month}.${year}`;
	};

	return (
		<div key={element.url} className="NewsItem">
			<p className={`${backgroundColorClass} status`}>{newValue}</p>
			<p>{element.title}</p>
			<p>{element.url}</p>
			<p>{formatTimestamp(element.publishedDate)}</p>
			<input
				type="checkbox"
				id={element.url}
				name="selected"
				onChange={(event) => toggleNewsSelection(event, element.url)}
			/>
			<label htmlFor={`selected-${element.url}`}>Sauvegarder</label>
		</div>
	);
};

export default NewsItem;
