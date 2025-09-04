// src/utils/api/enedisDataFetcher.ts
import { supabase } from '../../lib/supabase';
import type { EnedisDataResponse } from '../../types/enedisData';
  console.info('🟢 Début fetchEnedisData pour PDL ' + prm + ' à ' + new Date().toISOString());
// Fonction principale pour récupérer les données Enedis
  // Vérifier que le PDL est au format correct
  if (!prm || prm.length !== 14 || !/^\d+$/.test(prm)) {
    console.error('❌ PDL invalide:', prm);
    throw new Error('PDL invalide. Le PDL doit comporter 14 chiffres.');
  }

  // Dates de début et fin (dernier mois) - Utiliser une nouvelle instance pour éviter de modifier today
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedStartDate = startDate.toISOString().split('T')[0];

  console.log('Période de récupération:', { startDate: formattedStartDate, endDate });

  try {
    // 1. Récupérer les données de consommation
    // 1. Récupérer les données de consommation
    console.log('⚙️ Appel get_consumption pour PDL=' + prm);
    // Récupérer les données de consommation
    const consumptionData = await getConsumptionData(prm, formattedStartDate, endDate);
    
    // 2. Récupérer la courbe de charge
    // 2. Récupérer la courbe de charge
    console.log('⚙️ Appel get_load_curve pour PDL=' + prm);
    // Récupérer la courbe de charge
    const loadCurveData = await getLoadCurveData(prm, formattedStartDate, endDate);
    
    // 3. Récupérer les informations client
    // 3. Récupérer les informations client
    console.log('⚙️ Appel get_identity pour PDL=' + prm);
    // Récupérer les informations client
    const clientProfile = await getClientProfile(prm);

    // 4. Lire les tables Supabase pour vérifier que les données ont bien été enregistrées
    console.log('Tous les appels Edge terminés, vérification des données dans Supabase');
    
    const [
      { data: dailyConsumption },
      { data: loadCurve },
      { data: clientsIdentities },
      { data: clientsContracts }
      supabase.from('clients_contracts').select('*').eq('usage_point_id', prm)
    ]);
    
    console.log('Résultats des tables Supabase:', {
      dailyConsumption: dailyConsumption?.length || 0,
      loadCurve: loadCurve?.length || 0,
      clientsIdentities: clientsIdentities?.length || 0,
      clientsContracts: clientsContracts?.length || 0
    // 5. Construire l'objet de réponse
    const result: EnedisDataResponse = {
      clientProfile,
      consumptionData: {
        consumption: consumptionData
      },
      loadCurveData: {
        loadCurve: loadCurveData
    console.error('❌ Erreur générale:', error);
    throw error;
  }
    console.log('🏁 Fin fetchEnedisData, résultat final contient:', Object.keys(result));
    return result;
/**
 * Récupère les données de consommation pour une période donnée
 */
async function getConsumptionData(prm: string, startDate: string, endDate: string): Promise<any[]> {
  try {
    const payload = {
      action: 'get_consumption',
      prm,
      startDate,
      endDate
    };
    
    console.log('Appel de la fonction enedis-data avec payload:', payload);
    
    const { data, error } = await supabase.functions.invoke('enedis-data', { 
    
    const { data, error } = await supabase.functions.invoke('enedis-data', { 
      method: 'POST',
      body: payload
    });
    
    if (error) {
      console.error('Erreur lors de l\'appel à enedis-data (get_consumption):', error);
      console.error('Erreur lors de l\'appel à enedis-data (get_consumption):', error);
      throw new Error(`Échec récupération des données de consommation: ${error.message}`);
    }
    
    if (!data || !data.consumption) {
      console.warn('Aucune donnée de consommation reçue');
      console.warn('Aucune donnée de consommation reçue');
      return [];
    }
    
    console.log(`Reçu ${data.consumption.length} points de données de consommation`);
    console.log(`Reçu ${data.consumption.length} points de données de consommation`);
    return data.consumption;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données de consommation:', error);
    return [];
  }
}

/**
 * Récupère la courbe de charge pour une période donnée
 * Utilise la pagination pour récupérer les données par semaine
 */
async function getLoadCurveData(prm: string, startDate: string, endDate: string): Promise<any[]> {
  try {
    console.log('Entering getLoadCurveData', { prm, startDate, endDate });
    
    // Diviser la période en semaines pour éviter les timeouts
    const weeks = splitDateRangeIntoWeeks(startDate, endDate);
    console.log(`Période divisée en ${weeks.length} semaines`);
    
    const allData = [];
    
    // Récupérer les données semaine par semaine
    for (let i = 0; i < weeks.length; i++) {
      const { start, end } = weeks[i];
      console.log(`Récupération semaine ${i+1}/${weeks.length}: ${start} à ${end}`);
      
      const payload = {
        action: 'get_load_curve',
        prm,
        startDate: start,
        endDate: end
      };
      
      console.log('Appel de la fonction enedis-data avec payload:', payload);
      
      console.log('Appel de la fonction enedis-data avec payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: payload
      });
      
      if (error) {
        console.error(`❌ Erreur semaine ${i+1}/${weeks.length}:`, error);
        continue; // Continuer avec la semaine suivante en cas d'erreur
      }
      
      if (data && data.loadCurve && Array.isArray(data.loadCurve)) {
        console.log(`✅ Semaine ${i+1}: ${data.loadCurve.length} points récupérés`);
        allData.push(...data.loadCurve);
      }
      
      // Pause entre les requêtes pour éviter les limitations d'API
      if (i < weeks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Total: ${allData.length} points de courbe de charge récupérés`);
    return allData;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la courbe de charge:', error);
    return [];
  }
}

/**
 * Divise une plage de dates en semaines
 */
function splitDateRangeIntoWeeks(startDate: string, endDate: string): { start: string, end: string }[] {
  const weeks = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    // Calculer la fin de la semaine (6 jours après le début)
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);
    
    // Si la fin de la semaine dépasse la fin de la période, utiliser la fin de la période
    if (currentEnd > end) {
      currentEnd = new Date(end);
    }
    
    weeks.push({
      start: currentStart.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0]
    });
    
    // Passer à la semaine suivante
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  return weeks;
}

/**
 * Récupère le profil client depuis Supabase
 */
async function getClientProfile(prm: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('clients_identity') 
      .select('*')
      .eq('usage_point_id', prm)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erreur lors de la récupération du profil client:', error);
      return null;
    }
    
    if (data) {
      console.log('✅ Profil client récupéré depuis Supabase');
      return {
        ...data,
        usage_point_id: prm
      };
    }
    
    // Si aucun profil n'est trouvé, essayer de le récupérer via l'API
    console.log('⚙️ Appel get_identity pour PDL=' + prm);
    const payload = {
      action: 'get_identity',
      prm
    };
    
    const { data: identityData, error: identityError } = await supabase.functions.invoke('enedis-data', {
      method: 'POST',
      body: payload
    });
    
    if (identityError) {
      console.error('❌ Erreur lors de la récupération de l\'identité:', identityError);
      return null;
    }
    
    if (identityData && identityData.identity) {
      console.log('✅ Identité récupérée via API');
      
      // Récupérer l'adresse
      console.log('⚙️ Appel get_address pour PDL=' + prm);
      const { data: addressData } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: { action: 'get_address', prm }
      });
      
      // Récupérer le contrat
      console.log('⚙️ Appel get_contracts pour PDL=' + prm);
      const { data: contractData } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: { action: 'get_contracts', prm }
      });
      
      // Récupérer le contact
      console.log('⚙️ Appel get_contact pour PDL=' + prm);
      const { data: contactData } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: { action: 'get_contact', prm }
      });
      
      return {
        usage_point_id: prm,
        identity: identityData.identity,
        address: addressData?.address,
        contract: contractData?.contracts,
        contact: contactData?.contact_data
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil client:', error);
    return null;
  }
}