interface ConsumptionData {
  date: string;
  peakHours: number;
  offPeakHours: number;
}

export function generateMockData(startDate: string, endDate: string): ConsumptionData[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data: ConsumptionData[] = [];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Génère des valeurs aléatoires réalistes
    const baseConsumption = 15 + Math.random() * 10; // Entre 15 et 25 kWh par jour
    const peakRatio = 0.7; // 70% en heures pleines
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      peakHours: Math.round(baseConsumption * peakRatio * 100) / 100,
      offPeakHours: Math.round(baseConsumption * (1 - peakRatio) * 100) / 100
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}