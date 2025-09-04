import React from 'react';
import { Battery } from 'lucide-react';

interface AutoconsumptionDisplayProps {
  production: number;
  consommation: number;
}

export default function AutoconsumptionDisplay({ production, consommation }: AutoconsumptionDisplayProps) {
  if (!consommation) return null;

  const ratio = Math.min(production / consommation * 100, 100);
  const formattedRatio = Math.round(ratio);

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <Battery className="h-6 w-6 text-green-500" />
        <h3 className="text-lg font-medium text-gray-900">
          Taux d'autoconsommation estimé
        </h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-green-600">
          {formattedRatio}%
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {ratio >= 100 ? 'Production supérieure à votre consommation' :
         ratio >= 75 ? 'Excellente autonomie énergétique' :
         ratio >= 50 ? 'Bonne autonomie énergétique' :
         ratio >= 25 ? 'Autonomie énergétique modérée' :
         'Faible autonomie énergétique'}
      </p>
    </div>
  );
}