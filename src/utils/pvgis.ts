import { SolarParameters } from '../types';
import { calculateFallbackProduction } from './fallbackCalculations';

interface PVGISResponse {
  outputs: {
    yearly: {
      fixed: {
        E_y: number;
      };
    };
  };
}

export async function getPVGISData(
  coordinates: { lat: number; lon: number },
  peakPower: number,
  loss: number,
  angle: number,
  azimuth: number
): Promise<number> {
  try {
    if (!coordinates?.lat || !coordinates?.lon) {
      throw new Error('Coordonnées invalides');
    }

    if (peakPower <= 0) {
      throw new Error('Puissance invalide');
    }

    const url = new URL('https://re.jrc.ec.europa.eu/api/v5_2/PVcalc');
    const params = {
      lat: coordinates.lat.toString(),
      lon: coordinates.lon.toString(),
      peakpower: peakPower.toString(),
      loss: Math.min(Math.max(0, loss), 100).toString(),
      angle: Math.min(Math.max(0, angle), 90).toString(),
      aspect: Math.min(Math.max(-180, azimuth), 180).toString(),
      outputformat: 'json',
      pvtechchoice: 'crystSi',
      mountingplace: 'free',
      raddatabase: 'PVGIS-SARAH2',
      browser: '1'
    };

    const searchParams = new URLSearchParams(params);
    const apiUrl = `${url.toString()}?${searchParams.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Solar Calculator'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur PVGIS (${response.status})`);
    }

    const data: PVGISResponse = await response.json();
    
    if (!data?.outputs?.yearly?.fixed?.E_y) {
      throw new Error('Format de réponse PVGIS invalide');
    }
    
    return data.outputs.yearly.fixed.E_y;
  } catch (error) {
    return calculateFallbackProduction(peakPower, loss, angle, azimuth);
  }
}