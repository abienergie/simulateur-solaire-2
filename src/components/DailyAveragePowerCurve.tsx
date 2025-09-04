import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';
import { CheckSquare, Square, Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { bucketByWeekdayStart, completenessByDow, normalizeAndFilter, type RawPoint, type NormPoint } from '../hooks/useEnedisData';
import { DateTime } from 'luxon';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number | null;
  is_off_peak: boolean;
}

interface DailyAveragePowerCurveProps {
  data: LoadCurvePoint[];
  title?: string;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Dimanche', color: '#FFCC33' },
  { id: 1, name: 'Lundi', color: '#FF6633' },
  { id: 2, name: 'Mardi', color: '#FF3399' },
  { id: 3, name: 'Mercredi', color: '#6633FF' },
  { id: 4, name: 'Jeudi', color: '#33CCFF' },
  { id: 5, name: 'Vendredi', color: '#33CC66' },
  { id: 6, name: 'Samedi', color: '#FFCC00' }
];

const DailyAveragePowerCurve: React.FC<DailyAveragePowerCurveProps> = ({ 
  data, 
  title = "Courbe de puissances journalière moyenne" 
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>(DAYS_OF_WEEK.map(day => day.id));
  const [allSelected, setAllSelected] = useState(true);

  console.log("🔍 Analyse des données reçues :", {
    totalPoints: data.length,
    objectif: 17520,
    pourcentage: ((data.length / 17520) * 100).toFixed(1) + '%'
  });

  // LOGIQUE CORRIGÉE : Normalisation avec Luxon et début d'intervalle
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    console.log("🔧 Début normalisation Luxon pour moyennes journalières");

    // Déclarer les variables en dehors du try-catch pour éviter les erreurs de portée
    let rawPoints: RawPoint[] = [];
    let normalizedPoints: NormPoint[] = [];

    try {
      // 1) Convertir en RawPoint pour normalisation avec vérifications de sécurité
      rawPoints = data
        .filter(point => {
          // Vérifications de sécurité strictes
          return point && 
                 point.value !== null && 
                 point.value !== undefined && 
                 typeof point.value === 'number' &&
                 !isNaN(point.value) &&
                 point.value >= 0 && // Inclure les valeurs à 0
                 point.date_time && 
                 typeof point.date_time === 'string';
        })
        .map(point => ({
          date: point.date_time, // Fin d'intervalle Enedis
          interval_length: 30,   // Supposer 30min par défaut
          value: point.value
        }));

      if (rawPoints.length === 0) {
        console.warn("Aucun point valide après filtrage");
        return [];
      }

      // 2) Normaliser et filtrer avec J-2 (date absolue, pas jour de semaine)
      normalizedPoints = normalizeAndFilter(rawPoints);
      
      if (normalizedPoints.length === 0) {
        console.warn("Aucun point après normalisation");
        return [];
      }
    } catch (normalizationError) {
      console.error("Erreur lors de la normalisation:", normalizationError);
      return [];
    }
    
    console.log("📊 Données après normalisation Luxon :", {
      avant: rawPoints.length,
      après: normalizedPoints.length,
      pourcentageValide: ((normalizedPoints.length / rawPoints.length) * 100).toFixed(1) + '%'
    });

    // 3) Grouper par jour de semaine avec début d'intervalle
    const byDow = bucketByWeekdayStart(normalizedPoints);
    const qa = completenessByDow(byDow);
    
    // Logs QA pour diagnostic
    for (let d=1; d<=7; d++) {
      const {count, minHH, maxHH} = qa[d];
      const dayName = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][d];
      console.log(`[GRAPHIQUE][DOW=${d}] ${dayName}: count=${count} min=${minHH} max=${maxHH}`);
    }

    // 4) Grouper par créneau horaire pour chaque jour
    const groupedByDayAndTime: Record<number, Record<string, number[]>> = {};
    
    Object.entries(byDow).forEach(([dowStr, points]) => {
      const dow = parseInt(dowStr);
      groupedByDayAndTime[dow] = {};
      
      points.forEach(np => {
        const timeSlot = np.start.toFormat('HH:mm');
        if (!groupedByDayAndTime[dow][timeSlot]) {
          groupedByDayAndTime[dow][timeSlot] = [];
        }
        if (np.value !== null) {
          groupedByDayAndTime[dow][timeSlot].push(np.value);
        }
      });
    });

    console.log("📈 Groupement terminé :", {
      joursAvecDonnées: Object.keys(groupedByDayAndTime).length,
      détailParJour: Object.entries(groupedByDayAndTime).map(([dowStr, slots]) => {
        const dow = parseInt(dowStr);
        const dayName = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][dow];
        return {
        jour: dayName,
        créneaux: Object.keys(slots).length,
        totalPoints: Object.values(slots).reduce((sum, vals) => sum + vals.length, 0),
        pointsAttendus: 48 * Math.ceil(normalizedPoints.length / (365 * 48)) // Estimation dynamique
        };
      })
    });

    // 5) Calculer les moyennes pour chaque jour et chaque créneau
    const averagesByDay: Record<number, Record<string, number>> = {};

    Object.entries(groupedByDayAndTime).forEach(([dayStr, timeSlots]) => {
      const day = parseInt(dayStr);
      averagesByDay[day] = {};
      
      Object.entries(timeSlots).forEach(([timeSlot, values]) => {
        if (values.length > 0) {
          // Calculer la moyenne en excluant les valeurs aberrantes (> 50kW)
          const cleanValues = values.filter(v => v <= 50);
          if (cleanValues.length > 0) {
            averagesByDay[day][timeSlot] = cleanValues.reduce((sum, v) => sum + v, 0) / cleanValues.length;
          }
        }
      });
    });

    // 6) Créer le tableau final pour Recharts (48 créneaux de 30min)
    const chartRows: { time: string; [key: string]: number | null | string }[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const row: any = { time: timeSlot };
        
        // Ajouter les valeurs pour chaque jour de la semaine (Luxon DOW: 1-7)
        for (let dow = 1; dow <= 7; dow++) {
          const dayName = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][dow];
          row[dayName] = averagesByDay[dow]?.[timeSlot] || null;
        }
        
        chartRows.push(row);
      }
    }

    console.log("🎯 Tableau final généré :", {
      créneaux: chartRows.length,
      échantillon: chartRows.slice(0, 3).map(row => ({
        time: row.time,
        valeurs: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => ({ 
          jour: day, 
          valeur: row[day] 
        })).filter(v => v.valeur !== null)
      }))
    });

    return chartRows;
  }, [data]);

  // Calculer les statistiques globales
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Utiliser la normalisation Luxon pour les statistiques
    const rawPoints: RawPoint[] = data
      .filter(point => 
        point.value !== null && 
        point.value !== undefined && 
        point.value > 0 && 
        point.date_time
      )
      .map(point => ({
        date: point.date_time,
        interval_length: 30,
        value: point.value
      }));
    
    const normalizedPoints = normalizeAndFilter(rawPoints);
    const validPoints = normalizedPoints.filter(np => np.value !== null);

    if (validPoints.length === 0) return null;

    const values = validPoints.map(np => np.value as number);
    const totalConsumption = values.reduce((sum, val) => sum + val, 0);
    const avgPower = totalConsumption / values.length;
    const maxPower = Math.max(...values);
    const minPower = Math.min(...values);

    // Calculer la répartition par jour de la semaine avec Luxon
    const byDow = bucketByWeekdayStart(normalizedPoints);
    const dayDistribution = Object.entries(byDow).reduce((acc, [dowStr, points]) => {
      const dow = parseInt(dowStr);
      // Convertir Luxon DOW (1-7) vers JS DOW (0-6) pour compatibilité
      const jsDow = dow === 7 ? 0 : dow;
      acc[jsDow] = points.length;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalPoints: data.length,
      validPoints: normalizedPoints.length,
      validPercentage: (normalizedPoints.length / data.length) * 100,
      objectivePercentage: (data.length / 17520) * 100,
      avgPower,
      maxPower,
      minPower,
      totalConsumption,
      dayDistribution
    };
  }, [data]);

  // Gérer la sélection/désélection de tous les jours
  const toggleAllDays = () => {
    if (allSelected) {
      setSelectedDays([]);
      setAllSelected(false);
    } else {
      setSelectedDays(DAYS_OF_WEEK.map(day => day.id));
      setAllSelected(true);
    }
  };

  // Gérer la sélection/désélection d'un jour
  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(id => id !== dayId));
      setAllSelected(false);
    } else {
      const newSelectedDays = [...selectedDays, dayId];
      setSelectedDays(newSelectedDays);
      setAllSelected(newSelectedDays.length === DAYS_OF_WEEK.length);
    }
  };

  // Mettre à jour l'état allSelected lorsque selectedDays change
  useEffect(() => {
    setAllSelected(selectedDays.length === DAYS_OF_WEEK.length);
  }, [selectedDays]);

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      {/* Statistiques résumées */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-blue-600 font-medium">Points de données</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {stats.totalPoints.toLocaleString()}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Objectif: {stats.objectivePercentage.toFixed(1)}% (17,520 points)
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 font-medium">Données valides</p>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {stats.validPoints.toLocaleString()}
            </p>
            <p className="text-xs text-green-500 mt-1">
              {stats.validPercentage.toFixed(1)}% des points reçus
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-purple-600 font-medium">Puissance moyenne</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {stats.avgPower.toFixed(2)} kW
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Max: {stats.maxPower.toFixed(2)} kW | Min: {stats.minPower.toFixed(2)} kW
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-amber-600 font-medium">Répartition hebdomadaire</p>
            </div>
            <p className="text-lg font-bold text-amber-700">
              {Object.keys(stats.dayDistribution).length} jours
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Données sur tous les jours de la semaine
            </p>
          </div>
        </div>
      )}
      
      {/* Légende interactive avec cases à cocher */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            onClick={toggleAllDays}
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">Tout sélectionner</span>
          </div>
          
          {DAYS_OF_WEEK.map(day => (
            <div 
              key={day.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              onClick={() => toggleDay(day.id)}
            >
              {selectedDays.includes(day.id) ? (
                <CheckSquare className="h-4 w-4" style={{ color: day.color }} />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium" style={{ color: selectedDays.includes(day.id) ? day.color : '#6B7280' }}>
                {day.name}
              </span>
              {stats?.dayDistribution[day.id] && (
                <span className="text-xs text-gray-500 ml-1">
                  ({stats.dayDistribution[day.id]} points)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Graphique */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Heure', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 10 }}
              interval={3} // Afficher 1 label sur 4 (toutes les 2 heures)
            />
            <YAxis 
              label={{ value: 'Puissance (kW)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number | null, name: string) => {
                if (value === null || value === undefined) {
                  return ['Pas de données', name];
                }
                return [`${value.toFixed(3)} kW`, name];
              }}
              labelFormatter={(label) => `Heure: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.375rem',
                padding: '8px 12px'
              }}
            />
            <Legend />
            
            {/* Lignes pour chaque jour sélectionné */}
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
              .map((dayName, index) => ({ id: index === 6 ? 0 : index + 1, name: dayName, color: DAYS_OF_WEEK.find(d => d.name === dayName)?.color || '#666' }))
              .filter(day => selectedDays.includes(day.id))
              .map(day => (
              <Line
                key={day.id}
                type="monotone"
                dataKey={day.name}
                name={day.name}
                stroke={day.color}
                strokeWidth={2}
                activeDot={{ r: 4, fill: day.color }}
                dot={false}
                connectNulls={false} // Ne pas connecter les valeurs nulles
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Informations d'analyse comportementale */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Analyse comportementale</h5>
          <div className="space-y-1 text-sm text-blue-700">
            <p>• <strong>Profils week-end vs semaine</strong> : Comparez les habitudes</p>
            <p>• <strong>Pics de consommation</strong> : Identifiez les heures de forte demande</p>
            <p>• <strong>Consommation de base</strong> : Niveau minimal nocturne</p>
            <p>• <strong>Optimisation solaire</strong> : Moments idéaux pour l'autoconsommation</p>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">Utilisation pour l'installation</h5>
          <div className="space-y-1 text-sm text-green-700">
            <p>• <strong>Dimensionnement batterie</strong> : Capacité selon les pics</p>
            <p>• <strong>Pilotage intelligent</strong> : Programmation des équipements</p>
            <p>• <strong>Délestage optimal</strong> : Réduction aux heures de pointe</p>
            <p>• <strong>Autoconsommation</strong> : Maximisation selon les habitudes</p>
          </div>
        </div>
      </div>

      {/* Détail de la répartition par jour (debug) */}
      {stats && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Répartition des données par jour</h5>
          <div className="grid grid-cols-7 gap-2 text-xs">
            {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((dayName, index) => {
              const dayColor = DAYS_OF_WEEK.find(d => d.name === dayName)?.color || '#666';
              return (
              <div key={index} className="text-center">
                <div className="font-medium" style={{ color: dayColor }}>
                  {dayName}
                </div>
                <div className="text-gray-600">
                  {stats.dayDistribution[index] || 0} points
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAveragePowerCurve;