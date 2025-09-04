import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Calendar, Clock, Zap, TrendingUp } from 'lucide-react';
import { normalizeAndFilter, type RawPoint } from '../hooks/useEnedisData';
import { DateTime } from 'luxon';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number | null;
  is_off_peak: boolean;
}

interface AnnualLoadCurveTimelineProps {
  data: LoadCurvePoint[];
  title?: string;
}

const AnnualLoadCurveTimeline: React.FC<AnnualLoadCurveTimelineProps> = ({ 
  data, 
  title = "Courbe de charge annuelle (365 jours)" 
}) => {
  // Préparer les données pour le graphique chronologique
  const timelineData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Déclarer les variables en dehors du try-catch pour éviter les erreurs de portée
    let rawPoints: RawPoint[] = [];
    let normalizedPoints: any[] = [];

    try {
      // Convertir en RawPoint et normaliser avec Luxon avec vérifications de sécurité
      rawPoints = data
        .filter(point => {
          return point && 
                 point.value !== null && 
                 point.value !== undefined && 
                 typeof point.value === 'number' &&
                 !isNaN(point.value) &&
                 point.date_time &&
                 typeof point.date_time === 'string';
        })
        .map(point => ({
          date: point.date_time,
          interval_length: 30,
          value: point.value
        }));
      
      if (rawPoints.length === 0) {
        console.warn("Aucun point valide pour timeline");
        return [];
      }
      
      // Normaliser et filtrer avec J-2 (date absolue)
      normalizedPoints = normalizeAndFilter(rawPoints);
      
      if (normalizedPoints.length === 0) {
        console.warn("Aucun point après normalisation timeline");
        return [];
      }
    } catch (timelineError) {
      console.error("Erreur lors de la création de timeline:", timelineError);
      return [];
    }
    
    // Trier par début d'intervalle
    const sortedPoints = normalizedPoints
      .sort((a, b) => a.start.toMillis() - b.start.toMillis());

    // Échantillonner les données pour améliorer les performances (1 point sur 10)
    const sampledData = sortedPoints.filter((_, index) => index % 10 === 0);

    return sampledData.map(np => ({
      date_time: np.start.toISO(),
      value: np.value,
      is_off_peak: false, // À déterminer
      dateLabel: np.start.toLocaleString({ 
        day: '2-digit', 
        month: 'short'
      }),
      timeLabel: np.start.toLocaleString({ 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      dayOfWeek: np.start.weekday === 7 ? 0 : np.start.weekday,
      month: np.start.month
    }));
  }, [data]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Utiliser la normalisation Luxon pour les statistiques
    const rawPoints: RawPoint[] = data
      .filter(point => 
        point.value !== null && 
        point.value !== undefined && 
        point.date_time
      )
      .map(point => ({
        date: point.date_time,
        interval_length: 30,
        value: point.value
      }));
    
    const normalizedPoints = normalizeAndFilter(rawPoints);
    const validPoints = normalizedPoints.filter(np => np.value !== null);
    const values = validPoints.map(np => np.value as number);
    
    if (values.length === 0) return null;

    const totalConsumption = values.reduce((sum, val) => sum + val, 0);
    const avgPower = totalConsumption / values.length;
    const maxPower = Math.max(...values);
    const minPower = Math.min(...values);
    
    // Calculer la répartition HC/HP
    // Note: is_off_peak sera déterminé plus tard selon les heures creuses
    const offPeakConsumption = 0; // Placeholder
    const peakConsumption = totalConsumption; // Placeholder
    
    return {
      totalPoints: data.length,
      validPoints: normalizedPoints.length,
      coverage: (normalizedPoints.length / data.length) * 100,
      avgPower,
      maxPower,
      minPower,
      totalConsumption,
      offPeakConsumption,
      peakConsumption,
      offPeakPercentage: (offPeakConsumption / totalConsumption) * 100,
      peakPercentage: (peakConsumption / totalConsumption) * 100
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée de courbe de charge disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      {/* Statistiques résumées */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-blue-600 font-medium">Couverture des données</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {stats.coverage.toFixed(1)}%
            </p>
            <p className="text-xs text-blue-500 mt-1">
              {stats.validPoints.toLocaleString()} / {stats.totalPoints.toLocaleString()} points
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 font-medium">Puissance moyenne</p>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {stats.avgPower.toFixed(2)} kW
            </p>
            <p className="text-xs text-green-500 mt-1">
              Max: {stats.maxPower.toFixed(2)} kW
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-purple-600 font-medium">Répartition HP/HC</p>
            </div>
            <p className="text-lg font-bold text-purple-700">
              {stats.peakPercentage.toFixed(0)}% / {stats.offPeakPercentage.toFixed(0)}%
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Heures pleines / Heures creuses
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-amber-600 font-medium">Consommation totale</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {(stats.totalConsumption / 1000).toFixed(1)} MWh
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Sur la période analysée
            </p>
          </div>
        </div>
      )}

      {/* Graphique chronologique */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timelineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="dateLabel"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 10 }}
              interval={Math.floor(timelineData.length / 20)} // Afficher ~20 labels
            />
            <YAxis 
              label={{ value: 'Puissance (kW)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value?.toFixed(3)} kW`, 'Puissance']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const point = payload[0].payload;
                  return `${point.dateLabel} à ${point.timeLabel}`;
                }
                return label;
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
              dataKey="value" 
              name="Puissance (kW)" 
              stroke="#3B82F6" 
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 4 }}
            />
            
            {/* Ligne de référence pour la puissance moyenne */}
            {stats && (
              <ReferenceLine 
                y={stats.avgPower} 
                stroke="#10B981" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ 
                  value: `Moyenne: ${stats.avgPower.toFixed(2)} kW`, 
                  position: "topRight",
                  style: { fill: '#10B981', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
            )}
            
            {/* Ligne de référence pour la puissance maximale */}
            {stats && (
              <ReferenceLine 
                y={stats.maxPower} 
                stroke="#F59E0B" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ 
                  value: `Max: ${stats.maxPower.toFixed(2)} kW`, 
                  position: "topLeft",
                  style: { fill: '#F59E0B', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Informations complémentaires */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Analyse temporelle</h5>
          <div className="space-y-1 text-sm text-blue-700">
            <p>• Période: {timelineData.length > 0 ? `${timelineData[0]?.dateLabel} au ${timelineData[timelineData.length - 1]?.dateLabel}` : 'Aucune'}</p>
            <p>• Fréquence: Données toutes les 30 minutes</p>
            <p>• Échantillonnage: 1 point sur 10 affiché (optimisation)</p>
            {stats && <p>• Couverture: {stats.coverage.toFixed(1)}% des données attendues</p>}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">Profil de consommation</h5>
          <div className="space-y-1 text-sm text-green-700">
            {stats && (
              <>
                <p>• Consommation moyenne: {stats.avgPower.toFixed(2)} kW</p>
                <p>• Pic de consommation: {stats.maxPower.toFixed(2)} kW</p>
                <p>• Consommation minimale: {stats.minPower.toFixed(2)} kW</p>
                <p>• Total sur la période: {(stats.totalConsumption / 1000).toFixed(1)} MWh</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualLoadCurveTimeline;