/**
 * Mapping des puissances et durées d'abonnement vers les IDs de packages iColl
 * Ces IDs sont les identifiants réels des packages dans le système iColl
 */
export const PACKAGE_MAPPING: {[key: string]: {[key: number]: string}} = {
  '2.5': {
    10: '44',
    15: '42',
    20: '43',
    25: '27'
  },
  '3.0': {
    10: '46',
    15: '45',
    20: '28',
    25: '47'
  },
  '3.5': {
    10: '50',
    15: '49',
    20: '48',
    25: '29'
  },
  '4.0': {
    10: '53',
    15: '52',
    20: '51',
    25: '30'
  },
  '4.5': {
    10: '56',
    15: '55',
    20: '31',
    25: '54'
  },
  '5.0': {
    10: '59',
    15: '58',
    20: '57',
    25: '19'
  },
  '5.5': {
    10: '62',
    15: '61',
    20: '60',
    25: '32'
  },
  '6.0': {
    10: '65',
    15: '64',
    20: '63',
    25: '33'
  },
  '6.5': {
    10: '68',
    15: '67',
    20: '66',
    25: '34'
  },
  '7.0': {
    10: '71',
    15: '70',
    20: '69',
    25: '35'
  },
  '7.5': {
    10: '74',
    15: '73',
    20: '72',
    25: '36'
  },
  '8.0': {
    10: '77',
    15: '76',
    20: '75',
    25: '37'
  },
  '8.5': {
    10: '80',
    15: '79',
    20: '78',
    25: '38'
  },
  '9.0': {
    10: '81',
    15: '41',
    20: '40',
    25: '39'
  }
};

/**
 * Récupère l'ID du package iColl correspondant à une puissance et une durée d'abonnement
 * @param powerInKw Puissance en kWc
 * @param duration Durée d'abonnement en années
 * @returns ID du package iColl
 */
export function getPackageId(powerInKw: number, duration: number): string {
  // Arrondir à 0.5 kW près
  const roundedPower = Math.round(powerInKw * 2) / 2;
  const powerKey = roundedPower.toFixed(1);
  
  // Normaliser la durée à une valeur valide (10, 15, 20 ou 25 ans)
  let normalizedDuration = 20; // Valeur par défaut
  if (duration <= 10) normalizedDuration = 10;
  else if (duration <= 15) normalizedDuration = 15;
  else if (duration <= 20) normalizedDuration = 20;
  else normalizedDuration = 25;
  
  // Vérifier si on a un mapping pour cette puissance et cette durée
  if (PACKAGE_MAPPING[powerKey] && PACKAGE_MAPPING[powerKey][normalizedDuration]) {
    const packageId = PACKAGE_MAPPING[powerKey][normalizedDuration];
    console.log(`Package ID pour ${powerKey} kWc et ${normalizedDuration} ans: ${packageId}`);
    return packageId;
  }
  
  // Si la puissance n'est pas dans le mapping, utiliser la puissance la plus proche
  const availablePowers = Object.keys(PACKAGE_MAPPING).map(Number);
  if (availablePowers.length > 0) {
    // Trouver la puissance la plus proche
    const closestPower = availablePowers.reduce((prev, curr) => {
      return Math.abs(curr - roundedPower) < Math.abs(prev - roundedPower) ? curr : prev;
    });
    
    const closestPowerKey = closestPower.toFixed(1);
    if (PACKAGE_MAPPING[closestPowerKey] && PACKAGE_MAPPING[closestPowerKey][normalizedDuration]) {
      const packageId = PACKAGE_MAPPING[closestPowerKey][normalizedDuration];
      console.log(`Utilisation du package le plus proche: ${closestPowerKey} kWc et ${normalizedDuration} ans: ${packageId}`);
      return packageId;
    }
  }
  
  // Fallback: retourner un code par défaut
  console.warn(`Pas de mapping trouvé pour ${powerKey} kWc et ${normalizedDuration} ans, utilisation du package par défaut`);
  return '44'; // Code par défaut (2.5kWc - 10 ans)
}