import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts';

interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  date_time: string;
  value: number;
  is_off_peak: boolean;
}

interface DailyConsumptionPatternsProps {
  data: LoadCurvePoint[];
  title?: string;
}

const DailyConsumptionPatterns: React.FC<DailyConsumptionPatternsProps> = ({ data, title = "Profils de consommation journaliers" }) => {
  // Extraire les jours uniques
  const uniqueDates = [...new Set(data.map(point => point.date))];
  
  // Créer un tableau de 24 heures (0-23) pour chaque jour
  const hourlyDataByDay = uniqueDates.map(date => {
    const dayPoints = data.filter(point => point.date === date);
    
    // Grouper par heure
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourPoints = dayPoints.filter(point => {
        const pointHour = new Date(point.date_time).getHours();
        return pointHour === hour;
      });
      
      const avgValue = hourPoints.length > 0 
        ? hourPoints.reduce((sum, point) => sum + point.value, 0) / hourPoints.length 
        : 0;
      
      const isOffPeak = hourPoints.length > 0 
        ? hourPoints.some(point => point.is_off_peak)
        : false;
      
      return {
        hour,
        timeLabel: `${String(hour).padStart(2, '0')}:00`,
        value: avgValue,
        is_off_peak: isOffPeak,
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      };
    });
    
    return {
      date,
      formattedDate: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      dayOfWeek: new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }),
      data: hourlyData,
      totalConsumption: dayPoints.reduce((sum, point) => sum + point.value, 0),
      peakConsumption: Math.max(...dayPoints.map(point => point.value)),
      offPeakConsumption: dayPoints.filter(p => p.is_off_peak).reduce((sum, point) => sum + point.value, 0),
      peakHoursConsumption: dayPoints.filter(p => !p.is_off_peak).reduce((sum, point) => sum + point.value, 0)
    };
  });
  
  // Trier par date
  hourlyDataByDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculer les moyennes par heure tous jours confondus
  const hourlyAverages = Array.from({ length: 24 }, (_, hour) => {
    const hourPoints = data.filter(point => {
      const pointHour = new Date(point.date_time).getHours();
      return pointHour === hour;
    });
    
    const avgValue = hourPoints.length > 0 
      ? hourPoints.reduce((sum, point) => sum + point.value, 0) / hourPoints.length 
      : 0;
    
    const isOffPeak = hourPoints.length > 0 
      ? hourPoints.some(point => point.is_off_peak)
      : false;
    
    return {
      hour,
      timeLabel: `${String(hour).padStart(2, '0')}:00`,
      value: avgValue,
      is_off_peak: isOffPeak
    };
  });
  
  // Calculer les moyennes par jour de la semaine
  const dayOfWeekMap: Record<number, string> = {
    0: 'Dimanche',
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi'
  };
  
  const dayOfWeekData = hourlyDataByDay.reduce((acc, day) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    const dayName = dayOfWeekMap[dayOfWeek];
    
    if (!acc[dayName]) {
      acc[dayName] = {
        dayOfWeek: dayName,
        totalConsumption: 0,
        count: 0,
        dayIndex: dayOfWeek
      };
    }
    
    acc[dayName].totalConsumption += day.totalConsumption;
    acc[dayName].count += 1;
    
    return acc;
  }, {} as Record<string, { dayOfWeek: string, totalConsumption: number, count: number, dayIndex: number }>);
  
  const dayOfWeekAverages = Object.values(dayOfWeekData).map(day => ({
    dayOfWeek: day.dayOfWeek,
    averageConsumption: day.totalConsumption / day.count,
    dayIndex: day.dayIndex
  })).sort((a, b) => a.dayIndex - b.dayIndex);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        {/* Profil de consommation moyen par heure */}
        <h4 className="text-md font-medium text-gray-800 mb-3">Profil de consommation moyen par heure</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyAverages}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barSize={15}
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
                formatter={(value: number) => `${value.toFixed(2)} kW`}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Puissance moyenne" 
                fill={(entry) => entry.is_off_peak ? '#14B8A6' : '#4F46E5'}
              />
              {/* Ajouter des lignes de référence pour les heures creuses */}
              {hourlyAverages
                .filter(hour => hour.is_off_peak)
                .map(hour => (
                  <ReferenceLine 
                    key={hour.hour} 
                    x={hour.timeLabel} 
                    stroke="#14B8A6" 
                    strokeDasharray="3 3" 
                  />
                ))
              }
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Consommation moyenne par jour de la semaine */}
        <h4 className="text-md font-medium text-gray-800 mb-3 mt-6">Consommation par jour de la semaine</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dayOfWeekAverages}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dayOfWeek" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)} kWh`}
                labelFormatter={(label) => `Jour: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="averageConsumption" 
                name="Consommation moyenne" 
                fill={(entry) => entry.dayIndex === 0 || entry.dayIndex === 6 ? '#14B8A6' : '#4F46E5'}
              />
              {/* Ajouter des lignes de référence pour le weekend */}
              <ReferenceLine x="Samedi" stroke="#14B8A6" strokeDasharray="3 3" />
              <ReferenceLine x="Dimanche" stroke="#14B8A6" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Profils journaliers individuels */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profils journaliers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hourlyDataByDay.slice(0, 4).map(day => (
            <div key={day.date} className="border rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">
                {day.formattedDate} ({day.dayOfWeek})
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Total: {day.totalConsumption.toFixed(2)} kWh | 
                Pic: {day.peakConsumption.toFixed(2)} kW
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={day.data}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timeLabel" 
                      tick={{ fontSize: 10 }}
                      interval={3}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(2)} kW`}
                      labelFormatter={(label) => `Heure: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Puissance" 
                      stroke="#8884d8" 
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    {/* Ajouter des lignes de référence pour les heures creuses */}
                    {day.data
                      .filter(hour => hour.is_off_peak)
                      .map(hour => (
                        <ReferenceLine 
                          key={hour.hour} 
                          x={hour.timeLabel} 
                          stroke="#14B8A6" 
                          strokeDasharray="3 3" 
                        />
                      ))
                    }
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyConsumptionPatterns;