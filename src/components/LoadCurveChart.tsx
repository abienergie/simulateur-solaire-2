import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { BarChart3, Clock, Calendar, Zap } from 'lucide-react';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number;
  is_off_peak: boolean;
}

interface LoadCurveChartProps {
  data: LoadCurvePoint[];
  actualPointsCount?: number | null;
  title?: string;
}

const LoadCurveChart: React.FC<LoadCurveChartProps> = ({ 
  data, 
  actualPointsCount,
  title = "Courbe de charge - 12 mois" 
}) => {
  // Analyser les données pour extraire les métadonnées
  const analysisData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalPoints: actualPointsCount || 0,
        startDate: null,
        endDate: null,
        frequency: 'Aucune donnée',
        frequencyMinutes: 0,
        avgValue: 0,
        maxValue: 0,
        minValue: 0
      };
    }

    // Trier les données par date_time
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );

    const startDate = new Date(sortedData[0].date_time);
    const endDate = new Date(sortedData[sortedData.length - 1].date_time);

    // Calculer la fréquence en analysant les intervalles
    let totalIntervals = 0;
    let sumIntervals = 0;
    
    for (let i = 1; i < Math.min(sortedData.length, 100); i++) {
      const prev = new Date(sortedData[i - 1].date_time);
      const curr = new Date(sortedData[i].date_time);
      const diffMinutes = (curr.getTime() - prev.getTime()) / (1000 * 60);
      
      if (diffMinutes > 0 && diffMinutes <= 120) { // Ignorer les intervalles aberrants
        sumIntervals += diffMinutes;
        totalIntervals++;
      }
    }

    const avgIntervalMinutes = totalIntervals > 0 ? Math.round(sumIntervals / totalIntervals) : 30;
    
    let frequencyLabel = '';
    switch (avgIntervalMinutes) {
      case 10:
        frequencyLabel = '10 minutes';
        break;
      case 15:
        frequencyLabel = '15 minutes';
        break;
      case 30:
        frequencyLabel = '30 minutes';
        break;
      case 60:
        frequencyLabel = '1 heure';
        break;
      case 120:
        frequencyLabel = '2 heures';
        break;
      default:
        frequencyLabel = `${avgIntervalMinutes} minutes`;
    }

    // Calculer les statistiques
    const values = data.map(d => d.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    return {
      totalPoints: actualPointsCount || data.length,
      startDate,
      endDate,
      frequency: frequencyLabel,
      frequencyMinutes: avgIntervalMinutes,
      avgValue,
      maxValue,
      minValue
    };
  }, [data, actualPointsCount]);

  // Préparer les données pour le graphique (échantillonnage si trop de points)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Si plus de 1000 points, échantillonner pour améliorer les performances
    let sampledData = data;
    if (data.length > 1000) {
      const step = Math.ceil(data.length / 1000);
      sampledData = data.filter((_, index) => index % step === 0);
    }

    return sampledData.map(point => ({
      ...point,
      dateTime: new Date(point.date_time),
      timeLabel: new Date(point.date_time).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      dateLabel: new Date(point.date_time).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }));
  }, [data]);

  // Données agrégées par jour pour vue d'ensemble
  const dailyData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const dailyMap = new Map();
    
    data.forEach(point => {
      const dateKey = point.date;
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          dateLabel: new Date(point.date).toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          totalConsumption: 0,
          maxPower: 0,
          minPower: Infinity,
          pointCount: 0,
          avgPower: 0
        });
      }
      
      const dayData = dailyMap.get(dateKey);
      dayData.totalConsumption += point.value;
      dayData.maxPower = Math.max(dayData.maxPower, point.value);
      dayData.minPower = Math.min(dayData.minPower, point.value);
      dayData.pointCount++;
    });

    // Calculer les moyennes et convertir en array
    const dailyArray = Array.from(dailyMap.values()).map(day => ({
      ...day,
      avgPower: day.totalConsumption / day.pointCount,
      minPower: day.minPower === Infinity ? 0 : day.minPower
    }));

    // Trier par date et limiter à 90 jours pour la lisibilité
    return dailyArray
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-90);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée de courbe de charge disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques de la courbe de charge */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-blue-600 font-medium">Points de données</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {actualPointsCount !== null
                ? actualPointsCount.toLocaleString()
                : analysisData.totalPoints.toLocaleString()}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              {chartData.length < (actualPointsCount || analysisData.totalPoints)
                ? `Affichage: ${chartData.length.toLocaleString()} points (échantillonné)`
                : 'Tous les points affichés'
              }
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 font-medium">Période</p>
            </div>
            <p className="text-sm font-bold text-green-700">
              {analysisData.startDate?.toLocaleDateString('fr-FR')}
            </p>
            <p className="text-sm font-bold text-green-700">
              au {analysisData.endDate?.toLocaleDateString('fr-FR')}
            </p>
            <p className="text-xs text-green-500 mt-1">
              {analysisData.startDate && analysisData.endDate 
                ? `${Math.ceil((analysisData.endDate.getTime() - analysisData.startDate.getTime()) / (1000 * 60 * 60 * 24))} jours`
                : ''
              }
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-purple-600 font-medium">Fréquence</p>
            </div>
            <p className="text-xl font-bold text-purple-700">
              {analysisData.frequency}
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Intervalle de mesure
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-amber-600 font-medium">Puissance</p>
            </div>
            <p className="text-lg font-bold text-amber-700">
              {analysisData.avgValue.toFixed(2)} kW
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Moy: {analysisData.avgValue.toFixed(2)} | Max: {analysisData.maxValue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Graphique de consommation quotidienne (vue d'ensemble) */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-3">Consommation quotidienne (90 derniers jours)</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateLabel" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === "avgPower") return [`${value.toFixed(2)} kW`, 'Puissance moyenne'];
                    if (name === "maxPower") return [`${value.toFixed(2)} kW`, 'Puissance max'];
                    return [`${value.toFixed(2)} kW`, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avgPower" 
                  name="avgPower"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxPower" 
                  name="maxPower"
                  stroke="#ff7300" 
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique détaillé de la courbe de charge */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Courbe de charge détaillée 
            {chartData.length < analysisData.totalPoints && (
              <span className="text-sm text-gray-500 font-normal">
                (échantillonnée pour les performances)
              </span>
            )}
          </h4>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  label={{ value: 'Puissance (kW)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(3)} kW`, 'Puissance']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const point = payload[0].payload;
                      return `${point.dateLabel} à ${point.timeLabel}`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Puissance (kW)" 
                  stroke="#2563eb" 
                  strokeWidth={1}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Analyse des données</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Période totale: {analysisData.totalPoints.toLocaleString()} mesures</p>
              <p>• Fréquence: {analysisData.frequency}</p>
              <p>• Puissance moyenne: {analysisData.avgValue.toFixed(2)} kW</p>
              <p>• Pic de consommation: {analysisData.maxValue.toFixed(2)} kW</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Utilisation du graphique</h5>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• Vue d'ensemble: Consommation quotidienne</p>
              <p>• Vue détaillée: Courbe de charge complète</p>
              <p>• Survolez les points pour plus de détails</p>
              <p>• Les données sont automatiquement échantillonnées si nécessaire</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadCurveChart;