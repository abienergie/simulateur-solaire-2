import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from "https://esm.sh/luxon@3.4.4";

const PARIS = "Europe/Paris";

// URLs Enedis par service
const ENEDIS_BASE = "https://gw.ext.prod.api.enedis.fr";
const DC = `${ENEDIS_BASE}/metering_data_dc/v5`;
const CLC = `${ENEDIS_BASE}/metering_data_clc/v5`;
const PLC = `${ENEDIS_BASE}/metering_data_plc/v5`;
const DCMP = `${ENEDIS_BASE}/metering_data_dcmp/v5`;
const DP = `${ENEDIS_BASE}/metering_data_dp/v5`;
const CI = `${ENEDIS_BASE}/customers_i/v5`;
const UPA = `${ENEDIS_BASE}/customers_upa/v5`;
const UPC = `${ENEDIS_BASE}/customers_upc/v5`;
const CD = `${ENEDIS_BASE}/customers_cd/v5`;

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Configuration de l'API Enedis
const ENEDIS_CONFIG = {
  clientId: 'Y_LuB7HsQW3JWYudw7HRmN28FN8a',
  clientSecret: 'Pb9H1p8zJ4IfX0xca5c7lficGo4a',
  tokenUrl: 'https://gw.ext.prod.api.enedis.fr/oauth2/v3/token'
};

// Fonction de retry avec backoff exponentiel
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError = null;
  for(let attempt = 0; attempt < maxRetries; attempt++){
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(()=>controller.abort(), 30000); // 30s timeout
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        return response;
      }
      // Log error details only for non-404 errors
      const errorText = await response.text();
      if (response.status !== 404) {
        console.error(`Fetch attempt ${attempt + 1} failed:`, {
          url: url.replace(/Bearer [^&]+/, 'Bearer ***'),
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200)
        });
      }
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        if (response.status !== 404) {
          console.log(`Retrying in ${delay}ms...`);
        }
        await new Promise((resolve)=>setTimeout(resolve, delay));
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`Fetch attempt ${attempt + 1} error:`, error.message);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve)=>setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error(`Failed after ${maxRetries} attempts`);
}

// Construit des segments [start ; endExclusive[ de 7 jours max
function buildSegmentsExclusive(startDate, endDate) {
  const start = DateTime.fromISO(startDate, {
    zone: PARIS
  }).startOf("day");
  const endExclusive = DateTime.fromISO(endDate, {
    zone: PARIS
  }).startOf("day").plus({
    days: 1
  });
  const segs = [];
  let cur = start;
  while(cur < endExclusive){
    const segEnd = DateTime.min(cur.plus({
      days: 7
    }), endExclusive); // ≤ 7 jours
    segs.push({
      start: cur.toISODate(),
      end: segEnd.toISODate()
    }); // end = EXCLUSIF
    cur = segEnd; // avance par la borne exclusive
  }
  return segs;
}

// Clamp à 7 jours **end EXCLUSIF** pour les endpoints 7j
function clampTo7DaysExclusive(startDate, endDate) {
  const s = DateTime.fromISO(startDate, {
    zone: PARIS
  }).startOf("day");
  let eExclusive = DateTime.fromISO(endDate, {
    zone: PARIS
  }).startOf("day").plus({
    days: 1
  });
  const maxExclusive = s.plus({
    days: 7
  });
  if (eExclusive > maxExclusive) eExclusive = maxExclusive;
  return {
    startISO: s.toISODate(),
    endISO: eExclusive.toISODate()
  };
}

// Parse la FIN d'intervalle Enedis → calcule le **DÉBUT** d'intervalle en Europe/Paris
function parseEndToStartParis(dateStr, intervalLength) {
  let endParis = DateTime.fromFormat(dateStr, "yyyy-LL-dd HH:mm:ss", {
    zone: PARIS
  });
  if (!endParis.isValid) {
    endParis = DateTime.fromISO(dateStr, {
      zone: PARIS
    }); // <- fallback
  }
  const step = Number(intervalLength) || 30; // Sécurise contre NaN
  const startParis = endParis.minus({
    minutes: step
  });
  return {
    startParis,
    endParis,
    step
  };
}

// Fenêtres HC/HP : parseur et fallback contrat
function parseOffPeakHours(s) {
  const out = [];
  const re = /(\d{1,2})H(\d{2})-(\d{1,2})H(\d{2})/g;
  let m;
  while(m = re.exec(s)){
    out.push({
      start: +m[1] * 60 + +m[2],
      end: +m[3] * 60 + +m[4]
    });
  }
  return out;
}

async function getOffpeakWindows(supabase, prm) {
  const { data: win } = await supabase.from('offpeak_windows').select('*').eq('prm', prm);
  if (win?.length) return win;
  const { data: cc } = await supabase.from('clients_contracts').select('contract').eq('usage_point_id', prm).maybeSingle();
  const raw = cc?.contract?.offpeak_hours;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) return parseOffPeakHours(raw);
  return []; // défaut: pas d'HC connues
}

// Fonction pour obtenir un token Bearer (priorité base, fallback client_credentials)
async function getBearerToken(supabase) {
  // 1) token actif en base (table enedis_tokens)
  const { data: tok, error: tokErr } = await supabase.from("enedis_tokens").select("access_token").eq("is_active", true).order("created_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (tok && tok.access_token) {
    console.log('Using active token from database');
    return tok.access_token;
  }
  console.log('No active token found, requesting new client_credentials token');
  // 2) fallback client_credentials (si aucun token actif)
  const tokenUrl = `${ENEDIS_BASE}/oauth2/v3/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: ENEDIS_CONFIG.clientId,
    client_secret: ENEDIS_CONFIG.clientSecret
  });
  const r = await fetchWithRetry(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: body.toString()
  });
  if (!r.ok) {
    const errorText = await r.text();
    console.error('Failed to get fallback token:', r.status, errorText);
    throw new Error(`Failed to get API token: ${r.status}`);
  }
  const j = await r.json();
  console.log('Fallback token obtained successfully');
  return j.access_token;
}

console.log('Enedis Data Function Starting...');

serve(async (req)=>{
  console.log('Received request:', req.method, req.url);
  
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser le body de la requête
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const { action, prm, startDate, endDate } = body;

    if (!action) {
      return new Response(JSON.stringify({
        error: 'Missing action parameter',
        supported_actions: [
          'get_consumption',
          'get_load_curve',
          'get_annual_load_curve',
          'get_max_power',
          'get_daily_production',
          'get_production_load_curve',
          'get_identity',
          'get_address',
          'get_contract',
          'get_contracts',
          'get_contact',
          'compute_weekly_avg'
        ]
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Obtenir le token API
    const apiToken = await getBearerToken(supabase);

    // Router selon l'action demandée
    switch(action){
      case 'get_consumption':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          console.log(`Getting consumption data for PRM: ${prm}, period: ${startDate} to ${endDate}`);
          const url = `${DC}/daily_consumption?usage_point_id=${prm}&start=${startDate}&end=${endDate}`;
          console.log(`[ENEDIS] Consumption URL: ${url}`);

          const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
              console.log(`⚠️ Pas de données de consommation pour ce PDL (normal): ${response.status}`);
            } else {
              console.error(`❌ Erreur API consommation: ${response.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: []
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const data = await response.json();
          console.log(`📊 Réponse consommation:`, JSON.stringify(data, null, 2));

          // Stocker les données dans Supabase
          if (data && data.meter_reading && data.meter_reading.interval_reading) {
            const rows = data.meter_reading.interval_reading.map((r)=>({
                prm: prm,
                date: r.date,
                peak_hours: r.value == null ? null : Number(r.value) / 1000,
                off_peak_hours: 0,
                created_at: new Date().toISOString()
              }));

            // Insérer dans la table consumption_data
            const { error: insertError } = await supabase.from('consumption_data').upsert(rows, {
              onConflict: 'prm,date'
            });

            if (insertError) {
              console.error('❌ Erreur insertion consommation:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code'
              });
            } else {
              console.log(`✅ Consommation: ${rows.length} jours insérés`);
            }

            return new Response(JSON.stringify({
              success: true,
              data: rows
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          } else {
            console.log(`⚠️ Structure de données consommation inattendue pour PDL ${prm}`);
          }

          return new Response(JSON.stringify({
            success: true,
            data: []
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_annual_load_curve':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          console.log(`📅 Période: ${startDate} au ${endDate}`);

          // Découpage de la période en segments de 7 jours max (end EXCLUSIF)
          const segments = buildSegmentsExclusive(startDate, endDate);
          console.log(`📊 Courbe annuelle: ${segments.length} segments de 7 jours`);

          // Récupérer les fenêtres heures creuses pour ce PDL
          const windows = await getOffpeakWindows(supabase, prm);
          console.log(`🕐 Fenêtres HC trouvées:`, windows);

          // Récupérer les données pour chaque segment
          const allLoadCurveData = [];
          let successfulSegments = 0;
          let failedSegments = 0;

          for(let i = 0; i < segments.length; i++){
            const segment = segments[i];
            // Log seulement tous les 10 segments pour réduire le spam
            if (i % 10 === 0 || i < 3 || i >= segments.length - 3) {
              console.log(`🔄 Segment ${i + 1}/${segments.length}: ${segment.start} au ${segment.end}`);
            }

            try {
              const segmentUrl = `${CLC}/consumption_load_curve?usage_point_id=${prm}&start=${segment.start}&end=${segment.end}`;
              const response = await fetchWithRetry(segmentUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'Accept': 'application/json'
                }
              }, 1); // Réduire les retries pour les 404

              if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 404) {
                  // 404 est normal - ne pas logger comme erreur
                  failedSegments++;
                } else {
                  console.error(`❌ Segment ${i + 1}: Erreur API ${response.status} - ${errorText}`);
                  failedSegments++;
                }
                continue; // Passer au segment suivant
              }

              const data = await response.json();
              // Log détaillé seulement pour les 3 premiers segments réussis
              if (successfulSegments < 3) {
                console.log(`📊 Segment ${i + 1} réponse:`, JSON.stringify(data, null, 2));
              }

              const readings = data?.meter_reading?.interval_reading ?? [];
              if (successfulSegments < 3) {
                console.log(`📈 Segment ${i + 1}: ${readings.length} points bruts`);
              }

              // Traiter les données de courbe de charge (parsing corrigé)
              const loadCurveData = readings.map((r)=>{
                const { startParis, endParis } = parseEndToStartParis(r.date, r.interval_length);
                const mins = startParis.hour * 60 + startParis.minute;
                // HC/HP basé sur le **début**
                const isOff = windows.some((w)=>w.start < w.end ? mins >= w.start && mins < w.end : mins >= w.start || mins < w.end);
                return {
                  prm,
                  date: startParis.toISODate(),
                  time: startParis.toFormat("HH:mm:ss"),
                  date_time: endParis.toUTC().toISO(),
                  value: r.value == null ? null : Number(r.value) / 1000,
                  is_off_peak: isOff,
                  created_at: new Date().toISOString()
                };
              });

              if (successfulSegments < 3) {
                console.log(`📈 Segment ${i + 1}: ${loadCurveData.length} points traités`);
              }

              allLoadCurveData.push(...loadCurveData);
              successfulSegments++;

              // Pause entre les segments pour éviter de surcharger l'API
              if (i < segments.length - 1) {
                await new Promise((resolve)=>setTimeout(resolve, 200)); // Réduit à 200ms
              }
            } catch (segmentError) {
              console.error(`❌ Segment ${i + 1} erreur: ${segmentError.message}`);
              failedSegments++;
              continue; // Passer au segment suivant
            }
          }

          console.log(`🎯 RÉSULTAT FINAL: ${allLoadCurveData.length} points récupérés sur ${segments.length} segments`);
          console.log(`📊 Segments réussis: ${successfulSegments}, échoués: ${failedSegments}`);

          // Insérer toutes les données en une fois
          if (allLoadCurveData.length > 0) {
            const { error: insertError } = await supabase.from('load_curve_data').upsert(allLoadCurveData, {
              onConflict: 'prm,date_time'
            });

            if (insertError) {
              console.error('❌ Erreur insertion courbe:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code',
                rowsCount: allLoadCurveData.length
              });
            } else {
              console.log(`✅ Courbe annuelle: ${allLoadCurveData.length} points insérés`);
            }
          } else {
            console.log(`⚠️ Aucune donnée de courbe de charge récupérée pour la période`);
          }

          return new Response(JSON.stringify({
            success: true,
            data: allLoadCurveData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_load_curve':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          // Clamp à 7 jours **end EXCLUSIF**
          const { startISO, endISO } = clampTo7DaysExclusive(startDate, endDate);
          const segmentUrl = `${CLC}/consumption_load_curve?usage_point_id=${prm}&start=${startISO}&end=${endISO}`;
          console.log(`[ENEDIS] Load curve URL: ${segmentUrl}`);

          // Récupérer les fenêtres heures creuses pour ce PDL
          const windows = await getOffpeakWindows(supabase, prm);

          const response = await fetchWithRetry(segmentUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
              console.log(`⚠️ Pas de courbe de charge pour ce PDL (normal): ${response.status}`);
            } else {
              console.error(`❌ Erreur API courbe de charge: ${response.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: []
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const data = await response.json();
          console.log(`📊 Réponse courbe de charge:`, JSON.stringify(data, null, 2));

          const readings = data?.meter_reading?.interval_reading ?? [];
          console.log(`📈 Points bruts courbe: ${readings.length}`);

          // Traiter les données de courbe de charge (parsing corrigé)
          const loadCurveData = readings.map((r)=>{
            const { startParis, endParis } = parseEndToStartParis(r.date, r.interval_length);
            const mins = startParis.hour * 60 + startParis.minute;
            // HC/HP basé sur le **début**
            const isOff = windows.some((w)=>w.start < w.end ? mins >= w.start && mins < w.end : mins >= w.start || mins < w.end);
            return {
              prm,
              date: startParis.toISODate(),
              time: startParis.toFormat("HH:mm:ss"),
              date_time: endParis.toUTC().toISO(),
              value: r.value == null ? null : Number(r.value) / 1000,
              is_off_peak: isOff,
              created_at: new Date().toISOString()
            };
          });

          // Insérer dans la table load_curve_data
          const { error: insertError } = await supabase.from('load_curve_data').upsert(loadCurveData, {
            onConflict: 'prm,date_time'
          });

          if (insertError) {
            console.error('❌ Erreur insertion courbe de charge:', {
              message: insertError.message || 'No message',
              details: insertError.details || 'No details',
              hint: insertError.hint || 'No hint',
              code: insertError.code || 'No code',
              rowsCount: loadCurveData.length
            });
          } else {
            console.log(`✅ Courbe: ${loadCurveData.length} points`);
          }

          return new Response(JSON.stringify({
            success: true,
            data: loadCurveData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_production_load_curve':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          // Clamp à 7 jours **end EXCLUSIF**
          const { startISO, endISO } = clampTo7DaysExclusive(startDate, endDate);
          const segmentUrl = `${PLC}/production_load_curve?usage_point_id=${prm}&start=${startISO}&end=${endISO}`;

          const response = await fetchWithRetry(segmentUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`⚠️ Pas de production pour cette période: ${response.status}`);
            throw new Error(`Enedis API call failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const readings = data?.meter_reading?.interval_reading ?? [];

          // Traiter les données de courbe de charge de production (parsing corrigé)
          const productionData = readings.map((r)=>{
            const { startParis, endParis } = parseEndToStartParis(r.date, r.interval_length);
            return {
              prm,
              date: startParis.toISODate(),
              time: startParis.toFormat("HH:mm:ss"),
              date_time: endParis.toUTC().toISO(),
              value: r.value == null ? null : Number(r.value) / 1000,
              created_at: new Date().toISOString()
            };
          });

          // Insérer dans la table production_load_curve
          const { error: insertError } = await supabase.from('production_load_curve').upsert(productionData, {
            onConflict: 'prm,date_time'
          });

          if (insertError) {
            console.error('Error inserting production data:', insertError);
          } else {
            console.log(`✅ Production: ${productionData.length} points`);
          }

          return new Response(JSON.stringify({
            success: true,
            data: productionData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_max_power':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const url = `${DCMP}/daily_consumption_max_power?usage_point_id=${prm}&start=${startDate}&end=${endDate}`;

          const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
              console.log(`⚠️ Pas de puissance max pour ce PDL (normal): ${response.status}`);
            } else {
              console.error(`❌ Erreur API puissance max: ${response.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: []
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const data = await response.json();
          console.log(`📊 Réponse puissance max:`, JSON.stringify(data, null, 2));

          // Traiter les données de puissance max
          if (data && data.meter_reading && data.meter_reading.interval_reading) {
            const maxPowerData = data.meter_reading.interval_reading.map((reading)=>({
                prm: prm,
                date: reading.date,
                max_power: reading.value == null ? 0 : Number(reading.value) / 1000,
                created_at: new Date().toISOString()
              }));

            // Insérer dans la table max_power_data
            const { error: insertError } = await supabase.from('max_power_data').upsert(maxPowerData, {
              onConflict: 'prm,date'
            });

            if (insertError) {
              console.error('❌ Erreur insertion puissance max:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code',
                rowsCount: maxPowerData.length,
                sampleRow: maxPowerData[0]
              });
            } else {
              console.log(`✅ Puissance max: ${maxPowerData.length} jours insérés`);
            }

            return new Response(JSON.stringify({
              success: true,
              data: maxPowerData
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          } else {
            console.log(`⚠️ Structure puissance max inattendue pour PDL ${prm}`);
          }

          return new Response(JSON.stringify({
            success: true,
            data: []
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_daily_production':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const url = `${DP}/daily_production?usage_point_id=${prm}&start=${startDate}&end=${endDate}`;

          const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
              console.log(`⚠️ Pas de production quotidienne pour ce PDL (normal): ${response.status}`);
            } else {
              console.error(`❌ Erreur API production quotidienne: ${response.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: []
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const data = await response.json();
          console.log(`📊 Réponse production quotidienne:`, JSON.stringify(data, null, 2));

          // Stocker les données de production quotidienne
          if (data && data.meter_reading && data.meter_reading.interval_reading) {
            const rows = data.meter_reading.interval_reading.map((r)=>({
                prm: prm,
                date: r.date,
                production: r.value == null ? null : Number(r.value) / 1000 // Wh → kWh
              }));

            // Insérer dans la table production_data
            const { error: insertError } = await supabase.from('production_data').upsert(rows, {
              onConflict: 'prm,date'
            });

            if (insertError) {
              console.error('❌ Erreur insertion production:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code'
              });
            } else {
              console.log(`✅ Production quotidienne: ${rows.length} jours insérés`);
            }

            return new Response(JSON.stringify({
              success: true,
              data: rows
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          } else {
            console.log(`⚠️ Structure production inattendue pour PDL ${prm}`);
          }

          return new Response(JSON.stringify({
            success: true,
            data: []
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_identity':
        {
          if (!prm) {
            return new Response(JSON.stringify({
              error: 'Missing required parameter: prm'
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          console.log(`🔍 Récupération identité pour PDL: ${prm}`);
          const url = `${CI}/identity?usage_point_id=${prm}`;
          console.log(`[DEBUG] Identity URL: ${url}`);

          const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
              console.log(`⚠️ Pas de données d'identité pour ce PDL (normal): ${response.status}`);
            } else {
              console.error(`❌ Erreur API identité: ${response.status} - ${errorText}`);
            }

            // Try alternative endpoint if main one fails
            try {
              const altUrl = `${ENEDIS_BASE}/customers/v5/identity?usage_point_id=${prm}`;
              console.log(`🔄 Essai endpoint alternatif: ${altUrl}`);
              const altResponse = await fetchWithRetry(altUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'Accept': 'application/json'
                }
              });

              if (altResponse.ok) {
                const altData = await altResponse.json();
                console.log('✅ Identité endpoint alternatif réussi:', JSON.stringify(altData, null, 2));
                const identityData = altData.customer ?? altData.identity ?? null;
                if (identityData) {
                  console.log('💾 Stockage identité dans clients_identity');
                  console.log('[DEBUG] Data to insert:', JSON.stringify({
                    usage_point_id: prm,
                    identity: identityData,
                    created_at: new Date().toISOString()
                  }, null, 2));

                  const { error: insertError } = await supabase.from('clients_identity').upsert({
                    usage_point_id: prm,
                    identity: identityData,
                    created_at: new Date().toISOString()
                  }, {
                    onConflict: 'usage_point_id'
                  });

                  if (insertError) {
                    console.error('❌ Erreur stockage identité:', {
                      message: insertError.message || 'No message',
                      details: insertError.details || 'No details',
                      hint: insertError.hint || 'No hint',
                      code: insertError.code || 'No code'
                    });
                    return new Response(JSON.stringify({ success: false, error: insertError.message }), {
                      status: 500,
                      headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                  } else {
                    console.log('✅ Identité stockée avec succès');
                    const { data: checkData, error: checkError } = await supabase.from('clients_identity').select('*').eq('usage_point_id', prm).maybeSingle();
                    if (checkError) {
                      console.error('❌ Erreur vérification insertion:', checkError);
                    } else if (checkData) {
                      console.log('✅ Vérification: donnée bien insérée:', checkData.usage_point_id);
                    } else {
                      console.error('❌ Vérification: aucune donnée trouvée après insertion');
                    }
                  }
                }
                return new Response(JSON.stringify({
                  success: true,
                  data: identityData
                }), {
                  headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                  }
                });
              }
            } catch (altError) {
              console.error(`❌ Endpoint alternatif échoué: ${altError.message}`);
            }

            return new Response(JSON.stringify({
              success: true,
              data: null
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const data = await response.json();
          console.log(`📊 Réponse identité:`, JSON.stringify(data, null, 2));

          // Stocker les données d'identité avec parsing robuste et created_at
          const identityData = data?.customer ?? data?.identity ?? null;
          console.log('[DEBUG] Extracted identityData:', JSON.stringify(identityData, null, 2));

          if (identityData) {
            console.log('💾 Stockage identité dans clients_identity');
            console.log('[DEBUG] Data to insert:', JSON.stringify({
              usage_point_id: prm,
              identity: identityData,
              created_at: new Date().toISOString()
            }, null, 2));

            const { error: insertError } = await supabase.from('clients_identity').upsert({
              usage_point_id: prm,
              identity: identityData,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'usage_point_id'
            });

            if (insertError) {
              console.error('❌ Erreur stockage identité:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code'
              });
              return new Response(JSON.stringify({ success: false, error: insertError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            } else {
              console.log('✅ Identité stockée avec succès');
              // Vérifier que l'insertion a bien fonctionné
              const { data: checkData, error: checkError } = await supabase.from('clients_identity').select('*').eq('usage_point_id', prm).maybeSingle();
              if (checkError) {
                console.error('❌ Erreur vérification insertion:', checkError);
              } else if (checkData) {
                console.log('✅ Vérification: donnée bien insérée:', checkData.usage_point_id);
              } else {
                console.error('❌ Vérification: aucune donnée trouvée après insertion');
              }
            }
          } else {
            console.log('⚠️ Aucune donnée identité dans la réponse');
          }

          return new Response(JSON.stringify({
            success: true,
            data: identityData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_address':
        {
          if (!prm) {
            return new Response(JSON.stringify({
              error: 'Missing prm'
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          console.log(`🔍 Récupération adresse pour PDL: ${prm}`);
          const url = `${UPA}/usage_points/addresses?usage_point_id=${prm}`;

          const r = await fetchWithRetry(url, {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: 'application/json'
            }
          });

          if (!r.ok) {
            const errorText = await r.text();
            if (r.status === 404) {
              console.log(`⚠️ Pas d'adresse pour ce PDL (normal): ${r.status}`);
            } else {
              console.error(`❌ Erreur API adresse: ${r.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: null
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const j = await r.json();
          console.log(`📊 Réponse adresse:`, JSON.stringify(j, null, 2));

          // Stocker les données d'adresse
          const addressData = j.customer?.usage_points?.[0]?.usage_point?.usage_point_addresses ?? null;
          if (addressData) {
            console.log('💾 Stockage adresse dans clients_addresses');
            const { error: insertError } = await supabase.from('clients_addresses').upsert({
              usage_point_id: prm,
              address: addressData,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'usage_point_id'
            });

            if (insertError) {
              console.error('❌ Erreur stockage adresse:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code'
              });
            } else {
              console.log('✅ Adresse stockée avec succès');
            }
          } else {
            console.log('⚠️ Aucune donnée adresse dans la réponse');
          }

          return new Response(JSON.stringify({
            success: true,
            data: addressData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_contract':
      case 'get_contracts':
        {
          if (!prm) {
            return new Response(JSON.stringify({
              error: 'Missing prm'
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          console.log(`🔍 Récupération contrat pour PDL: ${prm}`);
          const url = `${UPC}/usage_points/contracts?usage_point_id=${prm}`;
          console.log(`[ENEDIS] Contracts URL: ${url}`);

          const r = await fetchWithRetry(url, {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: 'application/json'
            }
          });

          if (!r.ok) {
            const errorText = await r.text();
            if (r.status === 404) {
              console.log(`⚠️ Pas de contrat pour ce PDL (normal): ${r.status}`);
            } else {
              console.error(`❌ Erreur API contrat: ${r.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: null
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const j = await r.json();
          console.log(`📊 Réponse contrat:`, JSON.stringify(j, null, 2));

          const contractData = j.customer?.usage_points?.[0]?.contracts ?? null;
          if (contractData) {
            console.log('💾 Stockage contrat dans clients_contracts');
            const { error: insertError } = await supabase.from('clients_contracts').upsert({
              usage_point_id: prm,
              contract: contractData,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'usage_point_id'
            });

            if (insertError) {
              console.error('❌ Erreur stockage contrat:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code'
              });
            } else {
              console.log('✅ Contrat stocké avec succès');
            }
          } else {
            console.log('⚠️ Aucune donnée contrat dans la réponse');
          }

          return new Response(JSON.stringify({
            success: true,
            data: contractData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'get_contact':
        {
          if (!prm) {
            return new Response(JSON.stringify({
              error: 'Missing prm'
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          console.log(`🔍 Récupération contact pour PDL: ${prm}`);
          const url = `${CD}/contact_data?usage_point_id=${prm}`;
          console.log(`[ENEDIS] Contact URL: ${url}`);

          const r = await fetchWithRetry(url, {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: 'application/json'
            }
          });

          if (!r.ok) {
            const errorText = await r.text();
            if (r.status === 404) {
              console.log(`⚠️ Pas de contact pour ce PDL (normal): ${r.status}`);
            } else {
              console.error(`❌ Erreur API contact: ${r.status} - ${errorText}`);
            }
            return new Response(JSON.stringify({
              success: true,
              data: null
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          const j = await r.json();
          console.log(`📊 Réponse contact:`, JSON.stringify(j, null, 2));

          // Stocker les données de contact
          const contactData = j.contact_data ?? null;
          if (contactData) {
            console.log('💾 Stockage contact dans clients_contacts');
            const { error: insertError } = await supabase.from('clients_contacts').upsert({
              usage_point_id: prm,
              contact_data: contactData,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'usage_point_id'
            });

            if (insertError) {
              console.error('❌ Erreur stockage contact:', {
                message: insertError.message || 'No message',
                details: insertError.details || 'No details',
                hint: insertError.hint || 'No hint',
                code: insertError.code || 'No code'
              });
            } else {
              console.log('✅ Contact stocké avec succès');
            }
          } else {
            console.log('⚠️ Aucune donnée contact dans la réponse');
          }

          return new Response(JSON.stringify({
            success: true,
            data: contactData
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      case 'compute_weekly_avg':
        {
          if (!prm || !startDate || !endDate) {
            return new Response(JSON.stringify({
              error: 'Missing required parameters',
              required: [
                'prm',
                'startDate',
                'endDate'
              ]
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }

          // Récupérer les données de courbe de charge
          const { data: loadCurveData, error: loadCurveError } = await supabase.from('load_curve_data').select('*').eq('prm', prm).gte('date', startDate).lte('date', endDate).not('value', 'is', null);

          if (loadCurveError) {
            console.error('Error fetching load curve data:', loadCurveError);
            throw new Error(`Error fetching load curve data: ${loadCurveError.message}`);
          }

          // Grouper par (dow, time_slot) et calculer les moyennes
          const aggregates = new Map();
          if (loadCurveData) {
            for (const row of loadCurveData){
              try {
                // Reconstruire startLocal
                const startLocal = DateTime.fromISO(`${row.date}T${row.time}`, {
                  zone: PARIS
                });
                if (!startLocal.isValid) continue;
                const dow = startLocal.weekday; // Luxon: 1=Lundi, 7=Dimanche
                const timeSlot = startLocal.toFormat("HH:mm");
                const key = `${dow}-${timeSlot}`;
                if (row.value != null) {
                  const existing = aggregates.get(key) || {
                    sum: 0,
                    count: 0
                  };
                  existing.sum += row.value;
                  existing.count += 1;
                  aggregates.set(key, existing);
                }
              } catch (error) {
                console.warn('Error processing row:', error);
              }
            }
          }

          // Générer la grille complète 7×48
          const upsertRows = [];
          for(let dow = 1; dow <= 7; dow++){
            for(let hour = 0; hour < 24; hour++){
              for (const minute of [
                0,
                30
              ]){
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const key = `${dow}-${timeSlot}`;
                const agg = aggregates.get(key);
                upsertRows.push({
                  prm,
                  dow,
                  time_slot: timeSlot,
                  n: agg ? agg.count : 0,
                  avg_kw: agg ? agg.sum / agg.count : null
                });
              }
            }
          }

          // Upsert dans la table
          const { error: upsertError } = await supabase.from('load_curve_weekly_avg_30min').upsert(upsertRows, {
            onConflict: 'prm,dow,time_slot'
          });

          if (upsertError) {
            console.error('❌ Erreur insertion moyennes hebdo:', {
              message: upsertError.message || 'No message',
              details: upsertError.details || 'No details',
              hint: upsertError.hint || 'No hint',
              code: upsertError.code || 'No code'
            });
            throw new Error(`Error upserting weekly averages: ${upsertError.message}`);
          }

          const slotsWithData = upsertRows.filter((r)=>r.n > 0).length;
          const nullSlots = 336 - slotsWithData;
          console.log(`✅ Moyennes hebdo: ${slotsWithData}/336 créneaux remplis`);

          return new Response(JSON.stringify({
            success: true,
            data: {
              total_slots: 336,
              slots_with_data: slotsWithData,
              null_slots: nullSlots,
              input_points: loadCurveData?.length || 0
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

      default:
        {
          return new Response(JSON.stringify({
            error: 'Unsupported action',
            action: action,
            supported_actions: [
              'get_consumption',
              'get_load_curve',
              'get_annual_load_curve',
              'get_max_power',
              'get_daily_production',
              'get_production_load_curve',
              'get_identity',
              'get_address',
              'get_contract',
              'get_contracts',
              'get_contact',
              'compute_weekly_avg'
            ]
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});