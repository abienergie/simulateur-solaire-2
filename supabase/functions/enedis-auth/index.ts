import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

// Configuration de l'API Enedis
const ENEDIS_CONFIG = {
  clientId: 'Y_LuB7HsQW3JWYudw7HRmN28FN8a',
  clientSecret: 'Pb9H1p8zJ4IfX0xca5c7lficGo4a',
  redirectUri: 'https://abienergie.github.io/simulateur-solaire/#/oauth/callback',
  tokenUrl: 'https://gw.ext.prod.api.enedis.fr/oauth2/v3/token',
  apiUrl: 'https://gw.ext.prod.api.enedis.fr/metering_data_dc/v5',
  scope: 'fr_be_cons_detail_load_curve fr_be_cons_daily_consumption fr_be_cons_max_power fr_be_prod_daily_production fr_be_identity fr_be_address fr_be_contact'
}

console.log('Enedis Auth Function Starting...')

serve(async (req) => {
  console.log('Received request:', req.url)
  
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // Vérifier si c'est une demande de rafraîchissement de token ou d'obtention de token API
    if (req.method === 'POST') {
      let body = null
      
      try {
        // Parse JSON directly instead of text first
        body = await req.json()
        console.log('Parsed request body:', body)
      } catch (parseError) {
        console.error('Error parsing request body:', parseError)
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
      
      if (body && body.action === 'refresh_token' && body.refresh_token) {
        console.log('Refreshing token...')
        
        const tokenResponse = await fetch(ENEDIS_CONFIG.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: ENEDIS_CONFIG.clientId,
            client_secret: ENEDIS_CONFIG.clientSecret,
            refresh_token: body.refresh_token
          })
        })
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error('Token refresh error:', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            body: errorText
          })
          
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: 'Unknown error', error_description: errorText }
          }
          
          throw new Error(errorData.error_description || `Échec du rafraîchissement du token: ${tokenResponse.status}`)
        }
        
        const data = await tokenResponse.json()
        console.log('Token refreshed successfully')
        
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
      
      // Demande d'un token API (client_credentials)
      if (body && body.action === 'get_api_token') {
        console.log('Requesting API token...')
        console.log('Using client_id:', ENEDIS_CONFIG.clientId)
        
        // Utiliser le format exact qui a fonctionné dans Postman
        const tokenUrl = `${ENEDIS_CONFIG.tokenUrl}?grant_type=client_credentials&client_id=${ENEDIS_CONFIG.clientId}&client_secret=${ENEDIS_CONFIG.clientSecret}`;
        
        console.log('Using token URL:', tokenUrl.replace(ENEDIS_CONFIG.clientSecret, '***'));
        
        // Implémentation du mécanisme de retry avec backoff exponentiel
        let retryCount = 0;
        const maxRetries = 3;
        let tokenResponse = null;
        let responseText = '';
        
        while (retryCount <= maxRetries) {
          try {
            console.log(`Attempt ${retryCount + 1}/${maxRetries + 1} to get token`);
            
            tokenResponse = await fetch(tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
              }
            });
            
            responseText = await tokenResponse.text();
            console.log('Token response status:', tokenResponse.status);
            console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
            
            if (tokenResponse.ok) {
              console.log('Token request successful');
              break; // Sortir de la boucle si la requête a réussi
            }
            
            console.error(`API token request error (attempt ${retryCount + 1}):`, {
              status: tokenResponse.status,
              statusText: tokenResponse.statusText,
              body: responseText
            });
            
            // Si c'est la dernière tentative, sortir de la boucle
            if (retryCount >= maxRetries) {
              break;
            }
            
            // Backoff exponentiel avec jitter
            const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
            console.log(`Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            retryCount++;
          } catch (error) {
            console.error(`Fetch error (attempt ${retryCount + 1}):`, error);
            
            // Si c'est la dernière tentative, sortir de la boucle
            if (retryCount >= maxRetries) {
              break;
            }
            
            // Backoff exponentiel avec jitter
            const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
            console.log(`Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            retryCount++;
          }
        }
        
        if (!tokenResponse || !tokenResponse.ok) {
          console.error('All retry attempts failed');
          
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: 'Unknown error', error_description: responseText };
          }
          
          return new Response(JSON.stringify({
            error: 'API token request failed',
            status: tokenResponse?.status,
            statusText: tokenResponse?.statusText,
            details: errorData,
            config: {
              url: ENEDIS_CONFIG.tokenUrl,
              clientId: ENEDIS_CONFIG.clientId
            }
          }), {
            status: tokenResponse?.status || 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Token data parsed successfully:', {
            token_type: data.token_type,
            expires_in: data.expires_in,
            scope: data.scope
          });
        } catch (parseError) {
          console.error('Error parsing token response:', parseError);
          return new Response(JSON.stringify({
            error: 'Invalid response format',
            details: parseError.message,
            response: responseText
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        console.log('API token obtained successfully');
        
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      console.log('Invalid request - body:', body)
      return new Response(JSON.stringify({ 
        error: 'Invalid request',
        received_body: body,
        expected_actions: ['refresh_token', 'get_api_token']
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // Extraire les paramètres de l'URL
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const usagePointId = url.searchParams.get('usage_point_id')

    console.log('Received params:', { 
      code: code ? '***' + code.slice(-6) : null,
      state,
      usagePointId
    })

    // Si pas de code, retourner la page de test
    if (!code) {
      return new Response(
        'Enedis Auth Function is running!',
        { 
          headers: { 
            'Content-Type': 'text/plain',
            ...corsHeaders
          } 
        }
      )
    }

    // Vérifier l'état pour la sécurité
    if (state !== 'AbieLink1') {
      throw new Error('État invalide')
    }

    // Échange du code contre un token
    console.log('Exchanging code for token...')
    const tokenResponse = await fetch(ENEDIS_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ENEDIS_CONFIG.clientId,
        client_secret: ENEDIS_CONFIG.clientSecret,
        code,
        redirect_uri: ENEDIS_CONFIG.redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText
      })
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: 'Unknown error', error_description: errorText }
      }
      
      throw new Error(errorData.error_description || `Échec de l'échange du token: ${tokenResponse.status}`)
    }

    const data = await tokenResponse.json()
    console.log('Token received successfully')

    // Rediriger vers l'application avec les paramètres
    const appUrl = new URL('https://abienergie.github.io/simulateur-solaire/#/oauth/callback')
    appUrl.searchParams.set('access_token', data.access_token)
    if (data.refresh_token) {
      appUrl.searchParams.set('refresh_token', data.refresh_token)
    }
    if (usagePointId) {
      appUrl.searchParams.set('usage_point_id', usagePointId)
    }

    console.log('Redirecting to:', appUrl.toString().replace(/access_token=([^&]+)/, 'access_token=***'))

    return new Response(null, {
      status: 302,
      headers: {
        'Location': appUrl.toString(),
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Function error:', error)
    
    const errorUrl = new URL('https://abienergie.github.io/simulateur-solaire/#/oauth/callback')
    errorUrl.searchParams.set('error', error.message)
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorUrl.toString(),
        ...corsHeaders
      }
    })
  }
})