import { enedisApi } from './enedisApi';

// Exporter directement l'API réelle, sans simulation
export const getEnedisApi = () => {
  console.log('🔄 Utilisation de l\'API Enedis réelle');
  return enedisApi;
};