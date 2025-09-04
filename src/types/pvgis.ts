export interface PVGISParams {
  lat: number;           // Latitude
  lon: number;          // Longitude
  peakPower: number;    // Puissance crête en kWc
  systemLoss: number;   // Pertes système en %
  tilt: number;         // Inclinaison en degrés
  azimuth: number;      // Orientation en degrés (-180 à 180, 0 = sud)
}

export interface PVGISResponse {
  inputs: {
    location: {
      latitude: number;
      longitude: number;
    };
    meteo_data: {
      radiation_db: string;
    };
    mounting_system: {
      fixed: {
        slope: {
          value: number;
        };
        azimuth: {
          value: number;
        };
      };
    };
    pv_module: {
      technology: string;
      peak_power: number;
    };
    system_loss: number;
  };
  outputs: {
    monthly: {
      fixed: Array<{
        month: number;
        E_d: number;  // Production quotidienne moyenne (kWh)
        E_m: number;  // Production mensuelle (kWh)
        H_i: number;  // Irradiation sur plan incliné (kWh/m2)
        SD_m: number; // Écart-type de la production mensuelle
      }>;
    };
    totals: {
      fixed: {
        E_d: number;  // Production quotidienne moyenne annuelle (kWh)
        E_m: number;  // Production mensuelle moyenne (kWh)
        E_y: number;  // Production annuelle totale (kWh)
        H_i_y: number; // Irradiation annuelle sur plan incliné (kWh/m2)
      };
    };
  };
}