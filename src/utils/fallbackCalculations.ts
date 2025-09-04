import { getSunshineHours } from './sunshineData';
import { getOrientationCoefficient } from './orientationCoefficients';

export function calculateFallbackProduction(
  peakPower: number, // en kWc
  loss: number, // en pourcentage
  angle: number, // en degrés
  azimuth: number, // en degrés
  departement: string = '75' // Paris par défaut
): number {
  // 1. Récupération des heures d'ensoleillement annuel du département
  const sunshineHours = getSunshineHours(departement);
  
  // 2. Coefficient d'orientation et d'inclinaison
  const orientationCoefficient = getOrientationCoefficient(azimuth, angle);
  
  // 3. Calcul de base : ensoleillement × coefficient × puissance
  let production = sunshineHours * orientationCoefficient * peakPower;
  
  // 4. Application des pertes système
  production = production * (1 - loss / 100);
  
  return Math.round(production);
}