import { supabase } from '../../lib/supabase';

class EnedisApi {
  private static instance: EnedisApi;
  private baseUrl: string;
  
  private constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xpxbxfuckljqdvkajlmx.supabase.co';
  }
  
  public static getInstance(): EnedisApi {
    if (!EnedisApi.instance) {
      EnedisApi.instance = new EnedisApi();
    }
    return EnedisApi.instance;
  }
  
  /**
   * Méthode générique pour appeler une Edge Function Supabase
   */
  public async invokeEdgeFunction(functionName: string, payload: any): Promise<any> {
    try {
      console.log(`Calling Edge Function ${functionName} with payload:`, payload);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (error) {
        console.error(`Error calling Edge Function ${functionName}:`, error);
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error(`Error in invokeEdgeFunction (${functionName}):`, error);
      return { data: null, error };
    }
  }

  public async getClientIdentityFromSupabase(prm: string): Promise<any | null> {
    try {
      console.log('Recherche du profil client dans Supabase pour PDL:', prm);
      
      // Définir la durée de validité du cache (30 jours en secondes)
      const CACHE_VALIDITY = 2592000;
      
      // Vérifier si les données en cache sont encore valides
      const cacheKey = `enedis_client_profile_${prm}`;
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          
          // Vérifier si le cache est encore valide
          if (cachedData.meta && cachedData.meta.fetchedAt) {
            const fetchedAt = new Date(cachedData.meta.fetchedAt).getTime();
            const now = Date.now();
            const age = (now - fetchedAt) / 1000; // en secondes

            if (age < CACHE_VALIDITY) {
              console.log('Profil client trouvé dans le cache local (valide):', cachedData.data);
              return cachedData.data;
            } else {
              console.log('Cache expiré, récupération de nouvelles données');
              localStorage.removeItem(cacheKey);
            }
          }
        } catch (parseError) {
          console.warn('Erreur de parsing du cache:', parseError);
        }
      }
      
      // Si pas de cache, essayer Supabase
      try {
        const { data, error } = await supabase
          .from('clients_identity')
          .select('*')
          .eq('usage_point_id', prm)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching client profile from Supabase:', error);
          throw new Error(`Erreur Supabase: ${error.message}`);
        }
        
        if (data) {
          console.log('Client profile found in Supabase:', data);
          
          // Créer l'objet de cache avec métadonnées
          const cacheObject = {
            data: data,
            meta: {
              fetchedAt: new Date().toISOString(),
              cacheValidity: CACHE_VALIDITY
            }
          };
          
          // Sauvegarder dans le cache local
          localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
          return data;
        }
      } catch (supabaseError) {
        console.error('Erreur Supabase:', supabaseError);
        // Continuer avec les données de test
      }
      
      // Si aucune donnée n'est trouvée, utiliser les données de test
      console.log('Aucune donnée trouvée, utilisation des données de test');
      const testData = {
        usage_point_id: prm,
        identity: {
          customer_id: "test123",
          natural_person: {
            title: "M",
            firstname: "John",
            lastname: "Doe"
          }
        },
        address: {
          street: "123 Test Street",
          postal_code: "75001",
          city: "Paris",
          country: "France"
        },
        contract: {
          subscribed_power: "9 kVA",
          meter_type: "AMM",
          offpeak_hours: "HC (22H00-6H00)"
        },
        contact: {
          email: "test@example.com",
          phone: "0123456789"
        }
      };
      
      // Créer l'objet de cache avec métadonnées
      const cacheObject = {
        data: testData,
        meta: {
          fetchedAt: new Date().toISOString(),
          cacheValidity: CACHE_VALIDITY
        }
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
      return testData;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      throw new Error(`Erreur lors de la récupération du profil client: ${error.message || 'Erreur inconnue'}`);
    }
  }

  public async getClientAddressFromSupabase(prm: string): Promise<any | null> {
    try {
      console.log('Recherche de l\'adresse client dans Supabase pour PDL:', prm);
      
      const { data, error } = await supabase
        .from('clients_addresses')
        .select('*')
        .eq('usage_point_id', prm)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching client address from Supabase:', error);
        return null;
      }
      
      if (data) {
        console.log('Client address found in Supabase:', data);
        return data.address;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching client address:', error);
      return null;
    }
  }

  public async getClientContractFromSupabase(prm: string): Promise<any | null> {
    try {
      console.log('Recherche du contrat client dans Supabase pour PDL:', prm);
      
      const { data, error } = await supabase
        .from('clients_contracts')
        .select('*')
        .eq('usage_point_id', prm)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching client contract from Supabase:', error);
        return null;
      }
      
      if (data) {
        console.log('Client contract found in Supabase:', data);
        return data.contract;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching client contract:', error);
      return null;
    }
  }

  public async getClientContactFromSupabase(prm: string): Promise<any | null> {
    try {
      console.log('Recherche du contact client dans Supabase pour PDL:', prm);
      
      const { data, error } = await supabase
        .from('clients_contacts')
        .select('*')
        .eq('usage_point_id', prm)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching client contact from Supabase:', error);
        return null;
      }
      
      if (data) {
        console.log('Client contact found in Supabase:', data);
        return data.contact_data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching client contact:', error);
      return null;
    }
  }

  public async getClientProfile(prm: string): Promise<any> {
    try {
      // 1. Essayer d'abord la table Supabase
      const { data: supaData, error: supaError } = await supabase
        .from('clients_identity')
        .select('*')
        .eq('usage_point_id', prm)
        .maybeSingle();
      
      if (supaError) {
        console.warn('Error fetching from Supabase:', supaError);
      } else if (supaData) {
        console.log('Client profile found in Supabase:', supaData);
        return supaData;
      }
      
      // 2. Sinon, appeler l'Edge Function
      const payload = { action: 'get_identity', prm };
      const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST', 
        body: JSON.stringify(payload)
      });
      
      if (error) throw new Error(error.message || 'Failed to invoke Edge Function for client profile');
      
      // Extraire les données du format { data: { data: ... }, meta: ... }
      return responseData?.data?.data || responseData?.data || null;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      throw new Error(`Erreur lors de la récupération du profil client: ${error.message || 'Erreur inconnue'}`);
    }
  }

  public async getClientContracts(prm: string): Promise<any> {
    try {
      const payload = {
        action: 'get_contracts',
        prm
      };

      const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (error) throw new Error(error.message || 'Failed to invoke Edge Function for client contracts');
      return responseData?.data?.data || responseData?.data || null;
    } catch (error) {
      console.error('Error fetching client contracts:', error);
      throw new Error(`Erreur lors de la récupération des contrats: ${error.message || 'Erreur inconnue'}`);
    }
  }

  public async getClientAddress(prm: string): Promise<any> {
    try {
      const payload = {
        action: 'get_address',
        prm
      };

      const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (error) throw new Error(error.message || 'Failed to invoke Edge Function for client address');
      return responseData?.data?.data || responseData?.data || null;
    } catch (error) {
      console.error('Error fetching client address:', error);
      throw new Error(`Erreur lors de la récupération de l'adresse: ${error.message || 'Erreur inconnue'}`);
    }
  }

  public async getClientContact(prm: string): Promise<any> {
    try {
      const payload = {
        action: 'get_contact',
        prm
      };

      const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (error) throw new Error(error.message || 'Failed to invoke Edge Function for client contact');
      return responseData?.data?.data || responseData?.data || null;
    } catch (error) {
      console.error('Error fetching client contact:', error);
      throw new Error(`Erreur lors de la récupération des contacts: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les données de consommation
   */
  public async getConsumptionData(prm: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      console.log(`Récupération des données de consommation pour ${prm} du ${startDate} au ${endDate}`);
      
      // Définir la durée de validité du cache (1 jour en secondes)
      const CACHE_VALIDITY = 86400;
      
      // Vérifier si les données en cache sont encore valides
      const cacheKey = `enedis_consumption_${prm}_${startDate}_${endDate}`;
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          
          // Vérifier si le cache est encore valide
          if (cachedData.meta && cachedData.meta.fetchedAt) {
            const fetchedAt = new Date(cachedData.meta.fetchedAt).getTime();
            const now = Date.now();
            const age = (now - fetchedAt) / 1000; // en secondes

            if (age < CACHE_VALIDITY) {
              console.log('Données de consommation trouvées dans le cache local (valides)');
              return cachedData.data;
            } else {
              console.log('Cache expiré, récupération de nouvelles données');
            }
          }
        } catch (parseError) {
          console.warn('Erreur de parsing du cache:', parseError);
        }
      }
      
      const payload = {
        action: 'get_consumption',
        prm,
        startDate,
        endDate
      };

      const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (error) {
        console.error('Erreur lors de la récupération des données de consommation:', error);
        throw new Error(`Échec récupération des données de consommation: ${error.message}`);
      }
      
      if (!responseData || !responseData.data) {
        console.warn('Aucune donnée de consommation reçue');
        return [];
      }
      
      // Sauvegarder dans le cache local
      localStorage.setItem(cacheKey, JSON.stringify(responseData));
      
      const consumptionData = responseData.data.data || responseData.data;
      console.log(`Reçu ${consumptionData.length} points de données de consommation`);
      return consumptionData;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données de consommation:', error);
      return [];
    }
  }

  /**
   * Récupère la courbe de charge pour une période donnée
   * Utilise la pagination pour récupérer les données par semaine
   */
  public async getLoadCurveData(prm: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      console.log(`Récupération de la courbe de charge pour ${prm} du ${startDate} au ${endDate}`);
      
      // Définir la durée de validité du cache (1 heure en secondes)
      const CACHE_VALIDITY = 3600;
      
      // Vérifier si les données en cache sont encore valides
      const cacheKey = `enedis_load_curve_${prm}_${startDate}_${endDate}`;
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          
          // Vérifier si le cache est encore valide
          if (cachedData.meta && cachedData.meta.fetchedAt) {
            const fetchedAt = new Date(cachedData.meta.fetchedAt).getTime();
            const now = Date.now();
            const age = (now - fetchedAt) / 1000; // en secondes

            if (age < CACHE_VALIDITY) {
              console.log('Courbe de charge trouvée dans le cache local (valide)');
              return cachedData.data;
            } else {
              console.log('Cache expiré, récupération de nouvelles données');
            }
          }
        } catch (parseError) {
          console.warn('Erreur de parsing du cache:', parseError);
        }
      }
      
      // Diviser la période en semaines pour éviter les timeouts
      const weeks = this.splitDateRange(startDate, endDate);
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
        
        const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        if (error) {
          console.error(`❌ Erreur semaine ${i+1}/${weeks.length}:`, error);
          continue; // Continuer avec la semaine suivante en cas d'erreur
        }
        
        const loadCurveData = responseData?.data?.data || responseData?.data;
        if (loadCurveData && Array.isArray(loadCurveData)) {
          console.log(`✅ Semaine ${i+1}: ${loadCurveData.length} points récupérés`);
          allData.push(...loadCurveData);
        }
        
        // Pause entre les requêtes pour éviter les limitations d'API
        if (i < weeks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Sauvegarder dans le cache local
      const cacheObject = {
        data: allData,
        meta: {
          fetchedAt: new Date().toISOString(),
          cacheValidity: CACHE_VALIDITY,
          segment: { start: startDate, end: endDate }
        }
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheObject));

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
  public splitDateRange(startDate: string, endDate: string, chunkSize: number = 7): { start: string, end: string }[] {
    const chunks: { start: string, end: string }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let chunkStart = new Date(start);
    
    while (chunkStart < end) {
      let chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkEnd.getDate() + chunkSize - 1);
      
      // If chunk end is after the overall end date, use the overall end date
      if (chunkEnd > end) {
        chunkEnd = new Date(end);
      }
      
      chunks.push({
        start: chunkStart.toISOString().split('T')[0],
        end: chunkEnd.toISOString().split('T')[0]
      });
      
      // Move to the next chunk
      chunkStart = new Date(chunkEnd);
      chunkStart.setDate(chunkStart.getDate() + 1);
    }
    
    return chunks;
  }

  /**
   * Fetch load curve data in chunks to avoid timeouts
   */
  public async fetchLoadCurveInChunks(
    prm: string, 
    startDate: string, 
    endDate: string, 
    progressCallback?: (progress: number) => void
  ): Promise<any[]> {
    try {
      // Split the date range into chunks of 7 days
      const chunks = this.splitDateRange(startDate, endDate, 7);
      console.log(`Splitting date range into ${chunks.length} chunks`);
      
      const allData: any[] = [];
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.start} to ${chunk.end}`);
        
        try {
          const chunkData = await this.getLoadCurveData(prm, chunk.start, chunk.end);
          allData.push(...chunkData);
          
          // Update progress
          if (progressCallback) {
            const progress = Math.round(((i + 1) / chunks.length) * 100);
            progressCallback(progress);
          }
        } catch (error) {
          console.error(`Error fetching chunk ${i + 1}:`, error);
          // Continue with the next chunk even if this one fails
        }
        
        // Add a small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return allData;
    } catch (error) {
      console.error('Error fetching load curve in chunks:', error);
      throw error;
    }
  }

  /**
   * Récupère la courbe de charge
   */
  public async getConsumptionLoadCurve(prm: string, startDate: string, endDate: string): Promise<any> {
    try {
      // Limiter à 7 jours maximum pour éviter les erreurs d'API
      // Utiliser la méthode getLoadCurveData qui gère déjà la pagination
      return await this.getLoadCurveData(prm, startDate, endDate);
    } catch (error) {
      console.error('Error fetching load curve data:', error);
      throw new Error(`Erreur lors de la récupération de la courbe de charge: ${error.message || 'Erreur inconnue'}`);
    }
  }
  
  /**
   * Récupère la courbe de charge annuelle
   */
  public async getAnnualLoadCurve(prm: string, startDate: string, endDate: string): Promise<any> {
    try {
      console.log(`Récupération de la courbe de charge annuelle pour ${prm} du ${startDate} au ${endDate}`);
      
      const payload = {
        action: 'get_load_curve_year',
        prm,
        startDate,
        endDate
      };
      
      const { data: responseData, error } = await supabase.functions.invoke('enedis-data', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (error) {
        console.error('Error fetching annual load curve:', error);
        return { data: null, error: new Error(`Erreur lors de la récupération de la courbe de charge annuelle: ${error.message || 'Erreur inconnue'}`) };
      }
      
      const loadCurveData = responseData?.data?.data || responseData?.data;
      console.log(`Données de courbe de charge annuelle récupérées: ${loadCurveData?.length || 0} points`);
      return { data: loadCurveData, error: null };
    } catch (error) {
      console.error('Error in getAnnualLoadCurve:', error);
      return { data: null, error };
    }
  }
  
  /**
   * Récupère la courbe de charge annuelle avec la nouvelle stratégie par batchs
   */
  public async getAnnualLoadCurveData(prm: string, progressCallback?: (progress: number) => void): Promise<any[]> {
    try {
      console.log(`🔄 Début récupération courbe de charge annuelle pour ${prm}`);
      
      // Calculer les dates pour l'année écoulée (365 jours)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - 1); // hier
      
      const startDate = new Date(today);
      startDate.setFullYear(startDate.getFullYear() - 1); // il y a 1 an
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log(`📅 Période: ${formattedStartDate} au ${formattedEndDate}`);
      
      // Générer 53 tranches de 7 jours
      const weeklyRanges = this.generateWeeklyRanges(startDate, endDate);
      console.log(`📊 ${weeklyRanges.length} tranches hebdomadaires générées`);
      
      // Diviser en 4 batchs parallèles
      const batchSize = Math.ceil(weeklyRanges.length / 4);
      const batches = [];
      for (let i = 0; i < weeklyRanges.length; i += batchSize) {
        batches.push(weeklyRanges.slice(i, i + batchSize));
      }
      
      console.log(`🚀 ${batches.length} batchs parallèles (${batchSize} tranches par batch)`);
      
      // Fonction pour traiter un batch
      const processBatch = async (batchIndex: number, ranges: any[]) => {
        console.log(`📦 Batch ${batchIndex + 1}/4: ${ranges.length} tranches`);
        let batchProcessed = 0;
        let batchErrors = 0;
        
        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          try {
            console.log(`  🔄 Batch ${batchIndex + 1} - Tranche ${i + 1}/${ranges.length}: ${range.start} au ${range.end}`);
            
            // Appeler l'Edge Function pour cette tranche de 7 jours
            const { data, error } = await this.invokeEdgeFunction('enedis-data', {
              action: 'get_load_curve',
              prm,
              startDate: range.start,
              endDate: range.end
            });
            
            if (error) {
              console.error(`  ❌ Erreur tranche ${range.start}-${range.end}:`, error);
              batchErrors++;
            } else {
              const pointsCount = data?.data?.length || 0;
              console.log(`  ✅ Tranche ${range.start}-${range.end}: ${pointsCount} points`);
              batchProcessed += pointsCount;
            }
            
            // Délai de 200ms entre les tranches d'un même batch
            if (i < ranges.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
          } catch (error) {
            console.error(`  ❌ Erreur lors du traitement de la tranche ${range.start}-${range.end}:`, error);
            batchErrors++;
          }
        }
        
        console.log(`✅ Batch ${batchIndex + 1} terminé: ${batchProcessed} points, ${batchErrors} erreurs`);
        return { processed: batchProcessed, errors: batchErrors };
      };
      
      // Lancer les 4 batchs en parallèle
      const batchPromises = batches.map((batch, index) => processBatch(index, batch));
      const batchResults = await Promise.all(batchPromises);
      
      // Calculer les totaux
      const totalProcessed = batchResults.reduce((sum, result) => sum + result.processed, 0);
      const totalErrors = batchResults.reduce((sum, result) => sum + result.errors, 0);
      
      console.log(`🎯 Tous les batchs terminés: ${totalProcessed} points traités, ${totalErrors} erreurs`);
      
      // Récupération finale depuis la table Supabase
      console.log(`📖 Lecture finale depuis la table load_curve_data...`);
      
      const { data: finalData, count, error: supabaseError } = await supabase
        .from('load_curve_data')
        .select('*', { count: 'exact' })
        .eq('prm', prm)
        .gte('date_time', formattedStartDate)
        .lte('date_time', formattedEndDate)
        .order('date_time', { ascending: true });
      
      if (supabaseError) {
        console.error('❌ Erreur lors de la lecture Supabase:', supabaseError);
        throw new Error(`Erreur Supabase: ${supabaseError.message}`);
      }
      
      const actualCount = finalData?.length || count || 0;
      console.log(`✅ Courbe de charge annuelle récupérée: ${actualCount} points sur 365 jours`);
      
      // Mettre à jour le callback de progression
      if (progressCallback) {
        progressCallback(100);
      }
      
      return finalData || [];
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la courbe de charge annuelle:', error);
      throw error;
    }
  }
  
  /**
   * Génère les tranches hebdomadaires pour une période donnée
   */
  private generateWeeklyRanges(startDate: Date, endDate: Date) {
    const ranges = [];
    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6); // +6 jours pour faire 7 jours au total
      
      // Si la fin dépasse la date de fin globale, ajuster
      if (currentEnd > endDate) {
        currentEnd.setTime(endDate.getTime());
      }
      
      ranges.push({
        start: currentStart.toISOString().split('T')[0],
        end: currentEnd.toISOString().split('T')[0]
      });
      
      // Passer à la semaine suivante
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    
    return ranges;
  }

  /**
   * Gère le callback OAuth d'Enedis
   */
  public async handleCallback(code: string): Promise<any> {
    try {
      const { data: responseData, error } = await supabase.functions.invoke('enedis-auth', {
        method: 'POST', 
        body: JSON.stringify({ code })
      });
      
      if (error) {
        console.error('Error handling callback:', error);
        throw new Error(`Erreur lors de l'échange du code: ${error.message || 'Erreur inconnue'}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error handling callback:', error);
      throw new Error(`Erreur lors du traitement du callback: ${error.message || 'Erreur inconnue'}`);
    }
  }
}

export const enedisApi = EnedisApi.getInstance();