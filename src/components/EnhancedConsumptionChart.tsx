import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface ConsumptionData {
  date: string;
  peakHours: number;
  offPeakHours: number;
  peak_hours?: number;
  off_peak_hours?: number;
}

interface EnhancedConsumptionChartProps {
  data: ConsumptionData[];
}

const EnhancedConsumptionChart: React.FC<EnhancedConsumptionChartProps> = ({ data }) => {
  // Normaliser les données pour gérer les deux formats possibles (peakHours/peak_hours)
  const normalizedData = data.map(item => ({
    date: new Date(item.date),
    peakHours: item.peakHours || item.peak_hours || 0,
    offPeakHours: item.offPeakHours || item.off_peak_hours || 0,
    total: (item.peakHours || item.peak_hours || 0) + (item.offPeakHours || item.off_peak_hours || 0)
  }));

  // Trier les données par date
  normalizedData.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Préparer les données pour le graphique quotidien
  const dailyChartData = normalizedData.map(item => ({
    date: item.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    total: item.total
  }));

  return (
    <div className="space-y-8">
      {/* Graphique de consommation quotidienne */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommation quotidienne</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyChartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Consommation']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                name="Consommation totale" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EnhancedConsumptionChart;