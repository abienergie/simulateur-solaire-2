export const BEHAVIOR_FACTORS = {
  // Facteur d'amélioration dû au déplacement des charges
  LOAD_SHIFTING: 1.05, // +5% d'autoconsommation grâce aux changements d'habitudes
  
  // Périodes de consommation typiques
  PEAK_HOURS: {
    SUMMER: { start: 11, end: 16 }, // Heures de production maximale en été
    WINTER: { start: 12, end: 15 }  // Heures de production maximale en hiver
  },
  
  // Appareils typiquement déplaçables
  SHIFTABLE_LOADS: {
    WASHING_MACHINE: { power: 2000, duration: 2 },    // 2kW pendant 2h
    DISHWASHER: { power: 1500, duration: 1.5 },      // 1.5kW pendant 1.5h
    DRYER: { power: 2500, duration: 1 },             // 2.5kW pendant 1h
    WATER_HEATER: { power: 2000, duration: 2 },      // 2kW pendant 2h
    POOL_PUMP: { power: 800, duration: 6 }           // 800W pendant 6h
  }
} as const;