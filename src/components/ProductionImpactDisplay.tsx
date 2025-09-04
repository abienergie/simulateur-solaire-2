import React from 'react';
import { getOrientationCoefficient } from '../utils/orientationCoefficients';

interface ProductionImpactDisplayProps {
  orientation: number;
  inclinaison: number;
  productionBase: number;
}

export default function ProductionImpactDisplay({
  orientation,
  inclinaison,
  productionBase
}: ProductionImpactDisplayProps) {
  const coefficient = getOrientationCoefficient(orientation, inclinaison);
  const productionAjustee = productionBase * coefficient;
  const difference = productionAjustee - productionBase;

  return (
    <div className="bg-gray-50 p-4 rounded-md space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Production de base</p>
          <p className="text-lg font-semibold">{Math.round(productionBase)} kWh/an</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Production ajustée</p>
          <p className="text-lg font-semibold">{Math.round(productionAjustee)} kWh/an</p>
        </div>
      </div>
      <div className="text-sm">
        <span className={difference >= 0 ? 'text-green-600' : 'text-red-600'}>
          {difference >= 0 ? '+' : ''}{Math.round(difference)} kWh/an
        </span>
        <span className="text-gray-500"> dû à l'orientation/inclinaison</span>
      </div>
    </div>
  );
}