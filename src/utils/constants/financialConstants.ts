export const DEFAULT_FINANCIAL_SETTINGS = {
  baseKwhPrice: 0.26,
  surplusSellPrices: {
    under9kw: 0.04,
    from9to36kw: 0.11,
    from36to100kw: 0.09
  },
  totalSellPrices: {
    under9kw: 0.20,
    from9to36kw: 0.17,
    from36to100kw: 0.14
  },
  sellPriceDate: '2025-02-01',
  defaultAutoconsumption: 75,
  defaultEnergyRevaluation: 7,
  defaultSellIndexation: 2,
  defaultPanelDegradation: -0.2
};