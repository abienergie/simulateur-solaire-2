export interface Address {
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
}

export interface SolarParameters {
  nombreModules: number;
  surfaceUnitaire: number;
  inclinaison: number;
  orientation: number;
  puissanceModules: number;
  pertes: number;
  adresse: Address;
}

export interface ProductionResult {
  productionAnnuelle: number;
  puissanceCrete: number;
  surfaceTotale: number;
}