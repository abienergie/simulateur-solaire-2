import { useState, useEffect } from 'react';
import { SUBSCRIPTION_PROMO_CODES, LOCAL_PROMO_CODES } from '../utils/constants/promoCodeConstants';

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  active: boolean;
  expiration_date: string | null;
  created_at: string;
  type?: 'standard' | 'subscription_only';
  subscription_effect?: 'free_months' | 'free_deposit' | 'free_battery_setup' | 'free_smart_battery_setup';
  free_months?: number;
}

interface ApplyPromoCodeResult {
  success: boolean;
  message?: string;
}


export function usePromoCode(financingMode: 'cash' | 'subscription' = 'cash') {
  const [promoCodes, setPromoCodes] = useState<string[]>([]);
  const [validPromoCodes, setValidPromoCodes] = useState<PromoCode[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [freeMonths, setFreeMonths] = useState<number>(0);
  const [freeDeposit, setFreeDeposit] = useState<boolean>(false);
  const [freeBatterySetup, setFreeBatterySetup] = useState<boolean>(false);
  const [freeSmartBatterySetup, setFreeSmartBatterySetup] = useState<boolean>(false);

  // Initialize local promo codes in localStorage if not present
  useEffect(() => {
    const localPromoCodes = localStorage.getItem('local_promo_codes');
    if (!localPromoCodes) {
      localStorage.setItem('local_promo_codes', JSON.stringify(LOCAL_PROMO_CODES));
    }
  }, []);

  // Reset promo codes when financing mode changes
  useEffect(() => {
    clearPromoCodes();
  }, [financingMode]);

  // Load saved promo codes from localStorage
  useEffect(() => {
    const savedPromoCodes = localStorage.getItem('applied_promo_codes');
    const savedDiscount = localStorage.getItem('promo_discount');
    const savedFreeMonths = localStorage.getItem('promo_free_months');
    const savedFreeDeposit = localStorage.getItem('promo_free_deposit');
    const savedFreeBatterySetup = localStorage.getItem('promo_free_battery_setup');
    const savedFreeSmartBatterySetup = localStorage.getItem('promo_free_smart_battery_setup');
    
    if (savedPromoCodes) {
      try {
        const codes = JSON.parse(savedPromoCodes);
        setPromoCodes(codes);
        
        // Fetch details for each code
        codes.forEach((code) => {
          fetchPromoCode(code);
        });
      } catch (e) {
        console.error('Error parsing saved promo codes:', e);
      }
    }
    
    if (savedDiscount) {
      setDiscount(Number(savedDiscount));
    }
    
    if (savedFreeMonths) {
      setFreeMonths(Number(savedFreeMonths));
    }
    
    if (savedFreeDeposit) {
      setFreeDeposit(savedFreeDeposit === 'true');
    }
    
    if (savedFreeBatterySetup) {
      setFreeBatterySetup(savedFreeBatterySetup === 'true');
    }
    
    if (savedFreeSmartBatterySetup) {
      setFreeSmartBatterySetup(savedFreeSmartBatterySetup === 'true');
    }
  }, []);

  // Fetch promo code from predefined lists
  const fetchPromoCode = async (code: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if it's one of our predefined subscription codes
      const subscriptionCode = SUBSCRIPTION_PROMO_CODES.find(
        c => c.code.toUpperCase() === code.toUpperCase() && c.active
      );
      
      if (subscriptionCode) {
        // For BATTERYFREE, it works in both modes
        if (subscriptionCode.code === 'BATTERYFREE') {
          updateValidPromoCodes(subscriptionCode);
          return;
        }
        
        // For SMARTFREE, it only works in cash mode
        if (subscriptionCode.code === 'SMARTFREE') {
          if (financingMode === 'cash') {
            updateValidPromoCodes(subscriptionCode);
            return;
          } else {
            setError('Ce code promo est uniquement valable pour les paiements comptant');
            setLoading(false);
            return;
          }
        }
        
        // For ECOJOKOFREE, it works in both modes
        if (subscriptionCode.code === 'ECOJOKOFREE') {
          updateValidPromoCodes(subscriptionCode);
          return;
        }
        
        // For other subscription codes, they only work in subscription mode
        if (financingMode === 'subscription') {
          updateValidPromoCodes(subscriptionCode);
          return;
        } else {
          // In cash mode, subscription codes don't work (except BATTERYFREE and SMARTFREE)
          setError('Ce code promo est uniquement valable pour les abonnements');
          setLoading(false);
          return;
        }
      }
      
      // For cash mode, try to get from local storage
      if (financingMode === 'cash') {
        // Check local storage
        const localPromoCodes = localStorage.getItem('local_promo_codes');
        if (localPromoCodes) {
          const codes = JSON.parse(localPromoCodes);
          const localCode = codes.find((c: PromoCode) => 
            c.code.toUpperCase() === code.toUpperCase() && c.active
          );
          
          if (localCode) {
            // Check if the promo code is expired
            if (localCode.expiration_date && new Date(localCode.expiration_date) < new Date()) {
              setError('Ce code promo a expiré');
              setLoading(false);
              return;
            }
            
            updateValidPromoCodes(localCode);
            return;
          }
        }
        
        setError('Code promo invalide');
        setLoading(false);
        return;
      } else {
        // In subscription mode, only subscription codes work
        setError('Code promo invalide pour l\'abonnement');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error fetching promo code:', err);
      setError('Erreur lors de la vérification du code promo');
      setLoading(false);
    }
  };

  // Update valid promo codes and effects
  const updateValidPromoCodes = (newCode: PromoCode) => {
    setValidPromoCodes(prev => {
      // Check if this code is already applied
      const exists = prev.some(code => code.code === newCode.code);
      if (exists) return prev;
      
      // Check if we already have 2 codes applied
      if (prev.length >= 2) {
        setError('Vous ne pouvez appliquer que 2 codes promo maximum');
        setLoading(false);
        return prev;
      }
      
      // Check if we're trying to add a free months code when we already have one
      if (newCode.subscription_effect === 'free_months' && 
          prev.some(code => code.subscription_effect === 'free_months')) {
        setError('Vous ne pouvez appliquer qu\'un seul code de mois gratuits');
        setLoading(false);
        return prev;
      }
      
      // Add the new code
      const updated = [...prev, newCode];
      
      // Calculate total discount
      const totalDiscount = updated.reduce((sum, code) => {
        // Ne pas compter les codes qui offrent des services (SMARTFREE, BATTERYFREE)
        if (code.subscription_effect === 'free_smart_battery_setup' || 
            code.subscription_effect === 'free_battery_setup') {
          return sum;
        }
        return sum + (code.discount || 0);
      }, 0);
      
      setDiscount(totalDiscount);
      localStorage.setItem('promo_discount', totalDiscount.toString());
      
      // Calculate free months (take the highest value)
      const maxFreeMonths = Math.max(
        ...updated
          .filter(code => code.subscription_effect === 'free_months')
          .map(code => code.free_months || 0),
        0
      );
      setFreeMonths(maxFreeMonths);
      if (maxFreeMonths > 0) {
        localStorage.setItem('promo_free_months', maxFreeMonths.toString());
      } else {
        localStorage.removeItem('promo_free_months');
      }
      
      // Check for free deposit
      const hasFreeDeposit = updated.some(code => code.subscription_effect === 'free_deposit');
      setFreeDeposit(hasFreeDeposit);
      if (hasFreeDeposit) {
        localStorage.setItem('promo_free_deposit', 'true');
      } else {
        localStorage.removeItem('promo_free_deposit');
      }
      
      // Check for free battery setup
      const hasFreeBatterySetup = updated.some(code => code.subscription_effect === 'free_battery_setup');
      setFreeBatterySetup(hasFreeBatterySetup);
      if (hasFreeBatterySetup) {
        localStorage.setItem('promo_free_battery_setup', 'true');
      } else {
        localStorage.removeItem('promo_free_battery_setup');
      }
      
      // Check for free smart battery setup
      const hasFreeSmartBatterySetup = updated.some(code => code.subscription_effect === 'free_smart_battery_setup');
      setFreeSmartBatterySetup(hasFreeSmartBatterySetup);
      if (hasFreeSmartBatterySetup) {
        localStorage.setItem('promo_free_smart_battery_setup', 'true');
      } else {
        localStorage.removeItem('promo_free_smart_battery_setup');
      }
      
      // Save applied codes to localStorage
      const codeStrings = updated.map(code => code.code);
      setPromoCodes(codeStrings);
      localStorage.setItem('applied_promo_codes', JSON.stringify(codeStrings));
      
      return updated;
    });
    
    setLoading(false);
  };

  // Apply a promo code
  const applyPromoCode = (code: string): ApplyPromoCodeResult => {
    if (!code) {
      return { success: false, message: 'Veuillez saisir un code promo' };
    }
    
    // Check if we already have this code applied
    if (promoCodes.includes(code.toUpperCase())) {
      return { success: true };
    }
    
    // Check if we already have 2 codes applied
    if (validPromoCodes.length >= 2) {
      return { success: false, message: 'Vous ne pouvez appliquer que 2 codes promo maximum' };
    }
    
    // Check if it's the ECOJOKOFREE code which works for both modes
    if (code.toUpperCase() === 'ECOJOKOFREE') {
      return { success: true };
    }
    
    // Check if it's the BATTERYFREE code which works for both modes
    if (code.toUpperCase() === 'BATTERYFREE') {
      const batteryFreeCode = SUBSCRIPTION_PROMO_CODES.find(c => c.code === 'BATTERYFREE');
      if (batteryFreeCode) {
        updateValidPromoCodes(batteryFreeCode);
        return { success: true };
      }
    }
    
    // Check if it's the SMARTFREE code which works only for cash mode
    if (code.toUpperCase() === 'SMARTFREE') {
      const smartFreeCode = SUBSCRIPTION_PROMO_CODES.find(c => c.code === 'SMARTFREE');
      if (smartFreeCode) {
        if (financingMode === 'cash') {
          updateValidPromoCodes(smartFreeCode);
          return { success: true };
        } else {
          return { success: false, message: 'Ce code promo est uniquement valable pour les paiements comptant' };
        }
      }
    }
    
    // Check if it's one of our predefined subscription codes
    const subscriptionCode = SUBSCRIPTION_PROMO_CODES.find(
      c => c.code.toUpperCase() === code.toUpperCase() && c.active
    );
    
    if (subscriptionCode && subscriptionCode.code !== 'BATTERYFREE' && subscriptionCode.code !== 'SMARTFREE' && subscriptionCode.code !== 'ECOJOKOFREE') {
      // Si on est en mode abonnement, on peut appliquer les codes promo d'abonnement
      if (financingMode === 'subscription') {
        // Check if we're trying to add a free months code when we already have one
        if (subscriptionCode.subscription_effect === 'free_months' && 
            validPromoCodes.some(code => code.subscription_effect === 'free_months')) {
          return { success: false, message: 'Vous ne pouvez appliquer qu\'un seul code de mois gratuits' };
        }
        
        updateValidPromoCodes(subscriptionCode);
        return { success: true };
      } else {
        return { success: false, message: 'Ce code promo est uniquement valable pour les abonnements' };
      }
    }
    
    // Si on est en mode abonnement, on ne peut pas appliquer les codes promo standards
    if (financingMode === 'subscription' && code.toUpperCase() !== 'BATTERYFREE' && code.toUpperCase() !== 'ECOJOKOFREE') {
      return { success: false, message: 'Ce code promo n\'est pas valable pour les abonnements' };
    }
    
    // Try to fetch from local storage
    const localPromoCodes = localStorage.getItem('local_promo_codes');
    if (localPromoCodes) {
      try {
        const codes = JSON.parse(localPromoCodes);
        const localCode = codes.find((c: PromoCode) => 
          c.code.toUpperCase() === code.toUpperCase() && c.active
        );
        
        if (localCode) {
          // Check if the promo code is expired
          if (localCode.expiration_date && new Date(localCode.expiration_date) < new Date()) {
            return { success: false, message: 'Ce code promo a expiré' };
          }
          
          updateValidPromoCodes(localCode);
          return { success: true };
        }
      } catch (e) {
        console.error('Error parsing local promo codes:', e);
      }
    }
    
    // If we get here, the code is invalid
    return { success: false, message: 'Code promo invalide' };
  };

  // Clear all promo codes
  const clearPromoCodes = () => {
    setPromoCodes([]);
    setValidPromoCodes([]);
    setDiscount(0);
    setFreeMonths(0);
    setFreeDeposit(false);
    setFreeBatterySetup(false);
    setFreeSmartBatterySetup(false);
    localStorage.removeItem('applied_promo_codes');
    localStorage.removeItem('promo_discount');
    localStorage.removeItem('promo_free_months');
    localStorage.removeItem('promo_free_deposit');
    localStorage.removeItem('promo_free_battery_setup');
    localStorage.removeItem('promo_free_smart_battery_setup');
  };

  return {
    promoCodes,
    validPromoCodes,
    validPromoCode: validPromoCodes.length > 0 ? validPromoCodes[0] : null, // For backward compatibility
    discount,
    freeMonths,
    freeDeposit,
    freeBatterySetup,
    freeSmartBatterySetup,
    loading,
    error,
    applyPromoCode,
    clearPromoCodes
  };
}