import React from 'react';
import { PowerTerms } from '../../types/exitTerms';

interface PowerSelectorProps {
  powers: PowerTerms[];
  selectedPower: string;
  onPowerChange: (power: string) => void;
}

export default function PowerSelector({ powers, selectedPower, onPowerChange }: PowerSelectorProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="flex items-center gap-4">
        <label htmlFor="power" className="text-sm font-medium text-gray-700">
          Puissance :
        </label>
        <select
          id="power"
          value={selectedPower}
          onChange={(e) => onPowerChange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="2.5">2.5 kWc</option>
          <option value="3.0">3.0 kWc</option>
          <option value="3.5">3.5 kWc</option>
          <option value="4.0">4.0 kWc</option>
          <option value="4.5">4.5 kWc</option>
          <option value="5.0">5.0 kWc</option>
          <option value="5.5">5.5 kWc</option>
          <option value="6.0">6.0 kWc</option>
          <option value="6.5">6.5 kWc</option>
          <option value="7.0">7.0 kWc</option>
          <option value="7.5">7.5 kWc</option>
          <option value="8.0">8.0 kWc</option>
          <option value="8.5">8.5 kWc</option>
          <option value="9.0">9.0 kWc</option>
        </select>
      </div>
    </div>
  );
}