import { PVGISParams, PVGISResponse } from '../../types/pvgis';
import { PVGIS_CONFIG } from '../constants/pvgisConfig';

const PVGIS_URL = 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc';

export async function getPVGISData(params: PVGISParams): Promise<PVGISResponse> {
  const queryParams = new URLSearchParams({
    ...PVGIS_CONFIG,
    lat: params.lat.toString(),
    lon: params.lon.toString(),
    peakpower: params.peakPower.toString(),
    loss: params.systemLoss.toString(),
    angle: params.tilt.toString(),
    aspect: params.azimuth.toString(),
    outputformat: 'json'
  });

  try {
    const response = await fetch(`${PVGIS_URL}?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`PVGIS API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.outputs?.totals?.fixed) {
      throw new Error('Invalid PVGIS response format');
    }

    return data;
  } catch (error) {
    console.error('PVGIS API error:', error);
    throw error;
  }
}