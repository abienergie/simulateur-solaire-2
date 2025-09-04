export const POWER_LIMITS = {
  monophase: 6,
  triphase: 9 // Limite à 9 kWc pour le triphasé
} as const;

export function getPowerLimit(typeCompteur: string): number {
  return typeCompteur === 'monophase' ? POWER_LIMITS.monophase : POWER_LIMITS.triphase;
}