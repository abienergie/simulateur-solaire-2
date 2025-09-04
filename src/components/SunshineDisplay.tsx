import React from 'react';
import { getSunshineHours } from '../utils/sunshineData';
import { Sun } from 'lucide-react';
import Tooltip from './Tooltip';

interface SunshineDisplayProps {
  codePostal: string;
}

export default function SunshineDisplay({ codePostal }: SunshineDisplayProps) {
  if (!codePostal) return null;

  const departement = codePostal.substring(0, 2);
  const ensoleillement = getSunshineHours(departement);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-yellow-50 p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <Sun className="h-6 w-6 text-yellow-500" />
        <h3 className="text-lg font-medium text-gray-900">
          Ensoleillement de votre région
          <Tooltip content="Données issues de PVGIS (Photovoltaic Geographical Information System) de la Commission Européenne. L'ensoleillement est mesuré sur une surface horizontale en kWh/m²/an." />
        </h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-blue-600">
          {ensoleillement.toLocaleString()}
        </span>
        <span className="text-gray-600">kWh/m²/an</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {ensoleillement >= 1500 ? 'Excellent potentiel solaire' :
         ensoleillement >= 1300 ? 'Très bon potentiel solaire' :
         ensoleillement >= 1100 ? 'Bon potentiel solaire' :
         'Potentiel solaire modéré'}
      </p>
    </div>
  );
}