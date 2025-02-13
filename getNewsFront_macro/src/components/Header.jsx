// import axios from "axios";
// import { useState, useEffect } from 'react'

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import headerImage from "../assets/pictures/header-img.jpg";
import "./Header.css";

const Header = (props) => {
	return (
		<>	<p>Env : {import.meta.env.VITE_ENVIRONMENT_NAME}</p>
			<Link to="/">
				<div className="header-img">
				
					<img src={headerImage} alt="header" />
				</div>
			</Link>
		</>
	);
};

export default Header;
