import { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import NewsRedditPage from "./pages/NewsRedditPage";
import Home from "./pages/Home";
import Header from "./components/Header";
import NewsRssPage from "./pages/NewsRssPage";

function App() {
	return (
		<Router>
			<Header />
			<Routes>
				<Route path="/" element={<Home />}></Route>
				<Route path="/NewsRedditPage" element={<NewsRedditPage />}></Route>
				<Route path="/NewsRssPage" element={<NewsRssPage />}></Route>
			</Routes>
		</Router>
	);
}

export default App;
