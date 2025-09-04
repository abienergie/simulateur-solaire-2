import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RotateCcw, TrendingUp, Clock, Zap, Calendar, User } from 'lucide-react';
import type { ConsumptionData } from '../types/consumption';
import { useClient } from '../contexts/client';

interface ConsumptionChartProps {
  data: ConsumptionData[];
  onReset: () => void;
}

const PRICES = {
  peakHours: 0.2062,
  offPeakHours: 0.1547
};

const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ data, onReset }) => {
  const { clientInfo } = useClient();

  // Agrégation des données par mois
  const monthlyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        date: monthKey,
        peakHours: 0,
        offPeakHours: 0,
        peakCost: 0,
        offPeakCost: 0
      };
    }
    
    acc[monthKey].peakHours += item.peakHours;
    acc[monthKey].offPeakHours += item.offPeakHours;
    acc[monthKey].peakCost += item.peakHours * PRICES.peakHours;
    acc[monthKey].offPeakCost += item.offPeakHours * PRICES.offPeakHours;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData).map(month => ({
    ...month,
    date: new Date(month.date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  }));

  // Calcul des totaux
  const totalPeakHours = chartData.reduce((sum, item) => sum + item.peakHours, 0);
  const totalOffPeakHours = chartData.reduce((sum, item) => sum + item.offPeakHours, 0);
  const totalConsumption = totalPeakHours + totalOffPeakHours;
  const totalPeakCost = totalPeakHours * PRICES.peakHours;
  const totalOffPeakCost = totalOffPeakHours * PRICES.offPeakHours;
  const totalCost = totalPeakCost + totalOffPeakCost;

  // Calcul des moyennes journalières
  const nbDays = data.length;
  const avgDailyConsumption = totalConsumption / nbDays;
  const avgPeakHours = totalPeakHours / nbDays;
  const avgOffPeakHours = totalOffPeakHours / nbDays;

  // Analyse des pics de consommation
  const dailyConsumptions = data.map(day => ({
    date: day.date,
    total: day.peakHours + day.offPeakHours
  }));
  const maxConsumption = Math.max(...dailyConsumptions.map(d => d.total));
  const maxConsumptionDate = dailyConsumptions.find(d => d.total === maxConsumption)?.date;
  const formattedMaxDate = maxConsumptionDate 
    ? new Date(maxConsumptionDate).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : '';

  // Calcul du ratio heures pleines/creuses
  const peakRatio = (totalPeakHours / totalConsumption) * 100;
  const offPeakRatio = (totalOffPeakHours / totalConsumption) * 100;

  // Si pas de données, afficher un message
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-600">Aucune donnée de consommation disponible.</p>
        <button
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Analyse de consommation
        </h2>
        <div className="flex items-center gap-2 text-gray-600">
          <User className="h-5 w-5" />
          <span>Point de livraison de {clientInfo.civilite} {clientInfo.nom} {clientInfo.prenom}</span>
        </div>
      </div>

      {/* Statistiques de base */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Consommation totale</p>
          <p className="text-2xl font-bold text-blue-700">
            {Math.round(totalConsumption).toLocaleString()} kWh
          </p>
          <div className="mt-1 text-sm">
            <p className="text-blue-600">HP: {Math.round(totalPeakHours).toLocaleString()} kWh</p>
            <p className="text-blue-600">HC: {Math.round(totalOffPeakHours).toLocaleString()} kWh</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Dépenses totales</p>
          <p className="text-2xl font-bold text-green-700">
            {Math.round(totalCost).toLocaleString()} €
          </p>
          <p className="mt-1 text-sm text-green-600">
            {(totalCost / chartData.length).toFixed(2)} €/mois
          </p>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-indigo-600 font-medium">Prix heures pleines</p>
          <p className="text-2xl font-bold text-indigo-700">
            {(PRICES.peakHours * 100).toFixed(2)} c€/kWh
          </p>
          <p className="mt-1 text-sm text-indigo-600">
            6h-22h en semaine
          </p>
        </div>

        <div className="bg-teal-50 rounded-lg p-4">
          <p className="text-sm text-teal-600 font-medium">Prix heures creuses</p>
          <p className="text-2xl font-bold text-teal-700">
            {(PRICES.offPeakHours * 100).toFixed(2)} c€/kWh
          </p>
          <p className="mt-1 text-sm text-teal-600">
            22h-6h + week-ends
          </p>
        </div>
      </div>

      {/* Analyses complémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Moyennes journalières */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium text-purple-900">Moyennes journalières</h3>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {avgDailyConsumption.toFixed(1)} kWh/jour
          </p>
          <div className="mt-2 text-sm space-y-1">
            <p className="text-purple-600">HP: {avgPeakHours.toFixed(1)} kWh/jour</p>
            <p className="text-purple-600">HC: {avgOffPeakHours.toFixed(1)} kWh/jour</p>
          </div>
        </div>

        {/* Pic de consommation */}
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-medium text-amber-900">Pic de consommation</h3>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {maxConsumption.toFixed(1)} kWh
          </p>
          <p className="mt-2 text-sm text-amber-600">
            Atteint le {formattedMaxDate}
          </p>
        </div>

        {/* Répartition HP/HC */}
        <div className="bg-rose-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-rose-500" />
            <h3 className="font-medium text-rose-900">Répartition HP/HC</h3>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-rose-600">
                  Heures pleines
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold inline-block text-rose-600">
                  {peakRatio.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-rose-200">
              <div
                style={{ width: `${peakRatio}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500"
              />
            </div>
            <div className="flex mt-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-rose-600">
                  Heures creuses
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold inline-block text-rose-600">
                  {offPeakRatio.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique de consommation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Consommation électrique mensuelle (kWh)
        </h3>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              barSize={20}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                unit=" kWh"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${Math.round(value)} kWh`,
                  name === "peakHours" ? "Heures pleines" : "Heures creuses"
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                  padding: '8px 12px'
                }}
                cursor={{ fill: 'rgba(229, 231, 235, 0.2)' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => value === "peakHours" ? "Heures pleines" : "Heures creuses"}
              />
              <Bar
                dataKey="peakHours"
                name="peakHours"
                stackId="consumption"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="offPeakHours"
                name="offPeakHours"
                stackId="consumption"
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique des dépenses */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Dépenses mensuelles (€)
        </h3>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              barSize={20}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                unit=" €"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} €`,
                  name === "peakCost" ? "Coût heures pleines" : "Coût heures creuses"
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                  padding: '8px 12px'
                }}
                cursor={{ fill: 'rgba(229, 231, 235, 0.2)' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => value === "peakCost" ? "Coût heures pleines" : "Coût heures creuses"}
              />
              <Bar
                dataKey="peakCost"
                name="peakCost"
                stackId="cost"
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="offPeakCost"
                name="offPeakCost"
                stackId="cost"
                fill="#EC4899"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bouton de réinitialisation */}
      <div className="flex justify-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser les données
        </button>
      </div>
    </div>
  );
};

export default ConsumptionChart;