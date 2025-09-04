// Predefined subscription promo codes
export const SUBSCRIPTION_PROMO_CODES = [
  {
    id: 'cautionfree',
    code: 'CAUTIONFREE',
    discount: 0,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString(),
    type: 'subscription_only',
    subscription_effect: 'free_deposit'
  },
  {
    id: 'abo3mois',
    code: 'ABO3MOIS',
    discount: 0,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString(),
    type: 'subscription_only',
    subscription_effect: 'free_months',
    free_months: 3
  },
  {
    id: 'abo2mois',
    code: 'ABO2MOIS',
    discount: 0,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString(),
    type: 'subscription_only',
    subscription_effect: 'free_months',
    free_months: 2
  },
  {
    id: 'abo1mois',
    code: 'ABO1MOIS',
    discount: 0,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString(),
    type: 'subscription_only',
    subscription_effect: 'free_months',
    free_months: 1
  },
  {
    id: 'batteryfree',
    code: 'BATTERYFREE',
    discount: 179,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString(),
    subscription_effect: 'free_battery_setup'
  },
  {
    id: 'smartfree',
    code: 'SMARTFREE',
    discount: 2000,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString(),
    subscription_effect: 'free_smart_battery_setup'
  },
  {
    id: 'ecojokofree',
    code: 'ECOJOKOFREE',
    discount: 229,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString()
  }
];

// Sample local promo codes
export const LOCAL_PROMO_CODES = [
  {
    id: 'soleil2025',
    code: 'SOLEIL2025',
    discount: 500,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'bienvenue',
    code: 'BIENVENUE',
    discount: 300,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'printemps',
    code: 'PRINTEMPS',
    discount: 250,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'ecojokofree',
    code: 'ECOJOKOFREE',
    discount: 229,
    active: true,
    expiration_date: null,
    created_at: new Date().toISOString()
  }
];