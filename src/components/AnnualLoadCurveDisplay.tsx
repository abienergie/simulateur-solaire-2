import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, ComposedChart, Bar
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number;
  is_off_peak: boolean;
}

interface AnnualLoadCurveDisplayProps {
  data: LoadCurvePoint[];
  title?: string;
}

const PRICE_PEAK = 0.2062; // €/kWh
const PRICE_OFFPEAK = 0.1547; // €/kWh

const AnnualLoadCurveDisplay: React.FC<AnnualLoadCurveDisplayProps> = ({ data, title = "Analyse annuelle de la courbe de charge" }) => {
  // Extraire les mois uniques
  const monthlyData = data.reduce((acc, point) => {
    const date = new Date(point.date_time);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        totalConsumption: 0,
        peakConsumption: 0,
        offPeakConsumption: 0,
        maxPower: 0,
        points: 0
      };
    }
    
    acc[monthKey].points += 1;
    acc[monthKey].totalConsumption += point.value;
    
    if (point.is_off_peak) {
      acc[monthKey].offPeakConsumption += point.value;
    } else {
      acc[monthKey].peakConsumption += point.value;
    }
    
    acc[monthKey].maxPower = Math.max(acc[monthKey].maxPower, point.value);
    
    return acc;
  }, {} as Record<string, any>);

  // Convertir en tableau et trier par mois
  const monthlyChartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(month => ({
      ...month,
      avgPower: month.totalConsumption / month.points,
      peakCost: month.peakConsumption * PRICE_PEAK,
      offPeakCost: month.offPeakConsumption * PRICE_OFFPEAK,
      totalCost: (month.peakConsumption * PRICE_PEAK) + (month.offPeakConsumption * PRICE_OFFPEAK)
    }));

  // Extraire les heures de la journée
  const hourlyData = data.reduce((acc, point) => {
    const date = new Date(point.date_time);
    const hour = date.getHours();
    
    if (!acc[hour]) {
      acc[hour] = {
        hour,
        timeLabel: `${String(hour).padStart(2, '0')}:00`,
        totalConsumption: 0,
        peakConsumption: 0,
        offPeakConsumption: 0,
        points: 0,
        isOffPeak: point.is_off_peak
      };
    }
    
    acc[hour].points += 1;
    acc[hour].totalConsumption += point.value;
    
    if (point.is_off_peak) {
      acc[hour].offPeakConsumption += point.value;
    } else {
      acc[hour].peakConsumption += point.value;
    }
    
    return acc;
  }, {} as Record<number, any>);

  // Convertir en tableau et trier par heure
  const hourlyChartData = Object.values(hourlyData)
    .sort((a, b) => a.hour - b.hour)
    .map(hour => ({
      ...hour,
      avgPower: hour.totalConsumption / hour.points
    }));

  // Calculer les totaux pour l'affichage des statistiques
  const totalConsumption = data.reduce((sum, point) => sum + point.value, 0);
  const totalOffPeakConsumption = data.filter(p => p.is_off_peak).reduce((sum, point) => sum + point.value, 0);
  const totalPeakConsumption = data.filter(p => !p.is_off_peak).reduce((sum, point) => sum + point.value, 0);
  const maxPower = Math.max(...data.map(point => point.value));
  const avgPower = totalConsumption / data.length;
  const totalCost = (totalPeakConsumption * PRICE_PEAK) + (totalOffPeakConsumption * PRICE_OFFPEAK);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        {/* Statistiques résumées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Consommation totale</p>
            <p className="text-2xl font-bold text-blue-700">{totalConsumption.toFixed(0)} kWh</p>
            <p className="text-xs text-blue-500 mt-1">
              HP: {totalPeakConsumption.toFixed(0)} kWh | HC: {totalOffPeakConsumption.toFixed(0)} kWh
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Puissance maximale</p>
            <p className="text-2xl font-bold text-green-700">{maxPower.toFixed(2)} kW</p>
            <p className="text-xs text-green-500 mt-1">Moyenne: {avgPower.toFixed(2)} kW</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Coût estimé</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-purple-500 mt-1">
              HP: {formatCurrency(totalPeakConsumption * PRICE_PEAK)} | 
              HC: {formatCurrency(totalOffPeakConsumption * PRICE_OFFPEAK)}
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">Répartition HP/HC</p>
            <p className="text-2xl font-bold text-amber-700">
              {Math.round((totalPeakConsumption / totalConsumption) * 100)}% / {Math.round((totalOffPeakConsumption / totalConsumption) * 100)}%
            </p>
            <p className="text-xs text-amber-500 mt-1">Heures pleines / Heures creuses</p>
          </div>
        </div>
        
        {/* Graphique de consommation mensuelle */}
        <h4 className="text-md font-medium text-gray-800 mb-3">Évolution mensuelle de la consommation</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
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
                  if (name === "totalCost") return [formatCurrency(value), "Coût total"];
                  if (name === "maxPower") return [`${value.toFixed(2)} kW`, "Puissance max"];
                  return [`${value.toFixed(0)} kWh`, name === "peakConsumption" ? "Heures pleines" : "Heures creuses"];
                }}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="peakConsumption" 
                name="Heures pleines" 
                stackId="a" 
                fill="#4F46E5" 
              />
              <Bar 
                yAxisId="left"
                dataKey="offPeakConsumption" 
                name="Heures creuses" 
                stackId="a" 
                fill="#14B8A6" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="totalCost" 
                name="Coût total" 
                stroke="#F59E0B" 
                strokeWidth={2}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="maxPower" 
                name="Puissance max" 
                stroke="#EC4899" 
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Graphique de consommation par heure */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profil de consommation horaire</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hourlyChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeLabel" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  return [`${value.toFixed(2)} kW`, name === "avgPower" ? "Puissance moyenne" : name];
                }}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="avgPower" 
                name="Puissance moyenne" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Heures de pointe</p>
            <p className="text-xs text-blue-700 mt-1">
              Les heures de plus forte consommation sont généralement entre 18h et 21h.
              Essayez de réduire votre consommation pendant ces heures pour diminuer votre impact
              sur le réseau électrique et potentiellement réduire votre facture.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Heures creuses</p>
            <p className="text-xs text-green-700 mt-1">
              Les heures creuses (généralement la nuit) offrent des tarifs plus avantageux.
              Programmez vos appareils énergivores (lave-linge, lave-vaisselle, chauffe-eau)
              pour qu'ils fonctionnent pendant ces heures pour maximiser vos économies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualLoadCurveDisplay;