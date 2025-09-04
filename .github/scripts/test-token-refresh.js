/**
 * Script pour tester le rafraîchissement du token Enedis
 * Ce script appelle la fonction Edge Supabase pour obtenir un nouveau token
 */

import https from 'https';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xpxbxfuckljqdvkajlmx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

console.log('Starting Enedis token refresh test...');
console.log(`Using Supabase URL: ${SUPABASE_URL}`);

// Exécuter la fonction avec gestion des erreurs et retries
async function executeWithRetry(fn, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      console.error(`Attempt ${retries}/${maxRetries} failed:`, error.message);
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Appeler la fonction Edge Supabase pour obtenir un token
async function getEnedisToken() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/enedis-token-refresh`);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`Calling Edge Function: ${url.toString()}`);
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            console.log('Token request successful:', {
              access_token: jsonData.access_token ? '***' : undefined,
              token_type: jsonData.token_type,
              expires_in: jsonData.expires_in,
              expires_at: jsonData.expires_at
            });
            resolve(jsonData);
          } catch (e) {
            console.log('Response is not JSON:', data);
            resolve(data);
          }
        } else {
          console.error(`HTTP Error: ${res.statusCode}`);
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
executeWithRetry(getEnedisToken)
  .then((result) => {
    console.log('Test completed successfully');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during test:', error.message);
    process.exit(1);
  });