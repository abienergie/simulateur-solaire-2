import React, { useState, useEffect, useRef } from 'react';
import { COMPTEUR_OPTIONS } from '../../utils/constants';
import FormField from '../FormField';
import FormFieldWithTooltip from '../FormFieldWithTooltip';
import SelectFormField from '../SelectFormField';
import BatterySelector from '../BatterySelector';
import { formatCurrency } from '../../utils/formatters';
import { getPriceFromPower, calculateFinalPrice, calculateSubsidy } from '../../utils/calculations/priceCalculator';
import Tooltip from '../Tooltip';
import { Info } from 'lucide-react';
import { useFinancialSettings } from '../../contexts/FinancialSettingsContext';

const CONNECTION_OPTIONS = [
  { value: 'surplus', label: 'Auto-consommation + revente de surplus' },
  { value: 'total_auto', label: 'Auto-consommation totale' },
  { value: 'total_sale', label: 'Revente totale' }
];

interface FinancialParametersProps {
  parameters: FinancialParametersType;
  onParameterChange: (updates: Partial<FinancialParametersType>) => void;
  puissanceCrete: number;
}

export default function FinancialParameters({ 
  parameters, 
  onParameterChange,
  puissanceCrete
}: FinancialParametersProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { settings } = useFinancialSettings();
  
  useEffect(() => {
    if (!settings) return;

    const initialUpdates: Partial<FinancialParametersType> = {
      connectionType: 'surplus',
      autoconsommation: settings.defaultAutoconsumption
    };

    console.log('Calculating initial subsidy for power:', puissanceCrete);
    const primeAmount = calculateSubsidy(puissanceCrete, settings);
    console.log('Initial subsidy amount:', primeAmount);
    initialUpdates.primeAutoconsommation = primeAmount;

    onParameterChange(initialUpdates);
  }, [settings]);

  useEffect(() => {
    if (!settings) return;

    const connectionType = parameters.connectionType || 'surplus';
    let tariff = 0;

    if (parameters.batterySelection?.type === 'mybattery') {
      // Pour MyBattery, le tarif de revente est le prix du kWh moins les taxes d'acheminement
      tariff = Math.max(0, parameters.prixKwh - 0.0996);
      onParameterChange({ 
        primeAutoconsommation: 0,
        connectionType: 'surplus',
        autoconsommation: settings.defaultAutoconsumption
      });
    } else if (parameters.batterySelection?.type === 'virtual') {
      // Pour Smart Battery, on force l'autoconsommation totale
      onParameterChange({ 
        connectionType: 'total_auto'
      });
    } else if (connectionType === 'surplus' && settings.surplusSellPrices) {
      // Pour le surplus normal, on utilise les tarifs de revente standards
      if (puissanceCrete <= 9) {
        tariff = settings.surplusSellPrices.under9kw;
      } else if (puissanceCrete <= 36) {
        tariff = settings.surplusSellPrices.from9to36kw;
      } else if (puissanceCrete <= 100) {
        tariff = settings.surplusSellPrices.from36to100kw;
      }
    } else if (connectionType === 'total_sale' && settings.totalSellPrices) {
      // Pour la revente totale, on utilise les tarifs de revente totale
      if (puissanceCrete <= 9) {
        tariff = settings.totalSellPrices.under9kw;
      } else if (puissanceCrete <= 36) {
        tariff = settings.totalSellPrices.from9to36kw;
      } else if (puissanceCrete <= 100) {
        tariff = settings.totalSellPrices.from36to100kw;
      }
    }

    const updates: Partial<FinancialParametersType> = {
      tarifRevente: Number(tariff.toFixed(3))
    };

    if (connectionType === 'total_sale') {
      updates.autoconsommation = 0;
      updates.batterySelection = null;
    } else if (parameters.autoconsommation === 0) {
      updates.autoconsommation = settings.defaultAutoconsumption;
    }

    if (parameters.batterySelection?.type !== 'mybattery') {
      console.log('Recalculating subsidy for power:', puissanceCrete);
      const primeAmount = connectionType === 'surplus' ? calculateSubsidy(puissanceCrete, settings) : 0;
      console.log('New subsidy amount:', primeAmount);
      updates.primeAutoconsommation = primeAmount;
    }

    onParameterChange(updates);
  }, [parameters.connectionType, parameters.batterySelection?.type, parameters.prixKwh, puissanceCrete, settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue = parseFloat(value);

    switch (name) {
      case 'remiseCommerciale':
        parsedValue = Math.min(Math.max(0, parsedValue), 10000);
        break;
      case 'revalorisationEnergie':
        parsedValue = Math.min(Math.max(0, parsedValue), 10);
        break;
      case 'indexationProduction':
        parsedValue = Math.min(Math.max(-5, parsedValue), 3);
        break;
    }

    onParameterChange({ [name]: parsedValue });
  };

  const handleConnectionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (parameters.batterySelection?.type !== 'mybattery' && parameters.batterySelection?.type !== 'virtual') {
      onParameterChange({ connectionType: e.target.value });
    }
  };

  const handleBatteryChange = (batterySelection: any) => {
    let newAutoconsommation = settings?.defaultAutoconsumption ?? 75;

    if (batterySelection.type === 'physical' && batterySelection.model) {
      const increase = batterySelection.model.autoconsumptionIncrease;
      newAutoconsommation = Math.min(100, newAutoconsommation + increase);
    } else if (batterySelection.type === 'virtual') {
      newAutoconsommation = 100;
    } else if (batterySelection.type === 'mybattery') {
      newAutoconsommation = settings?.defaultAutoconsumption ?? 75;
    }

    onParameterChange({ 
      batterySelection,
      autoconsommation: parameters.connectionType === 'total_sale' ? 0 : newAutoconsommation,
      ...(batterySelection.type === 'mybattery' ? {
        connectionType: 'surplus',
        primeAutoconsommation: 0
      } : batterySelection.type === 'virtual' ? {
        connectionType: 'total_auto'
      } : {})
    });
  };

  const isMyBatterySelected = parameters.batterySelection?.type === 'mybattery';
  const isSmartBatterySelected = parameters.batterySelection?.type === 'virtual';
  const isConnectionTypeDisabled = isMyBatterySelected || isSmartBatterySelected;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Type de raccordement</h3>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <select
            value={parameters.connectionType || 'surplus'}
            onChange={handleConnectionTypeChange}
            disabled={isConnectionTypeDisabled}
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              isConnectionTypeDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            {CONNECTION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isMyBatterySelected && (
            <p className="mt-2 text-sm text-amber-600">
              Avec MyBattery, le surplus est automatiquement stocké sur le réseau pour être restitué ultérieurement.
              Le tarif de revente correspond au prix du kWh moins les taxes d'acheminement.
            </p>
          )}
          {isSmartBatterySelected && (
            <p className="mt-2 text-sm text-amber-600">
              Avec Smart Battery, toute l'énergie produite est autoconsommée grâce au pilotage intelligent.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            label="Prix du kWh"
            name="prixKwh"
            value={parameters.prixKwh}
            onChange={handleChange}
            min={0}
            max={1}
            step={0.01}
            unit="€/kWh"
          />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Tarif de revente
              </label>
              <div className="relative">
                <Info 
                  className="h-4 w-4 text-gray-400 cursor-help"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute z-10 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg -right-2 top-6">
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                    {isMyBatterySelected ? (
                      <p>Prix du kWh moins les taxes d'acheminement (0,0996€)</p>
                    ) : (
                      <p>Tarif en vigueur au {settings.sellPriceDate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                name="tarifRevente"
                value={(parameters.tarifRevente || 0).toFixed(3)}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm focus:border-gray-300 focus:ring-0 cursor-not-allowed disabled:bg-gray-100"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm">€/kWh</span>
              </div>
            </div>
          </div>

          <FormField
            label="Niveau d'autoconsommation"
            name="autoconsommation"
            value={parameters.autoconsommation ?? settings?.defaultAutoconsumption ?? 75}
            onChange={handleChange}
            min={0}
            max={100}
            unit="%"
            disabled={parameters.connectionType === 'total_sale' || isSmartBatterySelected}
          />

          <FormField
            label="Revalorisation annuelle"
            name="revalorisationEnergie"
            value={parameters.revalorisationEnergie}
            onChange={handleChange}
            min={0}
            max={10}
            unit="%"
          />

          <FormFieldWithTooltip
            label="Indexation revente"
            name="indexationProduction"
            value={parameters.indexationProduction}
            onChange={handleChange}
            min={-5}
            max={3}
            step={0.1}
            unit="%"
            tooltipContent="Évolution annuelle du tarif de revente de l'électricité"
          />

          <FormFieldWithTooltip
            label="Dégradation panneaux"
            name="degradationPanneau"
            value={parameters.degradationPanneau}
            onChange={handleChange}
            min={-2}
            max={0}
            step={0.1}
            unit="%"
            tooltipContent="Dégradation annuelle de la production des panneaux solaires (-0.2% par défaut)"
          />
        </div>

        <BatterySelector
          value={parameters.batterySelection || { type: null }}
          onChange={handleBatteryChange}
          subscriptionDuration={parameters.dureeAbonnement || 20}
          installedPower={puissanceCrete}
          initialAutoconsommation={settings?.defaultAutoconsumption ?? 75}
          connectionType={parameters.connectionType}
          batteryFormula={parameters.financingMode === 'subscription' ? 'abonnement' : 'comptant'}
        />
      </div>
    </div>
  );
}