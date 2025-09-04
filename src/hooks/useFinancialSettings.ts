import { useState, useEffect } from 'react';

interface FinancialSettings {
  baseKwhPrice: number;
  baseSellPrice: number;
}

const DEFAULT_SETTINGS: FinancialSettings = {
  baseKwhPrice: 0.25,
  baseSellPrice: 0.1269
};

export function useFinancialSettings() {
  const [settings, setSettings] = useState<FinancialSettings>(() => {
    const savedKwhPrice = localStorage.getItem('base_kwh_price');
    const savedSellPrice = localStorage.getItem('base_sell_price');
    
    return {
      baseKwhPrice: savedKwhPrice ? parseFloat(savedKwhPrice) : DEFAULT_SETTINGS.baseKwhPrice,
      baseSellPrice: savedSellPrice ? parseFloat(savedSellPrice) : DEFAULT_SETTINGS.baseSellPrice
    };
  });

  const updateSettings = (updates: Partial<FinancialSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Sauvegarde dans le localStorage
      if (updates.baseKwhPrice !== undefined) {
        localStorage.setItem('base_kwh_price', updates.baseKwhPrice.toString());
      }
      if (updates.baseSellPrice !== undefined) {
        localStorage.setItem('base_sell_price', updates.baseSellPrice.toString());
      }
      
      return newSettings;
    });
  };

  return {
    settings,
    updateSettings
  };
}