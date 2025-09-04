import { BEHAVIOR_FACTORS } from '../constants/consumptionPatterns';

export function calculateAutoconsommation(production: number, consommation: number): number {
  if (!consommation || !production) return 0;
  
  const ratioProduction = production / consommation;
  
  // Nouveaux taux d'autoconsommation tenant compte du changement comportemental
  let tauxAutoconsommation;
  if (ratioProduction <= 0.35) {
    // Petite installation : excellente autoconsommation grâce aux changements d'habitudes
    tauxAutoconsommation = 0.95;
  } else if (ratioProduction <= 0.45) {
    // Installation moyenne : très bonne autoconsommation
    tauxAutoconsommation = 0.90;
  } else if (ratioProduction <= 0.60) {
    // Installation optimale : bonne autoconsommation
    tauxAutoconsommation = 0.85;
  } else {
    // Grande installation : autoconsommation satisfaisante
    tauxAutoconsommation = 0.75;
  }

  // Application du facteur comportemental
  tauxAutoconsommation *= BEHAVIOR_FACTORS.LOAD_SHIFTING;

  return Math.round(tauxAutoconsommation * 100);
}

export function getAutoconsommationMessage(ratio: number): string {
  if (ratio >= 90) {
    return 'Optimisation maximale : excellente rentabilité grâce au déplacement intelligent des consommations';
  }
  if (ratio >= 85) {
    return 'Très forte rentabilité grâce à une autoconsommation optimisée aux heures solaires';
  }
  if (ratio >= 75) {
    return 'Excellent retour sur investissement avec une consommation adaptée à la production';
  }
  return 'Forte rentabilité grâce à une bonne gestion de la consommation';
}