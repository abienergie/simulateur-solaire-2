import { SubsidyRanges, Subsidy } from '../../types/subsidies';
import { FinancialSettings } from '../../types/financial';

// Prix des abonnements mensuels en fonction de la puissance et de la durée
const SUBSCRIPTION_TABLE: {
  [key: string]: { [key: number]: number };
} = {
  '25': {
    2.5: 49.00,
    3.0: 59.00, 3.5: 68.50, 4.0: 78.00, 4.5: 87.00,
    5.0: 96.00, 5.5: 105.50, 6.0: 115.00, 6.5: 124.00,
    7.0: 132.00, 7.5: 140.00, 8.0: 149.00, 8.5: 158.00, 9.0: 167.00
  },
  '20': {
    2.5: 51.60,
    3.0: 63.60, 3.5: 72.00, 4.0: 82.80, 4.5: 92.00,
    5.0: 100.80, 5.5: 111.60, 6.0: 120.00, 6.5: 129.60,
    7.0: 138.00, 7.5: 146.40, 8.0: 156.00, 8.5: 164.40, 9.0: 174.00
  },
  '15': {
    2.5: 56.40,
    3.0: 73.20, 3.5: 80.40, 4.0: 91.20, 4.5: 102.00,
    5.0: 111.60, 5.5: 122.40, 6.0: 130.80, 6.5: 142.80,
    7.0: 150.00, 7.5: 159.60, 8.0: 169.20, 8.5: 177.60, 9.0: 189.60
  },
  '10': {
    2.5: 67.20,
    3.0: 86.40, 3.5: 97.20, 4.0: 106.80, 4.5: 120.00,
    5.0: 134.40, 5.5: 144.00, 6.0: 153.60, 6.5: 165.60,
    7.0: 174.00, 7.5: 178.80, 8.0: 192.00, 8.5: 200.40, 9.0: 206.40
  }
};

// Prix par défaut des installations en fonction de la puissance
const DEFAULT_PRICES: { [key: number]: number } = {
  2.5: 6890,
  3.0: 7890,
  3.5: 8890,
  4.0: 9890,
  4.5: 10890,
  5.0: 11890,
  5.5: 12890,
  6.0: 14890,
  6.5: 15890,
  7.0: 16890,
  7.5: 17890,
  8.0: 18890,
  8.5: 19890,
  9.0: 19890
};

// Function to get custom prices from localStorage with improved error handling
function getCustomPrices(): Array<{ power: number; price: number }> {
  try {
    const savedPrices = localStorage.getItem('installation_prices');
    if (!savedPrices) {
      console.log('No custom prices found in localStorage');
      return [];
    }

    let prices;
    try {
      prices = JSON.parse(savedPrices);
    } catch (parseError) {
      console.error('Invalid JSON in localStorage:', parseError);
      localStorage.removeItem('installation_prices'); // Clear invalid data
      return [];
    }

    if (!Array.isArray(prices)) {
      console.warn('Custom prices must be an array');
      return [];
    }

    // Validate and filter prices
    const validPrices = prices.filter(p => 
      typeof p === 'object' &&
      p !== null &&
      typeof p.power === 'number' && 
      typeof p.price === 'number' &&
      p.power > 0 && 
      p.price > 0
    );

    // Sort by power for consistency
    validPrices.sort((a, b) => a.power - b.power);

    console.log('Loaded custom prices:', validPrices);
    return validPrices;
  } catch (error) {
    console.error('Error loading custom prices:', error);
    return [];
  }
}

// Function to save custom price with validation
export function saveCustomPrice(power: number, price: number): void {
  try {
    const currentPrices = getCustomPrices();
    const priceIndex = currentPrices.findIndex(p => Math.abs(p.power - power) < 0.01);
    
    if (priceIndex >= 0) {
      currentPrices[priceIndex].price = price;
    } else {
      currentPrices.push({ power, price });
    }
    
    currentPrices.sort((a, b) => a.power - b.power);
    localStorage.setItem('installation_prices', JSON.stringify(currentPrices));
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('customPricesUpdated', {
      detail: currentPrices
    }));
    
    console.log('Saved custom price:', { power, price });
  } catch (error) {
    console.error('Error saving custom price:', error);
    throw error;
  }
}

export function calculateSubsidy(power: number, settings: any): number {
  if (!settings?.subsidies?.length) {
    console.log('No subsidies found in settings');
    return 0;
  }
  
  console.log('Calculating subsidy for power:', power, 'kWc');
  
  const applicableSubsidy = settings.subsidies.find((subsidy: any) => {
    const min = subsidy.min;
    const max = subsidy.max;

    if (typeof min !== 'number' || typeof max !== 'number') {
      console.log('Subsidy ignored due to invalid min/max:', {min, max});
      return false;
    }

    const isApplicable = power >= min && power <= max;
    console.log(`Checking range ${min}-${max}kWc:`, isApplicable ? 'applicable' : 'not applicable');
    return isApplicable;
  });

  if (!applicableSubsidy) {
    console.log('No applicable subsidy found for this power');
    return 0;
  }

  console.log('Found applicable subsidy:', applicableSubsidy);
  
  const amount = Math.round(applicableSubsidy.amount * power);
  console.log('Calculated subsidy amount:', amount, '€');
  
  return amount;
}

export function getPriceFromPower(power: number): number {
  // Round power to nearest 0.5
  const roundedPower = Math.round(power * 2) / 2;
  console.log(`Getting price for ${roundedPower} kWc`);

  // Get custom prices with validation
  const customPrices = getCustomPrices();
  
  // First try exact match in custom prices
  const exactMatch = customPrices.find(p => Math.abs(p.power - roundedPower) < 0.01);
  if (exactMatch) {
    console.log(`Found exact custom price match: ${exactMatch.price}€ for ${exactMatch.power} kWc`);
    return exactMatch.price;
  }

  // For standard kits (≤ 9 kWc), use default price
  if (roundedPower <= 9) {
    const defaultPrice = DEFAULT_PRICES[roundedPower];
    if (!defaultPrice) {
      console.warn(`No default price found for ${roundedPower} kWc`);
      return 0;
    }
    console.log(`Using default price for ${roundedPower} kWc: ${defaultPrice}€`);
    return defaultPrice;
  }

  // For pro kits (> 9 kWc), find closest custom price
  const proPrices = customPrices.filter(p => p.power > 9);
  if (proPrices.length > 0) {
    const closest = proPrices.reduce((prev, curr) => 
      Math.abs(curr.power - roundedPower) < Math.abs(prev.power - roundedPower) ? curr : prev
    );
    console.log(`Using closest pro price: ${closest.price}€ for ${closest.power} kWc`);
    return closest.price;
  }

  console.log(`No price found for ${roundedPower} kWc`);
  return 0;
}

export function getSubscriptionPrice(power: number, duration: number): number {
  const roundedPower = Math.round(power * 2) / 2;
  return SUBSCRIPTION_TABLE[duration.toString()]?.[roundedPower] || 0;
}

// Calculer le surcoût Enphase selon les nouvelles règles
export function calculateEnphaseCost(powerInKw: number): number {
  if (powerInKw <= 3) {
    return 1500;
  } else if (powerInKw <= 6) {
    return 1800;
  } else {
    return 2200;
  }
}

export function calculateFinalPrice(
  power: number,
  primeAutoconsommation: number,
  remiseCommerciale: number,
  microOnduleurs: boolean = false
): number {
  const basePrice = getPriceFromPower(power);
  if (basePrice === 0) {
    console.error(`Could not find price for power ${power} kWc`);
    return 0;
  }
  
  const enphaseAdditionalCost = microOnduleurs ? calculateEnphaseCost(power) : 0;
  
  return basePrice + enphaseAdditionalCost - primeAutoconsommation - remiseCommerciale;
}