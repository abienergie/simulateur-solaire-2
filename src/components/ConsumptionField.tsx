import React from 'react';
import FormField from './FormField';
import { Zap } from 'lucide-react';

interface ConsumptionFieldProps {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

export default function ConsumptionField({ 
  value, 
  onChange, 
  label = "Consommation annuelle estimée" 
}: ConsumptionFieldProps) {
  return (
    <div className="space-y-4">
      <FormField
        label={label}
        name="consommationAnnuelle"
        value={value}
        onChange={onChange}
        min={0}
        max={100000}
        step={100}
        unit="kWh/an"
      />
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-gray-500">
          Vous trouverez votre consommation annuelle sur votre facture d'électricité.
        </p>
      </div>
    </div>
  );
}