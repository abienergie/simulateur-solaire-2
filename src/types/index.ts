export interface Address {
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
  region?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface SolarParameters {
  nombreModules: number;
  surfaceUnitaire: number;
  inclinaison: number;
  orientation: number;
  puissanceModules: number;
  pertes: number;
  masqueSolaire: number;
  typeCompteur: string;
  consommationAnnuelle: number;
  microOnduleurs: boolean;
  bifacial: boolean;
  adresse: Address;
}

export interface ProductionResult {
  productionAnnuelle: number;
  puissanceCrete: number;
  surfaceTotale: number;
  typeCompteur: string; // Ajout du type de compteur
}