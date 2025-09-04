export interface FinancialSettings {
  baseKwhPrice: number;
  surplusSellPrices: {
    under9kw: number;
    from9to36kw: number;
    from36to100kw: number;
  };
  totalSellPrices: {
    under9kw: number;
    from9to36kw: number;
    from36to100kw: number;
  };
  sellPriceDate: string;
  defaultAutoconsumption: number;
  defaultEnergyRevaluation: number;
  defaultSellIndexation: number;
  defaultPanelDegradation: number;
  installationPrices: InstallationPrice[];
  defaultSubsidyUnder3kw: number;
  defaultSubsidyOver3kw: number;
  defaultSubsidy9to36kw: number;
  defaultSubsidy36to100kw: number;
  subsidyDate: string;
}

export interface InstallationPrice {
  power: number;
  price: number;
}

export interface FinancialParametersType {
  financingMode: 'cash' | 'subscription';
  prixKwh: number;
  tarifRevente: number;
  autoconsommation: number;
  revalorisationEnergie: number;
  indexationProduction: number;
  degradationPanneau: number;
  dureeAbonnement?: number;
  primeAutoconsommation: number;
  remiseCommerciale: number;
  batterySelection?: BatterySelection;
  connectionType?: string;
}

export interface YearlyProjection {
  annee: number;
  production: number;
  autoconsommation: number;
  revente: number;
  economiesAutoconsommation: number;
  revenusRevente: number;
  coutAbonnement: number;
  coutMyLight: number;
  gainTotal: number;
}

export interface FinancialProjection {
  projectionAnnuelle: YearlyProjection[];
  totalAutoconsommation: number;
  totalRevente: number;
  totalAbonnement: number;
  totalMyLight: number;
  totalGains: number;
  moyenneAnnuelle: {
    autoconsommation: number;
    revente: number;
    abonnement: number;
    myLight: number;
    total: number;
  };
  anneeRentabilite: number;
  prixInstallation: number;
  primeAutoconsommation: number;
  remiseCommerciale: number;
  prixFinal: number;
}