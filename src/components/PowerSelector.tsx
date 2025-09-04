import React, { useState, useEffect } from 'react';
import SelectFormField from './SelectFormField';
import { getPowerLimit } from '../utils/calculations/powerLimits';
import { useFinancialSettings } from '../contexts/FinancialSettingsContext';

interface PowerSelectorProps {
  value: number;
  onChange: (value: number) => void;
  typeCompteur: string;
}

export default function PowerSelector({ value, onChange, typeCompteur }: PowerSelectorProps) {
  const { settings } = useFinancialSettings();
  const [powerOptions, setPowerOptions] = useState<Array<{value: number, label: string}>>([]);
  
  // Update power options when settings or typeCompteur changes
  useEffect(() => {
    updatePowerOptions();
    
    // Listen for custom price updates
    const handleCustomPricesUpdate = () => {
      updatePowerOptions();
    };
    
    window.addEventListener('customPricesUpdated', handleCustomPricesUpdate);
    return () => {
      window.removeEventListener('customPricesUpdated', handleCustomPricesUpdate);
    };
  }, [settings, typeCompteur]);
  
  const updatePowerOptions = () => {
    // Always start from 2.5 kWc
    const options = [
      { value: 2.5, label: '2.5 kWc' }
    ];

    // Add all other powers from settings
    const allPowers = settings.installationPrices
      .map(p => p.power)
      .filter(p => p > 2.5)
      .sort((a, b) => a - b);

    // Filter according to the type of counter for powers ≤ 9kWc
    const maxStandardPower = getPowerLimit(typeCompteur);
    const standardPowers = allPowers.filter(p => p <= 9 && p <= maxStandardPower);
    
    // Add pro powers without counter limit
    const proPowers = allPowers.filter(p => p > 9);
    
    // Add all powers to options
    [...standardPowers, ...proPowers].forEach(power => {
      options.push({
        value: power,
        label: `${power.toFixed(1)} kWc${power > 9 ? ' (Pro)' : ''}`
      });
    });
    
    setPowerOptions(options);
    console.log('Updated power options:', options);
  };

  return (
    <div className="space-y-2">
      <SelectFormField
        label="Puissance de l'installation"
        name="puissanceCrete"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        options={powerOptions}
        unit="kWc"
      />
      {typeCompteur === 'monophase' && value <= 9 && (
        <p className="text-sm text-gray-500">
          Limité à 6 kWc en monophasé
        </p>
      )}
      {value > 9 && (
        <p className="text-sm text-amber-500">
          Installation professionnelle - Paiement comptant uniquement
        </p>
      )}
    </div>
  );
}