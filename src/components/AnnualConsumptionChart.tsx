import React from 'react';
import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, ReferenceLine, PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

interface ConsumptionData {
  date: string;
  peak_hours: number;
  off_peak_hours: number;
  total: number;
}

interface MaxPowerData {
  date: string;
  max_power: number;
}

interface AnnualConsumptionChartProps {
  data: ConsumptionData[];
  maxPowerData?: MaxPowerData[];
  loadCurveData?: any[];
  loading: boolean;
  error: string | null;
  title?: string;
}

// Couleurs pour le camembert
const PIE_COLORS = ['#3B82F6', '#10B981']; // Bleu et vert

const AnnualConsumptionChart: React.FC<AnnualConsumptionChartProps> = ({ 
  data, 
  maxPowerData = [],
  loadCurveData = [],
  loading, 
  error, 
  title = "Consommation quotidienne sur l'année (kWh)" 
}) => {

  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  // Si pas de données, afficher un message
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune donnée de consommation disponible</p>
        </div>
      </div>
    );
  }

  // Calculer les statistiques de consommation
  const totalConsumption = data.reduce((sum, item) => sum + (item.total || (item.peak_hours + item.off_peak_hours)), 0);
  const averageDaily = totalConsumption / data.length;
  const maxDaily = Math.max(...data.map(item => item.total || (item.peak_hours + item.off_peak_hours)));

  // Calculer les totaux HC/HP pour le camembert
  // Utiliser les données réelles de la courbe de charge si disponibles
  let totalPeakHours, totalOffPeakHours, peakPercentage, offPeakPercentage;
  
  // SOLUTION SIMPLE : Calculer HC/HP directement depuis la courbe de charge (17,520 points)
  if (loadCurveData && loadCurveData.length > 0) {
    console.log('🔄 Calcul HC/HP depuis courbe de charge');
    console.log('📊 Points disponibles:', loadCurveData.length);
    
    // Calculer HC/HP depuis la courbe de charge avec protection
    let loadCurvePeakConsumption = 0;
    let loadCurveOffPeakConsumption = 0;
    let validPoints = 0;
    
    // Traiter par petits lots pour éviter les blocages
    const batchSize = 1000;
    for (let i = 0; i < loadCurveData.length; i += batchSize) {
      const batch = loadCurveData.slice(i, i + batchSize);
      
      batch.forEach(point => {
        // Vérifications de sécurité
        if (point && 
            typeof point.value === 'number' && 
            !isNaN(point.value) && 
            point.value >= 0 &&
            typeof point.is_off_peak === 'boolean') {
          
          // Convertir kW en kWh (30min = 0.5h)
          const energyKwh = point.value * 0.5;
          
          if (point.is_off_peak) {
            loadCurveOffPeakConsumption += energyKwh;
          } else {
            loadCurvePeakConsumption += energyKwh;
          }
          validPoints++;
        }
      });
    }
    
    const loadCurveTotal = loadCurvePeakConsumption + loadCurveOffPeakConsumption;
    
    console.log('🎯 RÉSULTAT HC/HP depuis courbe de charge:', {
      totalHP_kWh: loadCurvePeakConsumption.toFixed(2),
      totalHC_kWh: loadCurveOffPeakConsumption.toFixed(2),
      totalCourbe_kWh: loadCurveTotal.toFixed(2),
      pointsValides: validPoints,
      pointsTotal: loadCurveData.length
    });
    
    // Vérifier que les données sont cohérentes
    if (loadCurveTotal > 0 && validPoints > 0) {
      // Utiliser les données de la courbe de charge
      totalPeakHours = loadCurvePeakConsumption;
      totalOffPeakHours = loadCurveOffPeakConsumption;
      
      peakPercentage = (totalPeakHours / loadCurveTotal) * 100;
      offPeakPercentage = (totalOffPeakHours / loadCurveTotal) * 100;
    } else {
      // Fallback sur les données de consommation quotidienne
      totalPeakHours = data.reduce((sum, item) => sum + item.peak_hours, 0);
      totalOffPeakHours = data.reduce((sum, item) => sum + item.off_peak_hours, 0);
      
      peakPercentage = totalConsumption > 0 ? (totalPeakHours / totalConsumption) * 100 : 0;
      offPeakPercentage = totalConsumption > 0 ? (totalOffPeakHours / totalConsumption) * 100 : 0;
    }
  } else {
    console.log('⚠️ Aucune donnée de courbe de charge, fallback sur get_consumption');
    
    // Fallback : utiliser les données de consommation quotidienne
    totalPeakHours = data.reduce((sum, item) => sum + item.peak_hours, 0);
    totalOffPeakHours = data.reduce((sum, item) => sum + item.off_peak_hours, 0);
    
    peakPercentage = totalConsumption > 0 ? (totalPeakHours / totalConsumption) * 100 : 0;
    offPeakPercentage = totalConsumption > 0 ? (totalOffPeakHours / totalConsumption) * 100 : 0;
  }

  // Données pour le camembert HC/HP
  const pieData = [
    { 
      name: 'Heures pleines', 
      value: Math.round(totalPeakHours), 
      percentage: Math.round(peakPercentage * 10) / 10 
    },
    { 
      name: 'Heures creuses', 
      value: Math.round(totalOffPeakHours), 
      percentage: Math.round(offPeakPercentage * 10) / 10 
    }
  ];

  // Calculer les données mensuelles pour le 4ème graphique
  const monthlyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        peakHours: 0,
        offPeakHours: 0,
        total: 0
      };
    }
    
    acc[monthKey].peakHours += item.peak_hours;
    acc[monthKey].offPeakHours += item.off_peak_hours;
    acc[monthKey].total += (item.total || (item.peak_hours + item.off_peak_hours));
    
    return acc;
  }, {} as Record<string, any>);

  const monthlyChartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // Calculer les données hebdomadaires pour le 4ème graphique
  const weeklyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    
    if (!acc[weekKey]) {
      acc[weekKey] = {
        week: weekKey,
        label: `S${weekNumber} ${year}`,
        peakHours: 0,
        offPeakHours: 0,
        total: 0
      };
    }
    
    acc[weekKey].peakHours += item.peak_hours;
    acc[weekKey].offPeakHours += item.off_peak_hours;
    acc[weekKey].total += (item.total || (item.peak_hours + item.off_peak_hours));
    
    return acc;
  }, {} as Record<string, any>);

  const weeklyChartData = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));

  // Fonction pour calculer le numéro de semaine
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Choisir les données à afficher selon le mode
  const chartData = viewMode === 'monthly' ? monthlyChartData : weeklyChartData;
  const chartTitle = viewMode === 'monthly' 
    ? `Consommation mensuelle - Heures Creuses / Heures Pleines`
    : `Consommation hebdomadaire - Heures Creuses / Heures Pleines`;

  // Calculer les statistiques de puissance max
  const maxPowerStats = maxPowerData.length > 0 ? {
    maxPower: Math.max(...maxPowerData.map(item => item.max_power)),
    averagePower: maxPowerData.reduce((sum, item) => sum + item.max_power, 0) / maxPowerData.length
  } : { maxPower: 0, averagePower: 0 };

  return (
    <div className="space-y-8">
      {/* 1er GRAPHIQUE : Consommation quotidienne */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Consommation quotidienne sur l'année (kWh)
        </h3>
        
        {/* Statistiques résumées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Consommation totale</p>
            <p className="text-2xl font-bold text-blue-700">{Math.round(totalConsumption).toLocaleString()} kWh</p>
            <p className="text-xs text-blue-500 mt-1">Sur {data.length} jours</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Consommation moyenne</p>
            <p className="text-2xl font-bold text-green-700">
              {averageDaily.toFixed(2)} kWh/jour
            </p>
            <p className="text-xs text-green-500 mt-1">Moyenne quotidienne</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Consommation maximale</p>
            <p className="text-2xl font-bold text-purple-700">
              {maxDaily.toFixed(2)} kWh
            </p>
            <p className="text-xs text-purple-500 mt-1">Pic journalier</p>
          </div>
        </div>

        {/* Graphique de consommation totale - bleu ciel clair */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.map(item => ({
                date: item.date,
                total: item.total || (item.peak_hours + item.off_peak_hours)
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date"
                tickFormatter={(dateStr) => {
                  const date = new Date(dateStr);
                  return date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short' 
                  });
                }}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
                interval={Math.floor(data.length / 12)} // Afficher ~12 labels
              />
              <YAxis 
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(2) : 'N/A'} kW`, 'Puissance maximale']}
                labelFormatter={(label: string) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  });
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                  padding: '8px 12px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                name="Consommation totale"
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.2}
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          Données de consommation quotidienne sur {data.length} jours
        </div>
      </div>

      {/* 2ème GRAPHIQUE : Puissance maximale */}
      {maxPowerData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Puissance maximale quotidienne sur l'année (kW)
          </h3>
          
          {/* Statistiques résumées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Nombre de jours</p>
              <p className="text-2xl font-bold text-orange-700">{maxPowerData.length}</p>
              <p className="text-xs text-orange-500 mt-1">Période analysée</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Puissance moyenne</p>
              <p className="text-2xl font-bold text-red-700">
                {maxPowerStats.averagePower.toFixed(2)} kW
              </p>
              <p className="text-xs text-red-500 mt-1">Moyenne des pics</p>
            </div>
            
            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="text-sm text-pink-600 font-medium">Puissance maximale</p>
              <p className="text-2xl font-bold text-pink-700">
                {maxPowerStats.maxPower.toFixed(2)} kW
              </p>
              <p className="text-xs text-pink-500 mt-1">Pic absolu de l'année</p>
            </div>
          </div>

          {/* Graphique de puissance max avec ligne horizontale */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={maxPowerData}
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(dateStr) => {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: 'short' 
                    });
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(maxPowerData.length / 12)} // Afficher ~12 labels
                />
                <YAxis 
                  label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} kW`, 'Puissance maximale']}
                  labelFormatter={(label: string) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    padding: '8px 12px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="max_power" 
                  name="Puissance maximale"
                  stroke="#F97316" 
                  strokeWidth={1}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                {/* Ligne horizontale rouge pour la puissance max de l'année */}
                <ReferenceLine 
                  y={maxPowerStats.maxPower} 
                  stroke="#DC2626" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ 
                    value: `Pic annuel: ${maxPowerStats.maxPower.toFixed(2)} kW`, 
                    position: "topLeft",
                    offset: 55,
                    style: { fill: '#DC2626', fontSize: '12px', fontWeight: 'bold' }
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 text-center">
            Données de puissance maximale quotidienne sur {maxPowerData.length} jours
          </div>
        </div>
      )}

      {/* 3ème GRAPHIQUE : Camembert HC/HP */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Répartition Heures Creuses / Heures Pleines
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camembert */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${Math.round(value).toLocaleString()} kWh`, 
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Statistiques détaillées */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <h4 className="font-medium text-blue-900">Heures Pleines</h4>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {Math.round(totalPeakHours).toLocaleString()} kWh
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {peakPercentage.toFixed(1)}% de la consommation totale
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <h4 className="font-medium text-green-900">Heures Creuses</h4>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {Math.round(totalOffPeakHours).toLocaleString()} kWh
              </p>
              <p className="text-sm text-green-600 mt-1">
                {offPeakPercentage.toFixed(1)}% de la consommation totale
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Total annuel</h4>
              <p className="text-xl font-bold text-gray-700">
                {Math.round(totalConsumption).toLocaleString()} kWh
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Sur {data.length} jours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4ème GRAPHIQUE : Consommation mensuelle HC/HP */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {chartTitle}
          </h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hebdomadaire
            </button>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="label" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${typeof value === 'number' ? Math.round(value).toLocaleString() : 'N/A'} kWh`, 
                  name === "peakHours" ? "Heures pleines" : "Heures creuses"
                ]}
                labelFormatter={(label) => `Mois: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                  padding: '8px 12px'
                }}
              />
              <Legend 
                formatter={(value) => value === "peakHours" ? "Heures pleines" : "Heures creuses"}
              />
              <Bar 
                dataKey="peakHours" 
                name="peakHours"
                stackId="consumption"
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="offPeakHours" 
                name="offPeakHours"
                stackId="consumption"
                fill="#10B981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          {viewMode === 'monthly' 
            ? `Répartition mensuelle des heures creuses et pleines sur ${monthlyChartData.length} mois`
            : `Répartition hebdomadaire des heures creuses et pleines sur ${weeklyChartData.length} semaines`
          }
        </div>
      </div>
    </div>
  );
};

export default AnnualConsumptionChart;