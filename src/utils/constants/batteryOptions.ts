import { PhysicalBattery, VirtualBattery } from '../../types/battery';

export const PHYSICAL_BATTERIES: PhysicalBattery[] = [
  {
    id: 'huawei-luna-e0-5',
    brand: 'HUAWEI',
    model: 'Luna E0',
    capacity: 5,
    duration: 10,
    monthlyPrice: 57.85,
    autoconsumptionIncrease: 15
  },
  {
    id: 'huawei-luna-e0-10',
    brand: 'HUAWEI',
    model: 'Luna E0',
    capacity: 10,
    duration: 10,
    monthlyPrice: 99.18,
    autoconsumptionIncrease: 20
  },
  {
    id: 'huawei-luna-e1-7-10',
    brand: 'HUAWEI',
    model: 'Luna E1',
    capacity: 7,
    duration: 10,
    monthlyPrice: 81.00,
    autoconsumptionIncrease: 17
  },
  {
    id: 'huawei-luna-e1-7-15',
    brand: 'HUAWEI',
    model: 'Luna E1',
    capacity: 7,
    duration: 15,
    monthlyPrice: 66.83,
    autoconsumptionIncrease: 17
  },
  {
    id: 'huawei-luna-e1-14-10',
    brand: 'HUAWEI',
    model: 'Luna E1',
    capacity: 14,
    duration: 10,
    monthlyPrice: 138.85,
    autoconsumptionIncrease: 22
  },
  {
    id: 'huawei-luna-e1-14-15',
    brand: 'HUAWEI',
    model: 'Luna E1',
    capacity: 14,
    duration: 15,
    monthlyPrice: 114.56,
    autoconsumptionIncrease: 22
  },
  {
    id: 'enphase-iq5p-5-10',
    brand: 'ENPHASE',
    model: 'IQ 5P',
    capacity: 5,
    duration: 10,
    monthlyPrice: 71.08,
    autoconsumptionIncrease: 15
  },
  {
    id: 'enphase-iq5p-5-15',
    brand: 'ENPHASE',
    model: 'IQ 5P',
    capacity: 5,
    duration: 15,
    monthlyPrice: 58.64,
    autoconsumptionIncrease: 15
  }
];

export const VIRTUAL_BATTERIES: VirtualBattery[] = [
  {
    capacity: 100,
    monthlyPrice: 15,
    initialFee: 2000,
    taxesPerKwh: 0.096
  },
  {
    capacity: 300,
    monthlyPrice: 24,
    initialFee: 2000,
    taxesPerKwh: 0.096
  },
  {
    capacity: 600,
    monthlyPrice: 30,
    initialFee: 2000,
    taxesPerKwh: 0.096
  },
  {
    capacity: 900,
    monthlyPrice: 35,
    initialFee: 2000,
    taxesPerKwh: 0.096
  }
];