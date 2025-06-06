import React, { useState } from "react";
import "./NewsItem.css";

const NewsJSONItem = ({
	element,
	availableImages,
	convertDate,
	updateJsonNewsStatus,
	jsonNewsStatusChanges,
}) => {
	// url of selected picture
	const [selectedImage, setSelectedImage] = useState(null);
	// dropdown menu opened or closed
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	// id of selected picture
	const [imageID, setimageID] = useState("");

	const handleSelectImage = (imageUrl, imageAltText, imageID) => {
		console.log("imageUrl", imageUrl, "imageAltText", imageAltText);
		setSelectedImage(imageUrl);
		setimageID(imageID);
		setIsDropdownOpen(false);
	};

	const currentStatus = jsonNewsStatusChanges.find(
		(item) => item.url === element.url
	)?.status;

	return (
		<div className="NewsItem">
			<p>Title: {element.title}</p>
			<p>Source: {element.source}</p>
			<p>Description: {element.complete_description}</p>
			<p>URL: {element.url}</p>
			<p>keyword: {element.keyword}</p>
			<p>Date: {convertDate(element.publishedDate)}</p>
			<div>
				<input
					type="radio"
					name={`status-${element.url}`}
					value="published"
					checked={currentStatus === "published"}
					onChange={() =>
						updateJsonNewsStatus(element.url, element.title, "published")
					}
				/>
				<label>Publiée</label>

				<input
					type="radio"
					name={`status-${element.url}`}
					value="delete"
					checked={currentStatus === "delete"}
					onChange={() =>
						updateJsonNewsStatus(element.url, element.title, "delete")
					}
				/>
				<label>Supprimer</label>

				<input
					type="radio"
					name={`status-${element.url}`}
					value="no change"
					checked={currentStatus === "no change"}
					onChange={() =>
						updateJsonNewsStatus(element.url, element.title, "no change")
					}
				/>
				<label>A garder</label>
			</div>

			{/* Menu déroulant avec miniatures */}
			<div className="image-dropdown-container">
				<div
					className="image-dropdown-header"
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
				>
					<img
						src={selectedImage || availableImages[0]?.url}
						alt={selectedImage ? "Selected" : "Select an image"}
						className="selected-image"
					/>
					<span>{selectedImage ? "Change image" : "Select an image"}</span>
				</div>
				{isDropdownOpen && (
					<div className="image-dropdown-options">
						{availableImages.map((imageItem) => (
							<div
								key={imageItem.id}
								className="image-dropdown-option"
								onClick={() =>
									handleSelectImage(
										imageItem.url,
										imageItem.altText,
										imageItem.id
									)
								}
							>
								<img
									src={imageItem.url}
									alt={imageItem.altText}
									className="thumbnail"
								/>
								<p>
									{imageItem.title}, id = {imageItem.id}
								</p>
							</div>
						))}
					</div>
				)}
			</div>
			{imageID && <p>ID de l'image : {imageID}</p>}
		</div>
	);
};

export default NewsJSONItem;
