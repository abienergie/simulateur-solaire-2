interface RecommendationParams {
  consommationAnnuelle: number;
  typeCompteur: string;
  puissanceModules: number;
}

export function calculateRecommendation(params: RecommendationParams) {
  const { consommationAnnuelle, typeCompteur, puissanceModules } = params;
  
  if (!consommationAnnuelle || consommationAnnuelle <= 0) return null;

  // Objectif : couvrir environ 30-40% de la consommation
  const productionCible = consommationAnnuelle * 0.35;
  
  // Estimation de la production annuelle par kWc (moyenne française)
  const productionParKwc = 1100; // kWh/kWc/an
  
  // Calcul de la puissance crête nécessaire
  let puissanceCrete = productionCible / productionParKwc;
  
  // Limitation selon le type de compteur
  if (typeCompteur === 'monophase') {
    puissanceCrete = Math.min(puissanceCrete, 6);
  }
  
  // Calcul du nombre de modules nécessaire
  const nombreModules = Math.ceil(puissanceCrete * 1000 / puissanceModules);
  
  // Recalcul de la puissance crête réelle
  const puissanceCreteReelle = (nombreModules * puissanceModules) / 1000;
  
  // Estimation de la production
  const productionEstimee = Math.round(puissanceCreteReelle * productionParKwc);
  
  return {
    nombreModules,
    puissanceCrete: Math.round(puissanceCreteReelle * 100) / 100,
    production: productionEstimee
  };
}