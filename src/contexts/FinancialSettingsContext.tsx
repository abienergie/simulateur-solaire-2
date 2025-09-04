import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SubsidyRanges, Subsidy } from '../types/subsidies';
import { FinancialSettings, InstallationPrice } from '../types/financial';
import { DEFAULT_FINANCIAL_SETTINGS } from '../utils/constants/financialConstants';
import { saveCustomPrice } from '../utils/calculations/priceCalculator';

interface FinancialSettingsContextType {
  settings: FinancialSettings;
  updateSettings: (updates: Partial<FinancialSettings>) => void;
  addInstallationPrice: (power: number, price: number) => void;
  removeInstallationPrice: (power: number) => void;
}

const DEFAULT_INSTALLATION_PRICES: InstallationPrice[] = [
  { power: 2.5, price: 6890 },
  { power: 3.0, price: 7890 },
  { power: 3.5, price: 8890 },
  { power: 4.0, price: 9890 },
  { power: 4.5, price: 10890 },
  { power: 5.0, price: 11890 },
  { power: 5.5, price: 12890 },
  { power: 6.0, price: 14890 },
  { power: 6.5, price: 15890 },
  { power: 7.0, price: 16890 },
  { power: 7.5, price: 17890 },
  { power: 8.0, price: 18890 },
  { power: 8.5, price: 19890 },
  { power: 9.0, price: 19890 }
];

const DEFAULT_SETTINGS: FinancialSettings = {
  ...DEFAULT_FINANCIAL_SETTINGS,
  installationPrices: DEFAULT_INSTALLATION_PRICES
};

// Default subsidies to use if Supabase query fails
const DEFAULT_SUBSIDIES: SubsidyRanges = [
  { min: 0, max: 3, amount: 380 },
  { min: 3, max: 9, amount: 280 },
  { min: 9, max: 36, amount: 160 },
  { min: 36, max: 100, amount: 80 }
];

const FinancialSettingsContext = createContext<FinancialSettingsContextType | undefined>(undefined);

export function FinancialSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<FinancialSettings>(() => {
    try {
      const savedSettings = {
        ...DEFAULT_SETTINGS,
        baseKwhPrice: parseFloat(localStorage.getItem('base_kwh_price') || DEFAULT_SETTINGS.baseKwhPrice.toString()),
        surplusSellPrices: {
          under9kw: parseFloat(localStorage.getItem('surplus_sell_price_under_9kw') || DEFAULT_SETTINGS.surplusSellPrices.under9kw.toString()),
          from9to36kw: parseFloat(localStorage.getItem('surplus_sell_price_9to36kw') || DEFAULT_SETTINGS.surplusSellPrices.from9to36kw.toString()),
          from36to100kw: parseFloat(localStorage.getItem('surplus_sell_price_36to100kw') || DEFAULT_SETTINGS.surplusSellPrices.from36to100kw.toString())
        },
        totalSellPrices: {
          under9kw: parseFloat(localStorage.getItem('total_sell_price_under_9kw') || DEFAULT_SETTINGS.totalSellPrices.under9kw.toString()),
          from9to36kw: parseFloat(localStorage.getItem('total_sell_price_9to36kw') || DEFAULT_SETTINGS.totalSellPrices.from9to36kw.toString()),
          from36to100kw: parseFloat(localStorage.getItem('total_sell_price_36to100kw') || DEFAULT_SETTINGS.totalSellPrices.from36to100kw.toString())
        },
        sellPriceDate: localStorage.getItem('sell_price_date') || DEFAULT_SETTINGS.sellPriceDate,
        defaultAutoconsumption: parseFloat(localStorage.getItem('default_autoconsumption') || DEFAULT_SETTINGS.defaultAutoconsumption.toString()),
        defaultEnergyRevaluation: parseFloat(localStorage.getItem('default_energy_revaluation') || DEFAULT_SETTINGS.defaultEnergyRevaluation.toString()),
        defaultSellIndexation: parseFloat(localStorage.getItem('default_sell_indexation') || DEFAULT_SETTINGS.defaultSellIndexation.toString()),
        defaultPanelDegradation: parseFloat(localStorage.getItem('default_panel_degradation') || DEFAULT_SETTINGS.defaultPanelDegradation.toString()),
        installationPrices: [...DEFAULT_INSTALLATION_PRICES],
        subsidies: DEFAULT_SUBSIDIES
      };

      // Load custom installation prices
      const savedPrices = localStorage.getItem('installation_prices');
      if (savedPrices) {
        try {
          const customPrices = JSON.parse(savedPrices);
          if (Array.isArray(customPrices)) {
            const validCustomPrices = customPrices.filter(p => 
              p && typeof p.power === 'number' && typeof p.price === 'number' && p.power > 0
            );
            
            // Update standard prices (≤ 9 kWc) if they exist in custom prices
            const standardPrices = savedSettings.installationPrices.map(defaultPrice => {
              const customPrice = validCustomPrices.find(p => Math.abs(p.power - defaultPrice.power) < 0.01);
              return customPrice || defaultPrice;
            });
            
            // Add pro prices (> 9 kWc)
            const proPrices = validCustomPrices.filter(p => p.power > 9);
            
            savedSettings.installationPrices = [
              ...standardPrices,
              ...proPrices
            ].sort((a, b) => a.power - b.power);
            
            console.log('Loaded custom prices:', validCustomPrices);
          }
        } catch (error) {
          console.error('Error parsing custom prices:', error);
        }
      }

      return savedSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  });

  // Listen for custom price updates
  useEffect(() => {
    const handleCustomPricesUpdate = (event: CustomEvent) => {
      const customPrices = event.detail;
      if (!Array.isArray(customPrices)) return;
      
      setSettings(prev => {
        // Update standard prices (≤ 9 kWc) if they exist in custom prices
        const standardPrices = prev.installationPrices
          .filter(p => p.power <= 9)
          .map(defaultPrice => {
            const customPrice = customPrices.find(p => Math.abs(p.power - defaultPrice.power) < 0.01);
            return customPrice || defaultPrice;
          });
        
        // Add pro prices (> 9 kWc)
        const proPrices = customPrices.filter(p => p.power > 9);
        
        const updatedPrices = [
          ...standardPrices,
          ...proPrices
        ].sort((a, b) => a.power - b.power);
        
        return {
          ...prev,
          installationPrices: updatedPrices
        };
      });
    };

    window.addEventListener('customPricesUpdated', handleCustomPricesUpdate as EventListener);
    return () => {
      window.removeEventListener('customPricesUpdated', handleCustomPricesUpdate as EventListener);
    };
  }, []);

  // Load subsidies from Supabase
  useEffect(() => {
    const loadSubsidies = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Add timeout and retry logic for network issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const { data, error } = await supabase
          .from('subsidies')
          .select('id, amount, effective_date, power_range')
          .lte('effective_date', today)
          .order('effective_date', { ascending: false })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.warn('Supabase subsidies query failed:', error);
          // Fallback to default subsidies on Supabase error
          setSettings(prev => ({
            ...prev,
            subsidies: DEFAULT_SUBSIDIES
          }));
          console.log('Using default subsidies due to network/Supabase error');
          return;
        }

        // Process subsidies and keep only the most recent for each range
        const processedSubsidies = data.reduce((acc: SubsidyRanges, curr) => {
          try {
            const [min, max] = curr.power_range.split('-').map(Number);
            
            // Check if we already have this range
            const existingIndex = acc.findIndex(s => s.min === min && s.max === max);
            
            if (existingIndex === -1) {
              // Add new range
              acc.push({ min, max, amount: curr.amount });
            }
            // We don't need an else case because we ordered by date desc,
            // so we always keep the first (most recent) entry
          } catch (e) {
            console.error('Error processing subsidy range:', e);
          }
          
          return acc;
        }, []);

        setSettings(prev => ({
          ...prev,
          subsidies: processedSubsidies
        }));
        
        console.log('Loaded subsidies:', processedSubsidies);
      } catch (error) {
        console.warn('Supabase connection failed:', error.name === 'AbortError' ? 'Timeout' : error.message);
        
        // Fallback to default subsidies if Supabase query fails
        setSettings(prev => ({
          ...prev,
          subsidies: DEFAULT_SUBSIDIES
        }));
        
        console.log('Using default subsidies due to connection error');
      }
    };

    loadSubsidies();
  }, []);

  const updateSettings = (updates: Partial<FinancialSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Save to localStorage
      if (updates.baseKwhPrice !== undefined) {
        localStorage.setItem('base_kwh_price', updates.baseKwhPrice.toString());
      }
      
      if (updates.surplusSellPrices) {
        Object.entries(updates.surplusSellPrices).forEach(([key, value]) => {
          localStorage.setItem(`surplus_sell_price_${key}`, value.toString());
        });
      }
      
      if (updates.totalSellPrices) {
        Object.entries(updates.totalSellPrices).forEach(([key, value]) => {
          localStorage.setItem(`total_sell_price_${key}`, value.toString());
        });
      }
      
      if (updates.sellPriceDate) {
        localStorage.setItem('sell_price_date', updates.sellPriceDate);
      }
      
      if (updates.defaultAutoconsumption !== undefined) {
        localStorage.setItem('default_autoconsumption', updates.defaultAutoconsumption.toString());
      }
      
      if (updates.defaultEnergyRevaluation !== undefined) {
        localStorage.setItem('default_energy_revaluation', updates.defaultEnergyRevaluation.toString());
      }
      
      if (updates.defaultSellIndexation !== undefined) {
        localStorage.setItem('default_sell_indexation', updates.defaultSellIndexation.toString());
      }
      
      if (updates.defaultPanelDegradation !== undefined) {
        localStorage.setItem('default_panel_degradation', updates.defaultPanelDegradation.toString());
      }

      // If installation prices are updated, save standard prices to localStorage
      if (updates.installationPrices) {
        const standardPrices = updates.installationPrices
          .filter(p => p.power <= 9)
          .map(p => ({ power: p.power, price: p.price }));
          
        const savedPrices = localStorage.getItem('installation_prices');
        let existingPrices = [];
        
        try {
          existingPrices = savedPrices ? JSON.parse(savedPrices) : [];
          // Keep only pro prices
          existingPrices = existingPrices.filter((p: any) => p.power > 9);
        } catch (e) {
          console.error('Error parsing existing prices:', e);
        }
        
        // Add standard prices that have been modified from defaults
        standardPrices.forEach(p => {
          const defaultPrice = DEFAULT_INSTALLATION_PRICES.find(dp => dp.power === p.power);
          if (defaultPrice && p.price !== defaultPrice.price) {
            existingPrices.push(p);
          }
        });
        
        localStorage.setItem('installation_prices', JSON.stringify(existingPrices));
        
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('customPricesUpdated', {
          detail: existingPrices
        }));
      }

      return newSettings;
    });
  };

  const addInstallationPrice = (power: number, price: number) => {
    if (power <= 0 || price <= 0) {
      console.error('Power and price must be positive');
      return;
    }

    setSettings(prev => {
      const existingIndex = prev.installationPrices.findIndex(p => Math.abs(p.power - power) < 0.01);
      
      let newPrices;
      if (existingIndex >= 0) {
        newPrices = [...prev.installationPrices];
        newPrices[existingIndex] = { power, price };
      } else {
        newPrices = [...prev.installationPrices, { power, price }];
      }
      
      newPrices.sort((a, b) => a.power - b.power);

      // Save to localStorage using the utility function
      saveCustomPrice(power, price);

      return {
        ...prev,
        installationPrices: newPrices
      };
    });
  };

  const removeInstallationPrice = (power: number) => {
    if (power <= 9) {
      console.error('Cannot remove default prices');
      return;
    }

    setSettings(prev => {
      const newPrices = prev.installationPrices.filter(p => Math.abs(p.power - power) >= 0.01);
      
      // Update localStorage
      const savedPrices = localStorage.getItem('installation_prices');
      if (savedPrices) {
        try {
          const existingPrices = JSON.parse(savedPrices);
          const updatedPrices = existingPrices.filter((p: any) => Math.abs(p.power - power) >= 0.01);
          localStorage.setItem('installation_prices', JSON.stringify(updatedPrices));
          
          // Dispatch event to notify components
          window.dispatchEvent(new CustomEvent('customPricesUpdated', {
            detail: updatedPrices
          }));
        } catch (e) {
          console.error('Error updating localStorage after price removal:', e);
        }
      }

      return {
        ...prev,
        installationPrices: newPrices
      };
    });
  };

  return (
    <FinancialSettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      addInstallationPrice,
      removeInstallationPrice
    }}>
      {children}
    </FinancialSettingsContext.Provider>
  );
}

export function useFinancialSettings() {
  const context = useContext(FinancialSettingsContext);
  if (context === undefined) {
    throw new Error('useFinancialSettings must be used within a FinancialSettingsProvider');
  }
  return context;
}