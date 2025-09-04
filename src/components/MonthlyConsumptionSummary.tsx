import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface ConsumptionData {
  date: string;
  peakHours: number;
  offPeakHours: number;
  peak_hours?: number;
  off_peak_hours?: number;
}

interface MonthlyConsumptionSummaryProps {
  data: ConsumptionData[];
  title?: string;
}

const COLORS = ['#4F46E5', '#14B8A6', '#F59E0B', '#EC4899'];
const PRICE_PEAK = 0.2062; // €/kWh
const PRICE_OFFPEAK = 0.1547; // €/kWh

const MonthlyConsumptionSummary: React.FC<MonthlyConsumptionSummaryProps> = ({ data, title = "Résumé mensuel de consommation" }) => {
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
        cost: 0,
        label: item.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      };
    }
    
    acc[monthKey].peakHours += item.peakHours;
    acc[monthKey].offPeakHours += item.offPeakHours;
    acc[monthKey].total += item.total;
    acc[monthKey].cost += (item.peakHours * PRICE_PEAK) + (item.offPeakHours * PRICE_OFFPEAK);
    
    return acc;
  }, {} as Record<string, any>);

  const monthlyChartData = Object.values(monthlyData);

  // Calculer les totaux pour l'affichage des statistiques
  const totalPeakHours = normalizedData.reduce((sum, item) => sum + item.peakHours, 0);
  const totalOffPeakHours = normalizedData.reduce((sum, item) => sum + item.offPeakHours, 0);
  const totalConsumption = totalPeakHours + totalOffPeakHours;
  const totalCost = (totalPeakHours * PRICE_PEAK) + (totalOffPeakHours * PRICE_OFFPEAK);
  
  // Données pour le graphique en camembert
  const pieData = [
    { name: 'Heures pleines', value: totalPeakHours, cost: totalPeakHours * PRICE_PEAK },
    { name: 'Heures creuses', value: totalOffPeakHours, cost: totalOffPeakHours * PRICE_OFFPEAK }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        {/* Statistiques résumées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Consommation totale</p>
            <p className="text-2xl font-bold text-blue-700">{Math.round(totalConsumption)} kWh</p>
            <p className="text-xs text-blue-500 mt-1">Période: {normalizedData.length} jours</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Coût total estimé</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-green-500 mt-1">{formatCurrency(totalCost / normalizedData.length)}/jour</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Heures pleines</p>
            <p className="text-2xl font-bold text-purple-700">{Math.round(totalPeakHours)} kWh</p>
            <p className="text-xs text-purple-500 mt-1">{formatCurrency(totalPeakHours * PRICE_PEAK)}</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">Heures creuses</p>
            <p className="text-2xl font-bold text-amber-700">{Math.round(totalOffPeakHours)} kWh</p>
            <p className="text-xs text-amber-500 mt-1">{formatCurrency(totalOffPeakHours * PRICE_OFFPEAK)}</p>
          </div>
        </div>
        
        {/* Graphique en barres par mois */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barSize={40}
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
                yAxisId="left"
                orientation="left"
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: '€', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "cost") return [formatCurrency(value), "Coût"];
                  return [`${value.toFixed(2)} kWh`, name === "peakHours" ? "Heures pleines" : "Heures creuses"];
                }}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="peakHours" 
                name="Heures pleines" 
                stackId="a" 
                fill="#4F46E5" 
              />
              <Bar 
                yAxisId="left"
                dataKey="offPeakHours" 
                name="Heures creuses" 
                stackId="a" 
                fill="#14B8A6" 
              />
              <Bar 
                yAxisId="right"
                dataKey="cost" 
                name="Coût" 
                fill="#F59E0B" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Graphique en camembert */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition de la consommation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    const entry = props.payload;
                    return [`${value.toFixed(2)} kWh (${formatCurrency(entry.cost)})`, name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Économie potentielle</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency((totalPeakHours * PRICE_PEAK) - (totalPeakHours * PRICE_OFFPEAK))}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  En déplaçant la consommation des heures pleines vers les heures creuses
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Prix moyen du kWh</p>
                <p className="text-2xl font-bold text-green-700">
                  {(totalCost / totalConsumption).toFixed(4)} €
                </p>
                <p className="text-xs text-green-500 mt-1">
                  HP: {PRICE_PEAK.toFixed(4)} € | HC: {PRICE_OFFPEAK.toFixed(4)} €
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Différence de prix HP/HC</p>
                <p className="text-2xl font-bold text-purple-700">
                  {((PRICE_PEAK - PRICE_OFFPEAK) / PRICE_PEAK * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  Soit {((PRICE_PEAK - PRICE_OFFPEAK) * 100).toFixed(2)} centimes/kWh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyConsumptionSummary;