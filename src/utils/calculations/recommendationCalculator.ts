import { getSunshineHours } from '../sunshineData';
import { getPowerLimit } from './powerLimits';
import { calculateAutoconsommation } from './autoconsommation';
import { calculateFinancialBenefits } from './financialCalculator';

interface RecommendationParams {
  consommationAnnuelle: number;
  codePostal: string;
  typeCompteur: string;
}

export function calculateRecommendation(params: RecommendationParams) {
  const { consommationAnnuelle, codePostal, typeCompteur } = params;
  
  if (!consommationAnnuelle || !codePostal || consommationAnnuelle <= 0) return null;

  const departement = codePostal.substring(0, 2);
  const productivite = getSunshineHours(departement);
  
  // Ratio plus agressif : viser 100% de la consommation
  // Pour 10000kWh, on recommande 9kWc au lieu de 6kWc
  const RATIO_CIBLE = 9 / 10000;
  
  // Calcul de la puissance recommandée
  let puissanceRecommandee = consommationAnnuelle * RATIO_CIBLE;
  
  // Puissance minimum de 3kWc pour optimiser le retour sur investissement
  puissanceRecommandee = Math.max(puissanceRecommandee, 3);
  
  // Limitation selon le type de compteur
  const powerLimit = getPowerLimit(typeCompteur);
  const puissanceLimitee = Math.min(puissanceRecommandee, powerLimit);
  
  // Calcul du nombre de modules (500W par module)
  const nombreModules = Math.ceil(puissanceLimitee * 1000 / 500);
  
  // Recalcul de la puissance réelle
  const puissanceReelle = (nombreModules * 500) / 1000;
  
  // Calcul de la production estimée
  const production = Math.round(puissanceReelle * productivite);

  // Calcul du taux d'autoconsommation
  const tauxAutoconsommation = calculateAutoconsommation(production, consommationAnnuelle);

  // Calcul des bénéfices financiers
  const { economiesAnnuelles, reventeAnnuelle } = calculateFinancialBenefits(
    production,
    tauxAutoconsommation
  );

  // Message d'avertissement si nécessaire
  let avertissement = null;
  if (puissanceRecommandee > powerLimit) {
    avertissement = `Une installation plus puissante de ${puissanceRecommandee.toFixed(1)} kWc maximiserait vos économies. Contactez-nous pour étudier la possibilité de passer en triphasé ou d'installer plusieurs onduleurs.`;
  }

  return {
    nombreModules,
    puissanceCrete: puissanceReelle,
    production,
    tauxAutoconsommation,
    economiesAnnuelles,
    reventeAnnuelle,
    avertissement
  };
}