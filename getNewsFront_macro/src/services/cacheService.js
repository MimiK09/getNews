// src/services/cacheService.js

export const saveToCache = () => { 
    // après appel du feed, si certaines sont nouvelles, les enregistrer

    // si changement de statut, sauvegarder les changements

  };
  
  export const getFromCache = () => {
    // au lancement de l'onglet, je cherche à récupérer les news en cache. 3 types, donnant 3 classes CSS différentes
    // celles déjà affichées
    // celles déjà enregistrées
    // celles qui ont été publiées/supprimées
  };
  
  export const clearCache = (key) => {
    localStorage.removeItem(key);
  };
  