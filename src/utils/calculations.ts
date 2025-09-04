import { SolarParameters, ProductionResult } from '../types';

export function calculerProduction(params: SolarParameters): ProductionResult {
  // Surface totale
  const surfaceTotale = params.nombreModules * params.surfaceUnitaire;
  
  // Facteur d'inclinaison (optimal autour de 30-35° en France)
  const facteurInclinaison = Math.cos((Math.abs(35 - params.inclinaison) * Math.PI) / 180);
  
  // Facteur d'orientation (optimal au sud = 0°)
  const facteurOrientation = Math.cos((Math.abs(params.orientation) * Math.PI) / 180);
  
  // Surface effective
  const surfaceEffective = surfaceTotale * facteurInclinaison * facteurOrientation;
  
  // Puissance crête
  const puissanceCrete = (params.nombreModules * params.puissanceModules) / 1000; // kWc
  
  // Production annuelle estimée (en kWh)
  const productionAnnuelle = Math.round(
    puissanceCrete * 1000 * // conversion en Wc
    (1 - params.pertes / 100) * // facteur de pertes
    0.15 * // rendement moyen
    (1367 * 24 * 365) / 1000000 // conversion en kWh/an
  );

  return {
    productionAnnuelle,
    puissanceCrete: Math.round(puissanceCrete * 100) / 100,
    surfaceTotale: Math.round(surfaceTotale * 100) / 100
  };
}