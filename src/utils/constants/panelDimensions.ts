// Ratio surface/puissance pour les panneaux photovoltaïques
export const SURFACE_PAR_WATT = 0.0047; // m² par Watt

// Fonction utilitaire pour obtenir la surface d'un panneau
export function getPanelSurface(power: number): number {
  return power * SURFACE_PAR_WATT;
}