export const DEFAULT_PARAMS = {
  nombreModules: 6, // 6 modules de 500W = 3kWc
  surfaceUnitaire: 2.3,
  inclinaison: 30,
  orientation: 0,
  puissanceModules: 500,
  pertes: 14,
  masqueSolaire: 0,
  typeCompteur: 'monophase',
  consommationAnnuelle: 10000,
  microOnduleurs: false,
  bifacial: false,
  adresse: {
    rue: '',
    codePostal: '',
    ville: '',
    pays: 'France'
  }
};

export const COMPTEUR_OPTIONS = [
  { value: 'monophase', label: 'Monophasé (limité à 6 kWc)' },
  { value: 'triphase', label: 'Triphasé' }
] as const;