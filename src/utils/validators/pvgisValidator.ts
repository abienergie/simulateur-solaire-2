import { PVGISResponse } from '../../types/pvgis';

export function validatePVGISResponse(data: any): PVGISResponse {
  if (!data?.outputs?.totals?.fixed) {
    throw new Error('Invalid PVGIS response format');
  }

  // Validation plus détaillée si nécessaire
  const { outputs, inputs } = data;
  
  if (!outputs.totals.fixed.E_y || typeof outputs.totals.fixed.E_y !== 'number') {
    throw new Error('Missing or invalid annual production data');
  }

  return data as PVGISResponse;
}