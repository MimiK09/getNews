// import axios from "axios";
// import { useState, useEffect } from 'react'

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import headerImage from "../assets/pictures/header-img.jpg";
import "./Header.css";

const Header = (props) => {
	return (
		<header className="app-header">
			<p
				className={`env-badge ${
					import.meta.env.VITE_ENVIRONMENT_NAME === "PROD"
						? "env-prod"
						: "env-test"
				}`}
			>
				Env :{" "}
				{import.meta.env.VITE_ENVIRONMENT_NAME === "PROD"
					? "PRODUCTION"
					: "DEMO"}
			</p>
			<Link to="/">
				<div className="header-img">
					<img src={headerImage} alt="header" />
				</div>
			</Link>
		</header>
	);
};

export default Header;
