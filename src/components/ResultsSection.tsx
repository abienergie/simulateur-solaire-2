import React from 'react';
import { Settings } from 'lucide-react';
import { ProductionResult } from '../types';

interface ResultsSectionProps {
  result: ProductionResult;
  onModifyPower?: () => void;
}

export default function ResultsSection({ result, onModifyPower }: ResultsSectionProps) {
  // Calculate surface based on power (2.25m² per 500Wc)
  const surfaceTotale = (result.puissanceCrete * 1000 / 500) * 2.25;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Résultats estimés
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Production annuelle</p>
          <p className="text-2xl font-bold text-blue-600">
            {result.productionAnnuelle.toLocaleString()} kWh/an
          </p>
        </div>

        <div className="relative bg-blue-50 p-4 rounded-lg group">
          <p className="text-sm text-gray-600">Puissance crête</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-blue-600">
              {result.puissanceCrete.toFixed(1)} kWc
            </p>
            {onModifyPower && (
              <button
                onClick={onModifyPower}
                className="text-sm text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Modifier
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Surface totale</p>
          <p className="text-2xl font-bold text-blue-600">
            {surfaceTotale.toFixed(1)} m²
          </p>
        </div>
      </div>
    </div>
  );
}