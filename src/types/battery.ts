export interface PhysicalBattery {
  id: string;
  brand: 'HUAWEI' | 'ENPHASE' | 'CUSTOM';
  model: string;
  capacity: number;
  oneTimePrice?: number;
  duration?: number;
  monthlyPrice?: number;
  autoconsumptionIncrease: number;
}

export interface VirtualBattery {
  capacity: number;
  monthlyPrice: number;
  initialFee: number;
  taxesPerKwh: number;
}

export interface BatterySelection {
  type: 'physical' | 'virtual' | 'mybattery' | null;
  model?: PhysicalBattery;
  virtualCapacity?: number;
  includeSmartCharger?: boolean;
  resetAutoconsumption?: number;
}