import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';
import { CheckSquare, Square } from 'lucide-react';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number;
  is_off_peak: boolean;
}

interface HourlyConsumptionByWeekdayProps {
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

const HourlyConsumptionByWeekday: React.FC<HourlyConsumptionByWeekdayProps> = ({ 
  data, 
  title = "Courbe de puissances journalière moyenne" 
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>(DAYS_OF_WEEK.map(day => day.id));
  const [allSelected, setAllSelected] = useState(true);

  // Préparer les données pour le graphique
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Grouper les données par jour de la semaine et par heure
    const groupedByDayAndHour: Record<string, Record<string, number[]>> = {};
    
    data.forEach(point => {
      const dateTime = new Date(point.date_time);
      const dayOfWeek = dateTime.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      const hour = dateTime.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!groupedByDayAndHour[dayOfWeek]) {
        groupedByDayAndHour[dayOfWeek] = {};
      }
      
      if (!groupedByDayAndHour[dayOfWeek][hourKey]) {
        groupedByDayAndHour[dayOfWeek][hourKey] = [];
      }
      
      groupedByDayAndHour[dayOfWeek][hourKey].push(point.value);
    });
    
    // Calculer les moyennes par heure pour chaque jour
    const hourlyAverages: Record<string, Record<string, number>> = {};
    
    Object.entries(groupedByDayAndHour).forEach(([dayOfWeek, hours]) => {
      hourlyAverages[dayOfWeek] = {};
      
      Object.entries(hours).forEach(([hour, values]) => {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        hourlyAverages[dayOfWeek][hour] = average;
      });
    });
    
    // Créer les données pour le graphique
    const chartData: { hour: string; [key: string]: any }[] = [];
    
    // Générer toutes les heures de la journée
    for (let h = 0; h < 24; h++) {
      const hourKey = `${h.toString().padStart(2, '0')}:00`;
      const dataPoint: { hour: string; [key: string]: any } = { hour: hourKey };
      
      // Ajouter les valeurs pour chaque jour
      DAYS_OF_WEEK.forEach(day => {
        if (hourlyAverages[day.id] && hourlyAverages[day.id][hourKey] !== undefined) {
          dataPoint[day.name] = hourlyAverages[day.id][hourKey];
        } else {
          dataPoint[day.name] = 0;
        }
      });
      
      chartData.push(dataPoint);
    }
    
    return chartData;
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Légende interactive avec cases à cocher */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <div 
            className="flex items-center gap-1 cursor-pointer"
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
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => toggleDay(day.id)}
            >
              {selectedDays.includes(day.id) ? (
                <CheckSquare className="h-4 w-4" style={{ color: day.color }} />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">{day.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Graphique */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              label={{ value: 'Heure', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [`${value.toFixed(2)} kW`, name]}
              labelFormatter={(label) => `Heure: ${label}`}
            />
            <Legend />
            
            {/* Lignes pour chaque jour sélectionné */}
            {DAYS_OF_WEEK.filter(day => selectedDays.includes(day.id)).map(day => (
              <Line
                key={day.id}
                type="monotone"
                dataKey={day.name}
                name={day.name}
                stroke={day.color}
                activeDot={{ r: 8 }}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Comment lire ce graphique</p>
          <p className="text-xs text-blue-700 mt-1">
            Ce graphique montre la consommation moyenne par heure pour chaque jour de la semaine.
            Vous pouvez sélectionner ou désélectionner des jours pour comparer les profils de consommation.
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Optimisation de la consommation</p>
          <p className="text-xs text-green-700 mt-1">
            Identifiez les périodes de forte consommation et les différences entre jours ouvrés et week-end.
            Cela vous permet d'adapter votre production solaire à votre profil de consommation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HourlyConsumptionByWeekday;