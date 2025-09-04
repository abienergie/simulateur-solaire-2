import { getOrientationCoefficient } from './orientationCoefficients';
import { calculateSystemLossFactor } from './solarFactors';

export function calculateBaseProduction(
  puissanceCrete: number,
  heuresEnsoleillement: number,
  pertes: number
): number {
  const systemEfficiency = calculateSystemLossFactor(pertes);
  return puissanceCrete * heuresEnsoleillement * systemEfficiency;
}

export function calculateAdjustedProduction(
  productionBase: number,
  orientation: number,
  inclinaison: number
): number {
  const coefficient = getOrientationCoefficient(orientation, inclinaison);
  return productionBase * coefficient;
}