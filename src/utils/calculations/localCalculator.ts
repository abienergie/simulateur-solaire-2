import { getSunshineHours } from '../sunshineData';
import { getOrientationCoefficient } from '../orientationCoefficients';

export function calculateLocalProduction(
  puissanceCrete: number,
  pertes: number,
  inclinaison: number,
  orientation: number,
  departement: string,
  masqueSolaire: number = 0
): number {
  // 1. Récupération des heures d'ensoleillement annuel du département
  const ensoleillement = getSunshineHours(departement);
  
  // 2. Coefficient d'orientation et d'inclinaison
  const coefOrientation = getOrientationCoefficient(orientation, inclinaison);
  
  // 3. Calcul de base : ensoleillement × coefficient × puissance
  let production = ensoleillement * coefOrientation * puissanceCrete;
  
  // 4. Application des pertes système d'abord
  production = production * (1 - pertes / 100);
  
  // 5. Application du masque solaire ensuite sur la production déjà calculée
  production = production * (1 - masqueSolaire / 100);
  
  return Math.round(production);
}