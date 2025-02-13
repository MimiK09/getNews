// Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../App.css";
import "./Home.css";
import photo1 from "../assets/pictures/photo1.jpg";
import photo2 from "../assets/pictures/photo2.jpg";
import photo3 from "../assets/pictures/photo3.jpg";
import photo4 from "../assets/pictures/photo4.jpg";


const Homepage = () => {
  return (
    <div className="container">
      <section className="header">
        <h1>Bienvenue sur (nom de l'application en suspens)</h1>
      </section>

      <section className="intro-section">
        <p>
          Découvrez une application dont la fonction est de récupérer des infos sur la Corée du Sud, les évaluer et les publier sur Reddit.
        </p>
      </section>

      <section className="features-section">
        <h2>Fonctionnalités principales</h2>
        <div className="features-list">
          <div className="feature-item">
            <h3>Récupération d'actualités</h3>
            <p>Des informations sur la Corée obtenues de l'API Google ou de Yonhap (agence de presse sud-coréenne), le tout en un seul clic</p>
          </div>
          <div className="feature-item">
            <h3>Évaluation d'actualités</h3>
            <p>Les actualités récupérées sont ensuite évaluer pour statuer de leur publication ou non sur r/coréedusud</p>
          </div>
          <div className="feature-item">
            <h3>Publication d'actualités</h3>
            <p>Les actualités validées sont publiées sur Reddit avec le flair préalablement sélectionné</p>
          </div>
        </div>
      </section>

      <section className="technical-section">
        <h2>Technologie et Outils Utilisés</h2>
        <div className="tools-list">
          <div className="tool-item">
            <h3>React</h3>
            <p>La bibliothèque JavaScript pour la construction de l'interface utilisateur.</p>
          </div>
          <div className="tool-item">
            <h3>Axios</h3>
            <p>Une bibliothèque pour effectuer des requêtes HTTP.</p>
          </div>
          <div className="tool-item">
            <h3>React Router</h3>
            <p>Pour la navigation entre les différentes pages de l'application.</p>
          </div>
          <div className="tool-item">
            <h3>CSS</h3>
            <p>Les styles sont gérés avec des feuilles de style en cascade.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <Link to="/NewsRedditPage" className="cta-link">
          Sélectionner des news pour Reddit
        </Link>
        <Link to="/NewsRssPage" className="cta-link">
          Générer un JSON
        </Link>
      </section>

      <section className="gallery">
        <div className="gallery-item">
          <img src={photo1} alt="Photo 1" />
        </div>
        <div className="gallery-item">
          <img src={photo2} alt="Photo 2" />
        </div>
        <div className="gallery-item">
          <img src={photo3} alt="Photo 3" />
        </div>
        <div className="gallery-item">
          <img src={photo4} alt="Photo 4" />
        </div>
      </section>

      <footer>
        <p>&copy; 2024 App MimiK09 from GitHub. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default Homepage;