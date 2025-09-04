import React, { useState } from 'react';
import { Home, Info } from 'lucide-react';
import { useClient } from '../../contexts/client';

// Coefficients régionaux de plus-value (basés sur l'attractivité solaire et immobilière)
const REGIONAL_COEFFICIENTS: { [key: string]: number } = {
  'Provence-Alpes-Côte d\'Azur': 1.2,  // Fort ensoleillement et marché dynamique
  'Occitanie': 1.15,
  'Nouvelle-Aquitaine': 1.1,
  'Auvergne-Rhône-Alpes': 1.05,
  'Corse': 1.2,
  'Bourgogne-Franche-Comté': 0.95,
  'Centre-Val de Loire': 0.95,
  'Grand Est': 0.9,
  'Hauts-de-France': 0.85,
  'Île-de-France': 1.1,  // Marché immobilier tendu
  'Normandie': 0.9,
  'Pays de la Loire': 1,
  'Bretagne': 0.95
};

interface PropertyValueIncreaseProps {
  installedPower: number;
}

export default function PropertyValueIncrease({ installedPower }: PropertyValueIncreaseProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { address } = useClient();
  
  // Calcul de la plus-value
  const baseIncrease = Math.max(0, installedPower || 0); // Assure une valeur positive
  const regionalCoefficient = address.region ? REGIONAL_COEFFICIENTS[address.region] || 1 : 1;
  const adjustedIncrease = baseIncrease * regionalCoefficient;
  const estimatedIncrease = Math.min(Math.max(0, adjustedIncrease), 10); // Entre 0 et 10%

  // Debug log
  console.log('Property Value Calculation:', {
    installedPower,
    baseIncrease,
    region: address.region,
    regionalCoefficient,
    adjustedIncrease,
    estimatedIncrease
  });

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Home className="h-6 w-6 text-purple-500" />
        <h4 className="font-medium text-gray-900">Plus-value immobilière</h4>
      </div>
      <p className="text-2xl font-bold text-purple-600">
        +{estimatedIncrease.toFixed(1)}%
      </p>
      <div className="relative">
        <p className="mt-2 text-sm text-gray-600">
          Valeur verte selon l'ADEME
          {address.region && regionalCoefficient !== 1 && (
            <span className="text-purple-600">
              {' '}• Région {address.region}
            </span>
          )}
        </p>
        <div 
          className="absolute right-0 top-0 cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="h-4 w-4 text-gray-400" />
          {showTooltip && (
            <div className="absolute z-10 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg -right-2 top-6 shadow-xl">
              <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
              <p className="mb-2">
                Estimation basée sur des études nationales (ADEME, notaires) :
              </p>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li>• 1% de plus-value par kWc installé</li>
                <li>• Coefficient régional : {regionalCoefficient.toFixed(2)}</li>
                <li>• Varie selon l'attractivité du marché local</li>
                <li>• Dépend des caractéristiques du bien</li>
                <li>• Estimation non contractuelle</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Label HPE (Haute Performance Énergétique)
      </p>
    </div>
  );
}