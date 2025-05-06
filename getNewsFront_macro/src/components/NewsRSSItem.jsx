import React, { useState } from "react";
import "./NewsItem.css";

const NewsItem = ({
	element,
	toggleNewsSelection,
	handleAddTag,
	createdTags,
	handleAddTagForSelectedNews,
}) => {
	const [newsTag, setNewsTag] = useState("");
	const [inputValue, setInputValue] = useState(""); // Valeur en cours de saisie
	const [showDropdown, setShowDropdown] = useState(false); // Affichage du menu

	// Ajouter un tag lorsqu'un espace ou "Enter" est saisi
	const handleKeyDown = async (event, element) => {
		// Ne permet l'ajout du tag que si newsTag est vide (un seul tag par NewsItem)
		if (
			(event.key === " " ||
				event.key === "Enter" ||
				event.key === "Space" ||
				event.key === ",") &&
			inputValue.trim() !== ""
		) {
			event.preventDefault();
			const newTag = inputValue.trim();
			await handleAddTagForSelectedNews(element.url, newTag); // Mettre à jour l'état global avec le nouveau tag
			await setNewsTag(newTag); // Remplace l'ancien tag par le nouveau (s'il n'y en a pas déjà)
			await setInputValue(""); // Réinitialiser l’input après ajout
		}
	};

	// Gérer l'affichage du menu déroulant
	const handleInputFocus = () => {
		setShowDropdown(true);
	};

	const handleBlur = () => {
		setTimeout(() => setShowDropdown(false), 200);
	};

	const removeTag = async (element) => {
		await handleAddTagForSelectedNews(element.url, ""); // Supprimer le tag dans l'état global
		await setNewsTag("");
	};

	const onClickDropdownTag = (tag) => {
		console.log("je passe onClick");
		handleAddTagForSelectedNews(element.url, tag); // Mettre à jour l'état global avec le nouveau tag
		setNewsTag(tag);
	};

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
			<p>
				<a href={element.url} target="_blank" rel="noopener noreferrer">
					{element.url}
				</a>
			</p>
			<p>{formatTimestamp(element.publishedDate)}</p>
			<div className="section-input-tags">
				{/* 📌 Conteneur principal de l'input et des tags */}
				<div className="bloc-input-tags">
					{/* 📌 Affichage des tags sous forme de petits blocs */}
					{newsTag ? (
						<span className="selected-tag-item">
							{newsTag}
							<span
								style={{
									cursor: "pointer",
									fontWeight: "bold",
								}}
								onClick={() => removeTag(element)}
							>
								×
							</span>
						</span>
					) : (
						""
					)}

					{/* 📌 Zone de saisie */}
					<input
						type="text"
						placeholder="Ajouter un tag"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							handleKeyDown(e, element);
							handleAddTag(e, inputValue);
						}} // Ajoute ou supprime un tag selon la touche pressée
						onFocus={handleInputFocus} // Affiche la liste des tags existants
						onBlur={handleBlur} // Masque la liste après un court délai
						className="input-tags"
					/>
				</div>

				{/* 📌 Menu déroulant des tags existants */}
				{showDropdown && createdTags.length > 0 && (
					<div className="dropdown-tags">
						{createdTags.map((tag, index) => (
							<div
								key={index}
								onClick={() => onClickDropdownTag(tag)}
								className="dropdown-tag-item"
							>
								{tag}
							</div>
						))}
					</div>
				)}
			</div>
			<div>
				<input
					type="checkbox"
					id={element.url}
					name="selected"
					onChange={(event) => toggleNewsSelection(event, element.url, newsTag)}
				/>
				<label htmlFor={`selected-${element.url}`}>Sauvegarder</label>
			</div>
		</div>
	);
};

export default NewsItem;
