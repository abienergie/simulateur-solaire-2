import { SunshineData } from '../../types/sunshine';

const API_URL = 'https://www.data.gouv.fr/api/1/datasets/donnees-du-temps-densoleillement-par-departements-en-france';

export async function fetchSunshineData(): Promise<SunshineData[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.resources[0].data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
}