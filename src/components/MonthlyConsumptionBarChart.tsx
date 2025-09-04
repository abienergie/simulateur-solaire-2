import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';

interface ConsumptionData {
  date: string;
  peakHours: number;
  offPeakHours: number;
  peak_hours?: number;
  off_peak_hours?: number;
}

interface MonthlyConsumptionBarChartProps {
  data: ConsumptionData[];
  title?: string;
}

const MonthlyConsumptionBarChart: React.FC<MonthlyConsumptionBarChartProps> = ({ data, title = "Évolution mensuelle de la consommation" }) => {
  // Normaliser les données pour gérer les deux formats possibles (peakHours/peak_hours)
  const normalizedData = data.map(item => ({
    date: new Date(item.date),
    peakHours: item.peakHours || item.peak_hours || 0,
    offPeakHours: item.offPeakHours || item.off_peak_hours || 0,
    total: (item.peakHours || item.peak_hours || 0) + (item.offPeakHours || item.off_peak_hours || 0)
  }));

  // Grouper par mois
  const monthlyData = normalizedData.reduce((acc, item) => {
    const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        peakHours: 0,
        offPeakHours: 0,
        total: 0,
        days: 0,
        label: item.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      };
    }
    
    acc[monthKey].peakHours += item.peakHours;
    acc[monthKey].offPeakHours += item.offPeakHours;
    acc[monthKey].total += item.total;
    acc[monthKey].days += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const monthlyChartData = Object.values(monthlyData);

  // Trier par mois
  monthlyChartData.sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Période analysée</p>
          <p className="text-2xl font-bold text-blue-700">{monthlyChartData.length} mois</p>
          <p className="text-xs text-blue-500 mt-1">
            {monthlyChartData.length > 0 ? 
              `${monthlyChartData[0].label} à ${monthlyChartData[monthlyChartData.length - 1].label}` : 
              'Aucune donnée'}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Consommation moyenne</p>
          <p className="text-2xl font-bold text-green-700">
            {monthlyChartData.length > 0 ? 
              (monthlyChartData.reduce((sum, month) => sum + month.total, 0) / monthlyChartData.length).toFixed(0) : 
              '0'} kWh/mois
          </p>
          <p className="text-xs text-green-500 mt-1">
            {monthlyChartData.length > 0 ? 
              (monthlyChartData.reduce((sum, month) => sum + month.total / month.days, 0) / monthlyChartData.length).toFixed(1) : 
              '0'} kWh/jour
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Répartition HP/HC</p>
          <p className="text-2xl font-bold text-purple-700">
            {monthlyChartData.length > 0 ? 
              `${Math.round(monthlyChartData.reduce((sum, month) => sum + month.peakHours, 0) / 
                monthlyChartData.reduce((sum, month) => sum + month.total, 0) * 100)}% / ${
                Math.round(monthlyChartData.reduce((sum, month) => sum + month.offPeakHours, 0) / 
                monthlyChartData.reduce((sum, month) => sum + month.total, 0) * 100)}%` : 
              '0% / 0%'}
          </p>
          <p className="text-xs text-purple-500 mt-1">
            Heures pleines / Heures creuses
          </p>
        </div>
      </div>
      
      {/* Graphique en barres par mois */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                return [`${value.toFixed(0)} kWh`, name === "peakHours" ? "Heures pleines" : "Heures creuses"];
              }}
              labelFormatter={(label) => `Mois: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="peakHours" 
              name="Heures pleines" 
              stackId="a" 
              fill="#4F46E5" 
            />
            <Bar 
              dataKey="offPeakHours" 
              name="Heures creuses" 
              stackId="a" 
              fill="#14B8A6" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyConsumptionBarChart;