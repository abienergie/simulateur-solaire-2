import { SolarParameters, ProductionResult } from '../types';
import { getOrientationCoefficient } from './orientationCoefficients';
import { getSunshineHours } from './sunshineData';
import { getOrientationLabel } from './orientationMapping';

export function calculerProduction(params: SolarParameters): ProductionResult {
  // 1. Calcul de la puissance crête (kWc)
  const puissanceCrete = (params.nombreModules * params.puissanceModules) / 1000;
  
  // 2. Calcul de la surface totale (m²)
  const surfaceTotale = params.nombreModules * params.surfaceUnitaire;

  // 3. Récupération de l'ensoleillement local
  const departement = params.adresse.codePostal.substring(0, 2) || '75';
  const ensoleillement = getSunshineHours(departement);

  // 4. Coefficient d'orientation
  const coefOrientation = getOrientationCoefficient(params.orientation, params.inclinaison);

  // 5. Calcul de la production
  const productionAnnuelle = Math.round(
    puissanceCrete * 
    ensoleillement * 
    coefOrientation * 
    (1 - (params.pertes + params.masqueSolaire) / 100)
  );

  // 6. Sauvegarder l'orientation dans le localStorage
  localStorage.setItem('orientation', params.orientation.toString());
  localStorage.setItem('orientationLabel', getOrientationLabel(params.orientation));

  return {
    productionAnnuelle,
    puissanceCrete: Math.round(puissanceCrete * 100) / 100,
    surfaceTotale: Math.round(surfaceTotale * 100) / 100
  };
}