/**
 * Types for Enedis API data
 */

export interface ConsumptionData {
  prm: string;
  date: string;
  peakHours?: number;
  offPeakHours?: number;
  peak_hours?: number;
  off_peak_hours?: number;
}

export interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number;
  is_off_peak: boolean;
}

export interface MonthlyConsumption {
  month: string;  // YYYY-MM-01
  hp: number;
  hc: number;
  total: number;
}

export interface ClientProfile {
  usage_point_id: string;
  identity?: any;
  address?: any;
  contract?: any;
  contact?: any;
  coordinates?: any;
  updated_at?: string;
}

export interface EnedisDataResponse {
  clientProfile?: ClientProfile;
  consumptionData?: {
    consumption: ConsumptionData[];
  };
  loadCurveData?: {
    loadCurve: LoadCurvePoint[];
  };
}