const isDateWithinXDays = (date, X) => {
	// Obtenir la date du jour format timestamp
	const todayDate = Date.now();

	// Calculer la différence en millisecondes entre les deux dates
	const diffInMs = todayDate - date;

	// Convertir la différence en jours (1 jour = 24h * 60m * 60s * 1000ms)
	const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

	// Retourner vrai si la différence est inférieure ou égale à 2 jours
	return diffInDays <= X;
};

///////////////////////////////////////////
///////////////////////////////////////////

module.exports = isDateWithinXDays;
