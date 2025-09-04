/**
 * Script pour rafraîchir automatiquement le token API Enedis
 * Ce script est exécuté par GitHub Actions toutes les 3 heures
 */

// Utiliser import au lieu de require pour la compatibilité ES modules
import https from 'https';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('SUPABASE_ANON_KEY ou VITE_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

console.log('Starting Enedis token refresh process...');
console.log(`Using Supabase URL: ${SUPABASE_URL}`);
console.log('Waiting 2 seconds before starting...');

// Attendre 2 secondes avant de démarrer pour éviter les problèmes de rate limiting
await new Promise(resolve => setTimeout(resolve, 2000));

// Exécuter la fonction avec gestion des erreurs et retries
async function executeWithRetry(fn, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      console.error(`Attempt ${retries}/${maxRetries} failed:`, error.message);
      
      // Afficher les informations de réponse si disponibles
      if (error.response) {
        console.log('Response status code:', error.response.statusCode);
        console.log('Response headers:', error.response.headers);
      }
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 2000; // Augmenter le délai initial à 2 secondes
      console.log(`Retrying in ${delay / 1000} seconds...`);
      
      // Ajouter un délai supplémentaire pour éviter les problèmes de rate limiting
      const bufferDelay = 2000; // 2 secondes supplémentaires
      const actualDelay = delay + bufferDelay;
      console.log(`Adding extra delay buffer, actual wait: ${actualDelay / 1000} seconds`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Appeler la fonction Edge Supabase pour rafraîchir le token
async function refreshEnedisToken() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/enedis-token-refresh`);
    url.searchParams.append('scheduled', 'true'); 
    url.searchParams.append('debug', 'true');
    url.searchParams.append('timestamp', Date.now().toString());
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`Calling Edge Function: ${url.toString().replace(/Bearer [^&]+/, 'Bearer ***')}`);
    
    const req = https.request(url, options, (res) => {
      console.log('Response status code:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response received, length:', data.length);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            console.log('Token refresh successful:', {
              success: jsonData.success,
              expires_at: jsonData.expires_at
            });
            resolve(jsonData);
          } catch (e) {
            console.log('Response is not JSON:', data);
            resolve(data);
          }
        } else {
          console.error(`HTTP Error: ${res.statusCode}`);
          console.error('Response headers:', res.headers);
          console.error('Response:', data);
          reject(new Error(`HTTP Error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Exécuter la fonction
executeWithRetry(refreshEnedisToken)
  .then(() => {
    console.log('Token refresh completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error refreshing token:', error.message);
    process.exit(1);
  });