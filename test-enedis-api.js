// Script pour tester la connexion à l'API Enedis
import 'dotenv/config';
import https from 'https';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xpxbxfuckljqdvkajlmx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

console.log('Starting Enedis API test...');
console.log(`Using Supabase URL: ${SUPABASE_URL}`);

// Fonction pour tester la connexion à l'API Enedis
async function testEnedisApi() {
  return new Promise((resolve, reject) => {
    // Tester d'abord la fonction enedis-token-refresh
    console.log('Testing enedis-token-refresh function...');
    
    const tokenRefreshUrl = new URL(`${SUPABASE_URL}/functions/v1/enedis-token-refresh`);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`Calling Edge Function: ${tokenRefreshUrl.toString().replace(/Bearer [^&]+/, 'Bearer ***')}`);
    
    const req = https.request(tokenRefreshUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
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

// Tester la fonction enedis-auth pour obtenir un token API
async function testEnedisAuth() {
  return new Promise((resolve, reject) => {
    console.log('Testing enedis-auth function for API token...');
    
    const authUrl = new URL(`${SUPABASE_URL}/functions/v1/enedis-auth`);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`Calling Edge Function: ${authUrl.toString().replace(/Bearer [^&]+/, 'Bearer ***')}`);
    
    const req = https.request(authUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            console.log('API token request successful:', {
              token_type: jsonData.token_type,
              expires_in: jsonData.expires_in
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
    
    // Ajouter le corps de la requête pour demander un token API
    req.write(JSON.stringify({
      action: 'get_api_token'
    }));
    req.end();
  });
}

// Tester directement l'API Enedis avec la méthode qui a fonctionné dans Postman
async function testDirectEnedisApi() {
  return new Promise((resolve, reject) => {
    console.log('Testing direct Enedis API call (Postman method)...');
    
    const tokenUrl = new URL('https://gw.ext.prod.api.enedis.fr/oauth2/v3/token');
    tokenUrl.searchParams.append('grant_type', 'client_credentials');
    tokenUrl.searchParams.append('client_id', 'Y_LuB7HsQW3JWYudw7HRmN28FN8a');
    tokenUrl.searchParams.append('client_secret', 'Pb9H1p8zJ4IfX0xca5c7lficGo4a');
    
    console.log(`Calling Enedis API directly: ${tokenUrl.toString().replace(/client_secret=[^&]+/, 'client_secret=***')}`);
    
    const req = https.request(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            console.log('Direct API token request successful:', {
              token_type: jsonData.token_type,
              expires_in: jsonData.expires_in
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

// Exécuter les tests
async function runTests() {
  try {
    // Test 0: Tester directement l'API Enedis avec la méthode Postman
    console.log('\n=== TEST 0: Direct Enedis API call (Postman method) ===');
    await testDirectEnedisApi();
    
    // Test 1: Tester la fonction enedis-token-refresh
    console.log('\n=== TEST 1: enedis-token-refresh ===');
    await testEnedisApi();
    
    // Test 2: Tester la fonction enedis-auth pour obtenir un token API
    console.log('\n=== TEST 2: enedis-auth (get_api_token) ===');
    await testEnedisAuth();
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  }
}

runTests();