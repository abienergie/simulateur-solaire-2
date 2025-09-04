import React from 'react';
import { COMPTEUR_OPTIONS } from '../utils/constants';
import SelectFormField from './SelectFormField';
import ConsumptionField from './ConsumptionField';

interface SizingSectionProps {
  typeCompteur: string;
  consommationAnnuelle: number;
  onTypeCompteurChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onConsommationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SizingSection({
  typeCompteur,
  consommationAnnuelle,
  onTypeCompteurChange,
  onConsommationChange
}: SizingSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Dimensionnement
      </h3>
      <div className="space-y-6">
        <SelectFormField
          label="Type de compteur"
          name="typeCompteur"
          value={typeCompteur}
          onChange={onTypeCompteurChange}
          options={COMPTEUR_OPTIONS}
        />
        
        <ConsumptionField
          value={consommationAnnuelle}
          onChange={onConsommationChange}
        />
      </div>
    </div>
  );
}