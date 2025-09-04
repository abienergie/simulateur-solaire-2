import { SolarParameters, ProductionResult } from '../../types';
import { calculateLocalProduction } from './localCalculator';

export async function calculerProduction(params: SolarParameters): Promise<ProductionResult> {
  if (!params.adresse.codePostal) {
    throw new Error('Code postal manquant');
  }

  if (!params.typeCompteur) {
    throw new Error('Type de compteur manquant');
  }

  // Calcul de la puissance crête
  const puissanceCrete = (params.nombreModules * params.puissanceModules) / 1000;
  
  // Calcul de la surface totale (2.25m² par 500Wc)
  const surfaceTotale = (params.nombreModules * params.puissanceModules / 500) * 2.25;

  try {
    // Calcul de la production
    const departement = params.adresse.codePostal.substring(0, 2);
    const productionAnnuelle = calculateLocalProduction(
      puissanceCrete,
      params.pertes,
      params.inclinaison,
      params.orientation,
      departement,
      params.masqueSolaire
    );

    // Inclure le type de compteur dans les résultats
    return {
      productionAnnuelle,
      puissanceCrete: Math.round(puissanceCrete * 100) / 100,
      surfaceTotale: Math.round(surfaceTotale * 100) / 100,
      typeCompteur: params.typeCompteur
    };
  } catch (error) {
    console.error('Erreur lors du calcul:', error);
    throw new Error('Erreur lors du calcul de la production');
  }
}