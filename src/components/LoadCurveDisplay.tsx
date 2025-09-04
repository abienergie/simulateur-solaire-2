import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, Brush, ReferenceLine
} from 'recharts';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number;
  is_off_peak: boolean;
}

interface LoadCurveDisplayProps {
  data: LoadCurvePoint[];
  title?: string;
}

const LoadCurveDisplay: React.FC<LoadCurveDisplayProps> = ({ data, title = "Courbe de charge" }) => {
  // Grouper les données par jour
  const groupedByDay = data.reduce((acc, point) => {
    const date = point.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(point);
    return acc;
  }, {} as Record<string, LoadCurvePoint[]>);

  // Calculer les statistiques par jour
  const dailyStats = Object.entries(groupedByDay).map(([date, points]) => {
    const totalConsumption = points.reduce((sum, point) => sum + point.value, 0);
    const peakConsumption = points.reduce((max, point) => Math.max(max, point.value), 0);
    const offPeakConsumption = points.filter(p => p.is_off_peak).reduce((sum, point) => sum + point.value, 0);
    const peakHoursConsumption = points.filter(p => !p.is_off_peak).reduce((sum, point) => sum + point.value, 0);
    const offPeakPercentage = (offPeakConsumption / totalConsumption) * 100;
    
    return {
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      totalConsumption,
      peakConsumption,
      offPeakConsumption,
      peakHoursConsumption,
      offPeakPercentage
    };
  });

  // Formater les données pour le graphique horaire
  const hourlyData = data.map(point => {
    const dateTime = new Date(point.date_time);
    return {
      hour: dateTime.getHours(),
      minute: dateTime.getMinutes(),
      timeLabel: `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`,
      date: dateTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      fullDate: dateTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      value: point.value,
      is_off_peak: point.is_off_peak
    };
  });

  // Calculer les moyennes par heure
  const hourlyAverages = hourlyData.reduce((acc, point) => {
    const hour = point.hour;
    if (!acc[hour]) {
      acc[hour] = { sum: 0, count: 0, offPeakCount: 0, offPeakSum: 0 };
    }
    acc[hour].sum += point.value;
    acc[hour].count += 1;
    if (point.is_off_peak) {
      acc[hour].offPeakSum += point.value;
      acc[hour].offPeakCount += 1;
    }
    return acc;
  }, {} as Record<number, { sum: number, count: number, offPeakCount: number, offPeakSum: number }>);

  const hourlyAveragesData = Object.entries(hourlyAverages).map(([hour, stats]) => ({
    hour: parseInt(hour),
    timeLabel: `${hour}:00`,
    average: stats.sum / stats.count,
    offPeakAverage: stats.offPeakCount > 0 ? stats.offPeakSum / stats.offPeakCount : 0,
    isOffPeak: stats.offPeakCount > stats.count / 2
  }));

  // Trouver le jour avec la consommation la plus élevée
  const maxConsumptionDay = dailyStats.reduce(
    (max, day) => day.totalConsumption > max.totalConsumption ? day : max, 
    { totalConsumption: 0, date: '' }
  );

  // Trouver l'heure de pointe
  const peakHour = hourlyAveragesData.reduce(
    (max, hour) => hour.average > max.average ? hour : max,
    { average: 0, hour: 0, timeLabel: '' }
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        {/* Statistiques résumées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Points de données</p>
            <p className="text-2xl font-bold text-blue-700">{data.length}</p>
            <p className="text-xs text-blue-500 mt-1">Sur {Object.keys(groupedByDay).length} jours</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Jour de pointe</p>
            <p className="text-2xl font-bold text-green-700">{maxConsumptionDay.date}</p>
            <p className="text-xs text-green-500 mt-1">{maxConsumptionDay.totalConsumption.toFixed(1)} kWh</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Heure de pointe</p>
            <p className="text-2xl font-bold text-purple-700">{peakHour.timeLabel}</p>
            <p className="text-xs text-purple-500 mt-1">{peakHour.average.toFixed(2)} kW en moyenne</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">Heures creuses</p>
            <p className="text-2xl font-bold text-amber-700">
              {Math.round(data.filter(p => p.is_off_peak).length / data.length * 100)}%
            </p>
            <p className="text-xs text-amber-500 mt-1">des points de mesure</p>
          </div>
        </div>
        
        {/* Graphique de courbe de charge par jour */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={hourlyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeLabel" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
                interval={Math.floor(hourlyData.length / 24)}
              />
              <YAxis 
                label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)} kW`}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Puissance" 
                stroke="#8884d8" 
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Brush dataKey="timeLabel" height={30} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Graphique de consommation moyenne par heure */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommation moyenne par heure</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hourlyAveragesData.sort((a, b) => a.hour - b.hour)}
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
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} kW`, 
                  name === "average" ? "Moyenne" : "Moyenne HC"
                ]}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="average" 
                name="Moyenne" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="offPeakAverage" 
                name="Moyenne HC" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.3}
              />
              {/* Ajouter des lignes de référence pour les heures creuses */}
              {hourlyAveragesData
                .filter(hour => hour.isOffPeak)
                .map(hour => (
                  <ReferenceLine 
                    key={hour.hour} 
                    x={hour.timeLabel} 
                    stroke="#82ca9d" 
                    strokeDasharray="3 3" 
                  />
                ))
              }
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Graphique de consommation journalière */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommation journalière</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barSize={20}
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
                yAxisId="left"
                orientation="left"
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: '%', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "offPeakPercentage") return [`${value.toFixed(1)}%`, "% Heures creuses"];
                  return [`${value.toFixed(2)} kWh`, name === "peakHoursConsumption" ? "Heures pleines" : "Heures creuses"];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="peakHoursConsumption" 
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
                dataKey="offPeakPercentage" 
                name="% Heures creuses" 
                stroke="#F59E0B" 
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LoadCurveDisplay;