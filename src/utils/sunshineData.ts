import { SUNSHINE_HOURS } from './sunshineHours';

export function getSunshineHours(departement: string): number {
  const hours = SUNSHINE_HOURS[departement];
  if (!hours) {
    console.warn(`Pas de données d'ensoleillement pour le département ${departement}, utilisation de la moyenne nationale`);
    return 1300; // Moyenne nationale approximative
  }
  return hours;
}