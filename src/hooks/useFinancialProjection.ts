import { useState, useCallback, useEffect } from 'react';
import { FinancialParameters, FinancialProjection } from '../types/financial';
import { generateFinancialProjection } from '../utils/calculations/financialProjection';
import { useFinancialSettings } from '../contexts/FinancialSettingsContext';

export function useFinancialProjection() {
  const { settings } = useFinancialSettings();
  const [parameters, setParameters] = useState<FinancialParameters>(() => {
    // Load saved parameters from localStorage
    const savedMode = localStorage.getItem('financialMode');
    const savedPrimeAutoconsommation = localStorage.getItem('primeAutoconsommation');
    const savedRemiseCommerciale = localStorage.getItem('remiseCommerciale');
    const savedDuration = localStorage.getItem('subscriptionDuration');
    const savedConnectionType = localStorage.getItem('connectionType');
    const savedBatterySelection = localStorage.getItem('batterySelection');
    
    return {
      financingMode: (savedMode as 'cash' | 'subscription') || 'cash',
      prixKwh: settings.baseKwhPrice,
      tarifRevente: settings.baseSellPrice,
      autoconsommation: settings.defaultAutoconsumption,
      revalorisationEnergie: settings.defaultEnergyRevaluation,
      indexationProduction: settings.defaultSellIndexation,
      degradationPanneau: settings.defaultPanelDegradation,
      dureeAbonnement: savedDuration ? parseInt(savedDuration, 10) : 20,
      primeAutoconsommation: savedPrimeAutoconsommation ? parseFloat(savedPrimeAutoconsommation) : 0,
      remiseCommerciale: savedRemiseCommerciale ? parseFloat(savedRemiseCommerciale) : 0,
      connectionType: savedConnectionType || 'surplus',
      batterySelection: savedBatterySelection ? JSON.parse(savedBatterySelection) : null
    };
  });
  console.log('[useFinancialProjection] init parameters.financingMode =', parameters.financingMode);
  const [projection, setProjection] = useState<FinancialProjection | null>(null);

  // Mettre à jour les paramètres quand les paramètres financiers changent
  useEffect(() => {
    setParameters(prev => ({
      ...prev,
      prixKwh: settings.baseKwhPrice,
      tarifRevente: settings.baseSellPrice,
      autoconsommation: settings.defaultAutoconsumption,
      revalorisationEnergie: settings.defaultEnergyRevaluation,
      indexationProduction: settings.defaultSellIndexation,
      degradationPanneau: settings.defaultPanelDegradation
    }));
  }, [settings]);

  // Écouter les changements de paramètres financiers
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent<FinancialParameters>) => {
      setParameters(prev => ({
        ...prev,
        ...event.detail
      }));
    };

    window.addEventListener('financialSettingsUpdated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('financialSettingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const updateParameters = useCallback((updates: Partial<FinancialParameters>) => {
    console.log('[useFinancialProjection] updateParameters called with:', updates);
    setParameters(prev => {
      const newParams = { ...prev, ...updates };
      console.log('[useFinancialProjection] new parameters.financingMode =', newParams.financingMode);
      
      // Save to localStorage for persistence
      if (updates.financingMode) {
        localStorage.setItem('financialMode', updates.financingMode);
        console.log('[useFinancialProjection] saved financingMode to localStorage:', updates.financingMode);
      }
      
      if (updates.primeAutoconsommation !== undefined) {
        localStorage.setItem('primeAutoconsommation', updates.primeAutoconsommation.toString());
      }
      
      if (updates.remiseCommerciale !== undefined) {
        localStorage.setItem('remiseCommerciale', updates.remiseCommerciale.toString());
      }
      
      if (updates.dureeAbonnement) {
        localStorage.setItem('subscriptionDuration', updates.dureeAbonnement.toString());
      }
      
      if (updates.connectionType) {
        localStorage.setItem('connectionType', updates.connectionType);
      }
      
      if (updates.batterySelection !== undefined) {
        if (updates.batterySelection) {
          localStorage.setItem('batterySelection', JSON.stringify(updates.batterySelection));
        } else {
          localStorage.removeItem('batterySelection');
        }
      }
      
      return newParams;
    });
  }, []);

  const calculateProjection = useCallback((productionAnnuelle: number, puissanceCrete: number) => {
    const newProjection = generateFinancialProjection(
      parameters,
      productionAnnuelle,
      puissanceCrete
    );
    setProjection(newProjection);
  }, [parameters]);

  return {
    parameters,
    projection,
    updateParameters,
    calculateProjection
  };
}