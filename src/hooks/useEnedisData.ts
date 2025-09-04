import { DateTime } from 'luxon';
import { useState, useEffect } from 'react';
import type { EnedisDataResponse } from '../types/enedisData';
import { getEnedisApi } from '../utils/api/enedisApiFactory';
import { supabase } from '../lib/supabase';

// Types d'entrée/sortie pour la normalisation Enedis (IDENTIQUES à l'Edge Function)
export type RawPoint = {
  date: string;              // horodatage **de fin** d'intervalle Enedis, ex "2025-07-10 00:30:00"
  interval_length: number;   // 10 | 15 | 30 | 60 (minutes)
  value: number | null;      // W (load curve)
};

export type NormPoint = {
  start: DateTime;           // début d'intervalle en Europe/Paris
  end: DateTime;             // fin d'intervalle en Europe/Paris
  value: number | null;
};

const PARIS_ZONE = 'Europe/Paris';

// Parse robuste du champ "date" Enedis (fin d'intervalle) → Luxon en Europe/Paris
export function parseEnedisEnd(dateStr: string): DateTime {
  // format le plus courant côté Enedis : "yyyy-MM-dd HH:mm:ss"
  const dt = DateTime.fromFormat(dateStr, 'yyyy-LL-dd HH:mm:ss', { zone: PARIS_ZONE });
  return dt.isValid ? dt : DateTime.fromISO(dateStr, { zone: PARIS_ZONE });
}

// Transforme un RawPoint en NormPoint, calcule le **début** d'intervalle
export function toParisStart(p: RawPoint): NormPoint {
  const end = parseEnedisEnd(p.date);
  const start = end.minus({ minutes: p.interval_length || 30 }).setZone(PARIS_ZONE);
  return { start, end, value: p.value };
}

// Borne J-2 (on garde **uniquement** les points dont le **début** est ≤ cutoff)
export function getJ2Cutoff(): DateTime {
  return DateTime.now().setZone(PARIS_ZONE).startOf('day').minus({ days: 2 }).endOf('day');
}

// Filtre J-2 et normalise
export function normalizeAndFilter(points: RawPoint[]): NormPoint[] {
  const cutoff = getJ2Cutoff();
  const out: NormPoint[] = [];
  for (const p of points) {
    const np = toParisStart(p);
    if (np.start <= cutoff) out.push(np);
  }
  return out;
}

// Bucket par jour de semaine **à partir du début d'intervalle**
// 1 = Lundi … 7 = Dimanche (ISO)
export function bucketByWeekdayStart(points: NormPoint[]): Record<number, NormPoint[]> {
  const buckets: Record<number, NormPoint[]> = { 1:[],2:[],3:[],4:[],5:[],6:[],7:[] };
  for (const np of points) buckets[np.start.weekday].push(np);
  return buckets;
}

// Helper pour la complétude par DOW
export function completenessByDow(byDow: Record<number, NormPoint[]>) {
  const res: Record<number, {count: number; minHH: string; maxHH: string}> = {};
  for (let d=1; d<=7; d++) {
    const arr = byDow[d].slice().sort((a,b) => a.start.toMillis() - b.start.toMillis());
    const minHH = arr.length ? arr[0].start.toFormat('HH:mm') : '—';
    const maxHH = arr.length ? arr[arr.length-1].start.toFormat('HH:mm') : '—';
    res[d] = { count: arr.length, minHH, maxHH };
  }
  return res;
}

export function useEnedisData() {
  const enedisApi = getEnedisApi();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<EnedisDataResponse | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(Date.now());
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(
    typeof window !== 'undefined' && window.location.hostname.includes('webcontainer-api.io')
  );
  const [supabaseConsumptionData, setSupabaseConsumptionData] = useState<any[]>([]);

  // Nouvelles variables pour l'approche directe
  const [directConsumptionData, setDirectConsumptionData] = useState<any[]>([]);
  const [directLoadCurveData, setDirectLoadCurveData] = useState<any[]>([]);

  // NOUVELLE APPROCHE : Données directes pour affichage immédiat
  const [displayConsumptionData, setDisplayConsumptionData] = useState<any[]>([]);
  const [displayLoadCurveData, setDisplayLoadCurveData] = useState<any[]>([]);
  const [displayMaxPowerData, setDisplayMaxPowerData] = useState<any[]>([]);

  const defaultAutoconsommation = 75;

  // Fonction pour lire les données de consommation depuis Supabase
  const queryConsumption = async (prm: string, startDate: string, endDate: string) => {
    try {
      console.log('🔍 Lecture des données de consommation depuis Supabase...');
      console.log('Filtres:', { prm, startDate, endDate });
      
      const { data, error } = await supabase
        .from('consumption_data')
        .select('*')
        .eq('prm', prm)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('❌ Erreur lecture Supabase:', error);
        throw error;
      }
      
      console.log('✅ Données récupérées depuis Supabase:', data?.length || 0, 'lignes');
      console.log('📊 Échantillon des données:', data?.slice(0, 3));
      
      setSupabaseConsumptionData(data || []);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur dans queryConsumption:', error);
      setSupabaseConsumptionData([]);
      return [];
    }
  };
  // Fonction pour mettre à jour l'état de chargement d'une section spécifique
  const setLoading = (section: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [section]: isLoading
    }));
  };

  // Vérifier si une section spécifique est en cours de chargement
  const isSectionLoading = (section: string) => {
    return loadingStates[section] || false;
  };

  // Fonction pour récupérer les données d'identité depuis Supabase
  const fetchIdentityData = async (pdl: string): Promise<any> => {
    try {
      setLoading('identity', true);
      const { data, error } = await supabase
        .from('clients_identity')
        .select('identity')
        .eq('usage_point_id', pdl)
        .maybeSingle();

      if (error) {
        console.error('Error fetching identity data:', error);
        throw new Error(`Erreur lors de la récupération des données d'identité: ${error.message}`);
      }

      if (data && data.identity) {
        console.log('Identity data found in Supabase:', data.identity);
        setLoading('identity', false);
        return data.identity;
      } else {
        console.log('No identity data found in Supabase for PDL:', pdl);
        setLoading('identity', false);
        return null;
      }
    } catch (err) {
      console.error('Error in fetchIdentityData:', err);
      setLoading('identity', false);
      throw err;
    }
  };

  // Fonction pour récupérer les données d'adresse depuis Supabase
  const fetchAddressData = async (pdl: string): Promise<any> => {
    try {
      setLoading('address', true);
      const { data, error } = await supabase
        .from('clients_addresses')
        .select('address')
        .eq('usage_point_id', pdl)
        .maybeSingle();

      if (error) {
        console.error('Error fetching address data:', error);
        throw new Error(`Erreur lors de la récupération des données d'adresse: ${error.message}`);
      }

      if (data && data.address) {
        console.log('Address data found in Supabase:', data.address);
        setLoading('address', false);
        return data.address;
      } else {
        console.log('No address data found in Supabase for PDL:', pdl);
        setLoading('address', false);
        return null;
      }
    } catch (err) {
      console.error('Error in fetchAddressData:', err);
      setLoading('address', false);
      throw err;
    }
  };

  // Fonction pour récupérer les données de contrat depuis Supabase
  const fetchContractData = async (pdl: string): Promise<any> => {
    try {
      setLoading('contract', true);
      const { data, error } = await supabase
        .from('clients_contracts')
        .select('contract')
        .eq('usage_point_id', pdl)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contract data:', error);
        throw new Error(`Erreur lors de la récupération des données de contrat: ${error.message}`);
      }

      if (data && data.contract) {
        console.log('Contract data found in Supabase:', data.contract);
        setLoading('contract', false);
        return data.contract;
      } else {
        console.log('No contract data found in Supabase for PDL:', pdl);
        setLoading('contract', false);
        return null;
      }
    } catch (err) {
      console.error('Error in fetchContractData:', err);
      setLoading('contract', false);
      throw err;
    }
  };

  // Fonction pour récupérer les données de contact depuis Supabase
  const fetchContactData = async (pdl: string): Promise<any> => {
    try {
      setLoading('contact', true);
      const { data, error } = await supabase
        .from('clients_contacts')
        .select('contact_data')
        .eq('usage_point_id', pdl)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contact data:', error);
        throw new Error(`Erreur lors de la récupération des données de contact: ${error.message}`);
      }

      if (data && data.contact_data) {
        console.log('Contact data found in Supabase:', data.contact_data);
        setLoading('contact', false);
        return data.contact_data;
      } else {
        console.log('No contact data found in Supabase for PDL:', pdl);
        setLoading('contact', false);
        return null;
      }
    } catch (err) {
      console.error('Error in fetchContactData:', err);
      setLoading('contact', false);
      throw err;
    }
  };

  // Fonction pour récupérer les données de consommation
  const getConsumptionData = async (prm: string): Promise<any[]> => {
    try {
      setLoading('consumption', true);
      console.log('🔄 Début récupération données de consommation pour PDL:', prm);
      
      // Utiliser Luxon pour une gestion correcte des fuseaux horaires
      const nowParis = DateTime.now().setZone('Europe/Paris');
      const endDate = nowParis.minus({ days: 2 }).endOf('day'); // J-2 pour éviter les données incomplètes
      const startDate = endDate.minus({ days: 364 }).startOf('day'); // 365 jours inclusifs
      
      const formattedStartDate = startDate.toFormat('yyyy-MM-dd');
      const formattedEndDate = endDate.toFormat('yyyy-MM-dd');
      
      console.log(`📅 PÉRIODE CONSOMMATION (365 jours, exclusion J-2): ${formattedStartDate} au ${formattedEndDate}`);
      console.log(`🕐 Fuseau horaire: Europe/Paris, cutoff: ${endDate.toISO()}`);
      
      // Appeler la fonction Edge get_consumption
      const { data, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: {
          action: 'get_consumption',
          prm,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      
      if (error) {
        console.error('❌ Erreur lors de l\'appel à get_consumption:', error);
        throw new Error(`Échec récupération des données de consommation: ${error.message}`);
      }
      
      console.log('📦 RÉPONSE BRUTE COMPLÈTE:', JSON.stringify(data, null, 2));
      
      // APPROCHE DIRECTE : Utiliser directement les données de la réponse
      if (data && data.data && Array.isArray(data.data)) {
        console.log('✅ DONNÉES REÇUES DIRECTEMENT:', data.data.length, 'points');
        console.log('📊 ÉCHANTILLON COMPLET:', JSON.stringify(data.data.slice(0, 3), null, 2));
        
        // SOLUTION DIRECTE : Stocker pour affichage immédiat
        const formattedData = data.data.map((item: any) => ({
          date: item.date,
          peak_hours: item.peak_hours || 0,
          off_peak_hours: item.off_peak_hours || 0,
          total: (item.peak_hours || 0) + (item.off_peak_hours || 0)
        }));
        
        setDirectConsumptionData(formattedData);
        setDisplayConsumptionData(formattedData);
        
        console.log('🎯 DONNÉES FORMATÉES POUR GRAPHIQUE:', JSON.stringify(formattedData, null, 2));
        setLoading('consumption', false);
        return formattedData;
      } else {
        console.warn('⚠️ FORMAT INATTENDU - RÉPONSE COMPLÈTE:', JSON.stringify(data, null, 2));
        setDisplayConsumptionData([]);
        setDirectConsumptionData([]);
        setLoading('consumption', false);
        return [];
      }
      
    } catch (error) {
      console.error('❌ ERREUR COMPLÈTE:', error);
      setLoading('consumption', false);
      setDisplayConsumptionData([]);
      setDirectConsumptionData([]);
      return [];
    }
  };

  // Fonction pour récupérer la courbe de charge
  const getLoadCurveData = async (prm: string): Promise<any[]> => {
    try {
      setLoading('loadCurve', true);
      console.log(`🔄 Début récupération courbe de charge annuelle pour ${prm} (365 jours) - Version Luxon corrigée`);
      
      // Calculer les dates pour les 365 derniers jours avec Luxon
      const nowParis = DateTime.now().setZone(PARIS_ZONE);
      const endDate = nowParis.minus({ days: 2 }).endOf('day'); // J-2 pour éviter les données incomplètes
      const startDate = endDate.minus({ days: 364 }).startOf('day'); // 365 jours inclusifs
      
      const formattedStartDate = startDate.toFormat('yyyy-MM-dd');
      const formattedEndDate = endDate.toFormat('yyyy-MM-dd');
      
      console.log(`📅 Période courbe de charge annuelle (J-2 exclusion): ${formattedStartDate} au ${formattedEndDate}`);
      console.log(`🕐 Fuseau horaire: ${PARIS_ZONE}, cutoff: ${endDate.toISO()}`);
      
      // Découper en tranches de 7 jours côté front
      const chunks = [];
      let currentStart = startDate;
      
      while (currentStart <= endDate) {
        let currentEnd = currentStart.plus({ days: 6 }); // +6 jours pour faire 7 jours au total
        
        // Si la fin dépasse la date de fin globale, ajuster
        if (currentEnd > endDate) {
          currentEnd = endDate;
        }
        
        chunks.push({
          start: currentStart.toFormat('yyyy-MM-dd'),
          end: currentEnd.toFormat('yyyy-MM-dd')
        });
        
        // Passer à la tranche suivante
        currentStart = currentEnd.plus({ days: 1 });
      }
      
      console.log(`📊 ${chunks.length} tranches de 7 jours générées`);
      
      // Récupérer les données pour chaque tranche
      const allLoadCurveData = [];
      let successfulChunks = 0;
      let failedChunks = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔄 Tranche ${i + 1}/${chunks.length}: ${chunk.start} au ${chunk.end}`);
        
        try {
          // Appeler l'Edge Function get_load_curve pour cette tranche
          const { data, error } = await supabase.functions.invoke('enedis-data', {
            method: 'POST',
            body: {
              action: 'get_load_curve',
              prm,
              startDate: chunk.start,
              endDate: chunk.end
            }
          });
          
          if (error) {
            console.error(`❌ Erreur tranche ${i + 1}:`, error);
            failedChunks++;
            continue; // Continuer avec la tranche suivante
          }
          
          if (data && data.data && Array.isArray(data.data)) {
            console.log(`✅ Tranche ${i + 1}: ${data.data.length} points récupérés`);
            allLoadCurveData.push(...data.data);
            successfulChunks++;
          } else {
            console.warn(`⚠️ Tranche ${i + 1}: format de données inattendu`);
            failedChunks++;
          }
          
          // Délai entre les tranches pour éviter le rate-limit
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de la tranche ${i + 1}:`, error);
          failedChunks++;
          continue; // Continuer avec la tranche suivante
        }
      }
      
      console.log(`🎯 RÉSULTATS: ${allLoadCurveData.length} points récupérés`);
      console.log(`📊 Tranches réussies: ${successfulChunks}/${chunks.length} (${Math.round(successfulChunks/chunks.length*100)}%)`);
      console.log(`❌ Tranches échouées: ${failedChunks}/${chunks.length}`);
      console.log(`📈 Attendu: ~17,520 points (365×48), Reçu: ${allLoadCurveData.length} points`);
      console.log(`📊 Couverture: ${((allLoadCurveData.length / 17520) * 100).toFixed(1)}%`);
      
      // NOUVELLE NORMALISATION avec Luxon et début d'intervalle
      console.log('🔧 Début normalisation avec Luxon...');
      
      // Convertir en RawPoint pour normalisation
      const rawPoints: RawPoint[] = allLoadCurveData.map((item: any) => ({
        date: item.date_time, // Fin d'intervalle Enedis
        interval_length: 30,  // Supposer 30min par défaut
        value: item.value
      }));
      
      // Normaliser et filtrer avec J-2
      const normalizedPoints = normalizeAndFilter(rawPoints);
      console.log(`🔧 Normalisation terminée: ${normalizedPoints.length} points après filtre J-2`);
      
      // Grouper par jour de semaine avec début d'intervalle
      const byDow = bucketByWeekdayStart(normalizedPoints);
      const qa = completenessByDow(byDow);
      
      // Logs QA détaillés
      console.log('[ENEDIS][J2 cutoff]', getJ2Cutoff().toISO(), 'zone=Europe/Paris');
      for (let d=1; d<=7; d++) {
        const {count, minHH, maxHH} = qa[d];
        const dayName = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][d];
        console.log(`[ENEDIS][DOW=${d}] ${dayName}: count=${count} min=${minHH} max=${maxHH}`);
      }
      
      // Formatage final pour l'affichage
      const formattedLoadCurve = normalizedPoints.map((np: NormPoint) => ({
        prm: prm,
        date: np.start.toFormat('yyyy-MM-dd'),
        time: np.start.toFormat('HH:mm'),
        date_time: np.start.toISO(),
        value: np.value || 0,
        is_off_peak: false // À déterminer selon les heures creuses
      }));
      
      // Enregistrement final des données
      setDirectLoadCurveData(formattedLoadCurve);
      setDisplayLoadCurveData(formattedLoadCurve);
      
      console.log('🎯 COURBE DE CHARGE ANNUELLE COMPLÈTE:', formattedLoadCurve.length, 'points formatés');
      
      setLoading('annualLoadCurve', false);
      return formattedLoadCurve;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la courbe de charge annuelle:', error);
      setDisplayLoadCurveData([]);
      setDirectLoadCurveData([]);
      setLoading('annualLoadCurve', false);
      throw error;
    }
  };

  // Fonction pour récupérer les données de puissance max
  const getMaxPowerData = async (prm: string): Promise<any[]> => {
    try {
      setLoading('maxPower', true);
      console.log('🔄 Début récupération données de puissance max pour PDL:', prm);
      
      // Utiliser Luxon pour une gestion correcte des fuseaux horaires
      const nowParis = DateTime.now().setZone('Europe/Paris');
      const endDate = nowParis.minus({ days: 2 }).endOf('day'); // J-2 pour éviter les données incomplètes
      const startDate = endDate.minus({ days: 364 }).startOf('day'); // 365 jours inclusifs
      
      const formattedStartDate = startDate.toFormat('yyyy-MM-dd');
      const formattedEndDate = endDate.toFormat('yyyy-MM-dd');
      
      console.log(`📅 PÉRIODE PUISSANCE MAX (365 jours, exclusion J-2): ${formattedStartDate} au ${formattedEndDate}`);
      
      // Appeler la fonction Edge get_max_power
      const { data, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: {
          action: 'get_max_power',
          prm,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      
      if (error) {
        console.error('❌ Erreur lors de l\'appel à get_max_power:', error);
        throw new Error(`Échec récupération des données de puissance max: ${error.message}`);
      }
      
      if (data && data.data && Array.isArray(data.data)) {
        console.log('✅ DONNÉES PUISSANCE MAX REÇUES:', data.data.length, 'points');
        
        // Formatage des données - vérifier si conversion W → kW est nécessaire
        const formattedData = data.data.map((item: any) => ({
          date: item.date,
          max_power: item.max_power ? (item.max_power > 100 ? item.max_power / 1000 : item.max_power) : 0, // Conversion intelligente W → kW
          time_max_power: item.time_max_power || '00:00'
        }));
        
        console.log('🎯 DONNÉES PUISSANCE MAX FORMATÉES:', formattedData.length, 'points');
        console.log('📊 ÉCHANTILLON PUISSANCE MAX:', JSON.stringify(formattedData.slice(0, 3), null, 2));
        setDisplayMaxPowerData(formattedData);
        setLoading('maxPower', false);
        return formattedData;
      } else {
        console.warn('⚠️ FORMAT PUISSANCE MAX INATTENDU:', data);
        setLoading('maxPower', false);
        return [];
      }
      
    } catch (error) {
      console.error('❌ ERREUR PUISSANCE MAX:', error);
      setLoading('maxPower', false);
      return [];
    }
  };

  // Fonction pour récupérer la courbe de charge annuelle
  const getAnnualLoadCurveData = async (prm: string): Promise<any[]> => {
    try {
      setLoading('annualLoadCurve', true);
      console.log(`🔄 Début récupération courbe de charge annuelle pour ${prm} (365 jours) - Version Luxon timezone corrigée`);
      
      // Utiliser Luxon pour une gestion correcte des fuseaux horaires
      const nowParis = DateTime.now().setZone(PARIS_ZONE);
      const endDate = nowParis.minus({ days: 2 }).endOf('day'); // J-2 pour éviter les données incomplètes
      const startDate = endDate.minus({ days: 364 }).startOf('day'); // 365 jours inclusifs
      
      const formattedStartDate = startDate.toFormat('yyyy-MM-dd');
      const formattedEndDate = endDate.toFormat('yyyy-MM-dd');
      
      console.log(`📅 Période courbe de charge annuelle (J-2 exclusion): ${formattedStartDate} au ${formattedEndDate}`);
      console.log(`🕐 Fuseau horaire: ${PARIS_ZONE}, cutoff: ${endDate.toISO()}`);
      
      // Découper en tranches de 7 jours côté front
      const chunks = [];
      let currentStart = startDate;
      
      while (currentStart <= endDate) {
        let currentEnd = currentStart.plus({ days: 6 }); // +6 jours pour faire 7 jours au total
        
        // Si la fin dépasse la date de fin globale, ajuster
        if (currentEnd > endDate) {
          currentEnd = endDate;
        }
        
        chunks.push({
          start: currentStart.toFormat('yyyy-MM-dd'),
          end: currentEnd.toFormat('yyyy-MM-dd')
        });
        
        // Passer à la tranche suivante
        currentStart = currentEnd.plus({ days: 1 });
      }
      
      console.log(`📊 ${chunks.length} tranches de 7 jours générées`);
      
      // Récupérer les données pour chaque tranche
      const allLoadCurveData = [];
      let successfulChunks = 0;
      let failedChunks = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔄 Tranche ${i + 1}/${chunks.length}: ${chunk.start} au ${chunk.end}`);
        
        // Mise à jour progressive plus réaliste de la progression
        const chunkProgress = 40 + Math.round((i / chunks.length) * 55); // De 40% à 95%
        setProgress(chunkProgress);
        setStage(`Récupération courbe de charge (${i + 1}/${chunks.length})`);
        try {
          // Appeler l'Edge Function get_load_curve pour cette tranche
          const { data, error } = await supabase.functions.invoke('enedis-data', {
            method: 'POST',
            body: {
              action: 'get_annual_load_curve',
              prm,
              startDate: chunk.start,
              endDate: chunk.end
            }
          });
          
          if (error) {
            console.error(`❌ Erreur tranche ${i + 1}:`, error);
            failedChunks++;
            continue; // Continuer avec la tranche suivante
          }
          
          if (data && data.data && Array.isArray(data.data)) {
            console.log(`✅ Tranche ${i + 1}: ${data.data.length} points récupérés`);
            allLoadCurveData.push(...data.data);
            successfulChunks++;
            
            // Mise à jour progressive (optionnel)
            const formattedData = allLoadCurveData.map((item: any) => ({
              prm: item.prm,
              date: item.date,
              time: item.time,
              date_time: item.date_time,
              value: item.value || 0,
              is_off_peak: item.is_off_peak || false
            }));
            
            setDirectLoadCurveData(formattedData);
            setDisplayLoadCurveData(formattedData);
          } else {
            console.warn(`⚠️ Tranche ${i + 1}: format de données inattendu`);
            failedChunks++;
          }
          
          // Délai entre les tranches pour éviter le rate-limit
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Réduit à 200ms
          }
          
        } catch (chunkError) {
          console.error(`❌ Erreur lors du traitement de la tranche ${i + 1}:`, chunkError);
          failedChunks++;
          continue; // Continuer avec la tranche suivante
        }
      }
      
      setProgress(95);
      setStage('Traitement des données récupérées');
      
      console.log(`🎯 RÉSULTATS: ${allLoadCurveData.length} points récupérés`);
      console.log(`📊 Tranches réussies: ${successfulChunks}/${chunks.length} (${Math.round(successfulChunks/chunks.length*100)}%)`);
      console.log(`❌ Tranches échouées: ${failedChunks}/${chunks.length}`);
      console.log(`📈 Attendu: ~17,520 points (365×48), Reçu: ${allLoadCurveData.length} points`);
      console.log(`📊 Couverture: ${((allLoadCurveData.length / 17520) * 100).toFixed(1)}%`);
      
      // NOUVELLE NORMALISATION avec Luxon et début d'intervalle
      console.log('🔧 Début normalisation avec Luxon...');
      
      // Convertir en RawPoint pour normalisation
      const rawPoints: RawPoint[] = allLoadCurveData.map((item: any) => ({
        date: item.date_time, // Fin d'intervalle Enedis
        interval_length: 30,  // Supposer 30min par défaut
        value: item.value
      }));
      
      // Normaliser et filtrer avec J-2
      const normalizedPoints = normalizeAndFilter(rawPoints);
      console.log(`🔧 Normalisation terminée: ${normalizedPoints.length} points après filtre J-2`);
      
      // Grouper par jour de semaine avec début d'intervalle
      const byDow = bucketByWeekdayStart(normalizedPoints);
      const qa = completenessByDow(byDow);
      
      // Logs QA détaillés
      console.log('[ENEDIS][J2 cutoff]', getJ2Cutoff().toISO(), 'zone=Europe/Paris');
      for (let d=1; d<=7; d++) {
        const {count, minHH, maxHH} = qa[d];
        const dayName = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][d];
        console.log(`[ENEDIS][DOW=${d}] ${dayName}: count=${count} min=${minHH} max=${maxHH}`);
      }
      
      // Formatage final pour l'affichage
      const formattedLoadCurve = normalizedPoints.map((np: NormPoint) => ({
        prm: prm,
        date: np.start.toFormat('yyyy-MM-dd'),
        time: np.start.toFormat('HH:mm'),
        date_time: np.start.toISO(),
        value: np.value || 0,
        is_off_peak: false // À déterminer selon les heures creuses
      }));
      
      // Enregistrement final des données
      setDirectLoadCurveData(formattedLoadCurve);
      setDisplayLoadCurveData(formattedLoadCurve);
      
      console.log('🎯 COURBE DE CHARGE ANNUELLE COMPLÈTE:', formattedLoadCurve.length, 'points formatés');
      
      setLoading('annualLoadCurve', false);
      return formattedLoadCurve;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la courbe de charge annuelle:', error);
      setDisplayLoadCurveData([]);
      setDirectLoadCurveData([]);
      setLoading('annualLoadCurve', false);
      throw error;
    }
  };

  // Fonction principale pour récupérer toutes les données en une seule fois
  const fetchAllData = async (prm: string) => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setSuccess(null);
    setData(null);
    setDataSource(null);
    setStage('Initialisation');
    
    if (!prm || prm.length !== 14 || !/^\d{14}$/.test(prm)) {
      setError('PDL invalide. Le PDL doit comporter 14 chiffres.');
      setIsLoading(false);
      return;
    }

    try {
      setStage('Récupération des données depuis Supabase');
      setProgress(5);
      
      // Appeler toutes les actions Enedis pour récupérer et stocker les données
      console.log('🔄 Appel de toutes les actions Enedis pour récupération complète');
      
      // 1. Récupérer l'identité
      setStage('Récupération de l\'identité client');
      setProgress(2);
      let identityData = null;
      try {
        const { data: identityResponse, error: identityError } = await supabase.functions.invoke('enedis-data', {
          method: 'POST',
          body: { action: 'get_identity', prm }
        });
        if (!identityError && identityResponse?.data) {
          identityData = identityResponse.data;
          console.log('✅ Identité récupérée');
        }
      } catch (err) {
        console.warn('⚠️ Erreur récupération identité:', err);
      }
      
      // 2. Récupérer l'adresse
      setStage('Récupération de l\'adresse client');
      setProgress(4);
      let addressData = null;
      try {
        const { data: addressResponse, error: addressError } = await supabase.functions.invoke('enedis-data', {
          method: 'POST',
          body: { action: 'get_address', prm }
        });
        if (!addressError && addressResponse?.data) {
          addressData = addressResponse.data;
          console.log('✅ Adresse récupérée');
        }
      } catch (err) {
        console.warn('⚠️ Erreur récupération adresse:', err);
      }
      
      // 3. Récupérer les contrats
      setStage('Récupération des contrats client');
      setProgress(6);
      let contractData = null;
      try {
        const { data: contractResponse, error: contractError } = await supabase.functions.invoke('enedis-data', {
          method: 'POST',
          body: { action: 'get_contracts', prm }
        });
        if (!contractError && contractResponse?.data) {
          contractData = contractResponse.data;
          console.log('✅ Contrats récupérés');
        }
      } catch (err) {
        console.warn('⚠️ Erreur récupération contrats:', err);
      }
      
      // 4. Récupérer les contacts
      setStage('Récupération des contacts client');
      setProgress(8);
      let contactData = null;
      try {
        const { data: contactResponse, error: contactError } = await supabase.functions.invoke('enedis-data', {
          method: 'POST',
          body: { action: 'get_contact', prm }
        });
        if (!contactError && contactResponse?.data) {
          contactData = contactResponse.data;
          console.log('✅ Contact récupéré');
        }
      } catch (err) {
        console.warn('⚠️ Erreur récupération contact:', err);
      }

      setProgress(10);
      setStage('Récupération des données de consommation annuelle');

      // Essayer de récupérer les données de consommation
      let consumptionData = [];
      try {
        consumptionData = await getConsumptionData(prm);
        console.log('📊 Données de consommation finales:', consumptionData.length, 'points');
      } catch (consError) {
        console.warn('Erreur lors de la récupération des données de consommation:', consError);
      }

      setProgress(25);
      setStage('Récupération des données de puissance max');

      // Essayer de récupérer les données de puissance max
      let maxPowerData = [];
      try {
        maxPowerData = await getMaxPowerData(prm);
        console.log('📊 Données de puissance max finales:', maxPowerData.length, 'points');
      } catch (maxPowerError) {
        console.warn('Erreur lors de la récupération des données de puissance max:', maxPowerError);
      }

      setProgress(40);
      setStage('Récupération de la courbe de charge annuelle');

      // Essayer de récupérer la courbe de charge annuelle
      let annualLoadCurveData = [];
      try {
        annualLoadCurveData = await getAnnualLoadCurveData(prm);
        console.log('📊 Courbe de charge annuelle finale:', annualLoadCurveData.length, 'points');
      } catch (annualLoadError) {
        console.warn('Erreur lors de la récupération de la courbe de charge annuelle:', annualLoadError);
      }

      setProgress(100);
      setStage('Finalisation');

      // Construire l'objet de réponse
      const result: EnedisDataResponse = {
        clientProfile: {
          usage_point_id: prm,
          identity: identityData,
          address: addressData,
          contract: contractData,
          contact: contactData
        },
        consumptionData: {
          consumption: consumptionData
        },
        loadCurveData: {
          loadCurve: annualLoadCurveData
        }
      };

      setData(result);
      setDataSource('Supabase + API Enedis');
      setSuccess('Toutes les données ont été récupérées avec succès');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des données');
    } finally {
      setIsLoading(false);
      setStage('');
    }
  };

  // Fonction pour réessayer le chargement des données
  const retryFetchAllData = (prm: string) => {
    setError(null);
    fetchAllData(prm);
  };

  // Retourner les données et fonctions
  return { 
    data, 
    isLoading, 
    loadingStates,
    isSectionLoading,
    error,
    success,
    setError,
    setSuccess,
    dataSource,
    progress,
    stage,
    fetchAllData,
    retryFetchAllData,
    cacheTimestamp,
    supabaseConsumptionData,
    queryConsumption,
    // Nouvelles données directes
    directConsumptionData,
    directLoadCurveData,
    // DONNÉES POUR AFFICHAGE DIRECT
    displayConsumptionData,
    displayLoadCurveData,
    displayMaxPowerData,
    getMaxPowerData,
    getAnnualLoadCurveData
  };
}