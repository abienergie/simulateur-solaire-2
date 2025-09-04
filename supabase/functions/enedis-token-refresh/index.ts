// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Import Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Configuration de l'API Enedis
const ENEDIS_CONFIG = {
  clientId: 'Y_LuB7HsQW3JWYudw7HRmN28FN8a',
  clientSecret: 'Pb9H1p8zJ4IfX0xca5c7lficGo4a',
  tokenUrl: 'https://gw.ext.prod.api.enedis.fr/oauth2/v3/token',
  scope: 'fr_be_cons_detail_load_curve fr_be_cons_daily_consumption fr_be_cons_max_power fr_be_prod_daily_production fr_be_identity fr_be_address fr_be_contact'
};

console.log('Enedis Token Refresh Function Starting...');
console.log('Version: 1.1.0 - Fixed Token Expiry');

Deno.serve(async (req) => {
  console.log('Received request:', req.url, 'Method:', req.method);
  
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Extraire les paramètres de l'URL
    const url = new URL(req.url);
    const isScheduled = url.searchParams.get('scheduled') === 'true';
    const debug = url.searchParams.get('debug') === 'true';
    
    if (debug) {
      console.log('Debug mode enabled');
      console.log('URL parameters:', Object.fromEntries(url.searchParams.entries()));
    }
    
    // Implémentation du mécanisme de retry avec backoff exponentiel
    let retryCount = 0;
    const maxRetries = 3;
    let tokenResponse = null;
    let responseText = '';
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1}/${maxRetries + 1} to get token`);
        
        // Utiliser le format exact qui a fonctionné dans Postman
        const tokenUrl = `${ENEDIS_CONFIG.tokenUrl}?grant_type=client_credentials&client_id=${ENEDIS_CONFIG.clientId}&client_secret=${ENEDIS_CONFIG.clientSecret}`;
        
        console.log('Using token URL:', tokenUrl.replace(ENEDIS_CONFIG.clientSecret, '***'));
        
        tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        });
        
        console.log('Token response status:', tokenResponse.status);
        
        responseText = await tokenResponse.text();
        
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
    
    // Calculer la date d'expiration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (data.expires_in * 1000));
    
    // Stocker le token dans la base de données
    try {
      // First, deactivate ALL existing tokens to ensure only one is active
      const { error: deactivateError } = await supabase
        .from('enedis_tokens')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all tokens
      
      if (deactivateError) {
        console.error('Error deactivating existing tokens:', deactivateError);
        // Don't throw here, continue with insertion
      }
      
      // Insert the new token as the only active one
      const { error: insertError } = await supabase
        .from('enedis_tokens')
        .insert({
          token_type: data.token_type,
          access_token: data.access_token,
          expires_in: data.expires_in,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_at: now.toISOString()
        });
      
      if (insertError) {
        console.error('Error inserting new token:', insertError);
        throw new Error(`Failed to store token: ${insertError.message}`);
      }
      
      // Clean up old tokens (keep only the 5 most recent)
      const { error: cleanupError } = await supabase
        .rpc('cleanup_old_tokens');
      
      if (cleanupError) {
        console.warn('Warning: Could not clean up old tokens:', cleanupError);
        // Don't throw, this is not critical
      }
      
      console.log('Token successfully stored in database');
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(JSON.stringify({
        error: 'Failed to store token in database',
        details: dbError.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Si c'est une demande programmée, retourner un message simple
    if (isScheduled) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Token refreshed successfully',
        expires_at: expiresAt.toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Sinon, retourner le token complet
    return new Response(JSON.stringify({
      ...data,
      expires_at: expiresAt.toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({ 
      error: true, 
      message: error.message || 'Une erreur est survenue'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});