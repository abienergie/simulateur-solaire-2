import type { AddressFeature } from '../types/address';

interface AddressResponse {
  type: string;
  version: string;
  features: AddressFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

// Cache for address suggestions to reduce API calls
const suggestionCache = new Map<string, AddressFeature[]>();

// Enhanced circuit breaker configuration with more conservative settings
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  threshold: 10, // Increased from 5 to 10 failures to be more tolerant
  resetTimeout: 300000, // Increased from 60s to 5 minutes (300000ms)
  isOpen: function() {
    if (this.failures >= this.threshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailure;
      if (timeSinceLastFailure < this.resetTimeout) {
        return true;
      }
      // Reset circuit breaker after timeout
      this.failures = 0;
    }
    return false;
  },
  recordFailure: function() {
    this.failures++;
    this.lastFailure = Date.now();
    console.log(`Circuit breaker failures: ${this.failures}/${this.threshold}`);
  },
  reset: function() {
    this.failures = 0;
    this.lastFailure = 0;
  }
};

// Extended fallback data for common cities
const FALLBACK_CITIES: { [key: string]: { lat: number; lon: number } } = {
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Lyon': { lat: 45.7578, lon: 4.8320 },
  'Marseille': { lat: 43.2965, lon: 5.3698 },
  'Bordeaux': { lat: 44.8378, lon: -0.5792 },
  'Lille': { lat: 50.6292, lon: 3.0573 },
  'Toulouse': { lat: 43.6047, lon: 1.4442 },
  'Nice': { lat: 43.7102, lon: 7.2620 },
  'Nantes': { lat: 47.2184, lon: -1.5536 },
  'Strasbourg': { lat: 48.5734, lon: 7.5734 },
  'Montpellier': { lat: 43.6108, lon: 3.8767 },
  // Added more major cities for better coverage
  'Rennes': { lat: 48.1173, lon: -1.6778 },
  'Grenoble': { lat: 45.1885, lon: 5.7245 },
  'Rouen': { lat: 49.4431, lon: 1.0993 },
  'Toulon': { lat: 43.1242, lon: 5.9280 },
  'Dijon': { lat: 47.3220, lon: 5.0415 }
};

export async function getSuggestions(query: string): Promise<AddressFeature[]> {
  if (!query || query.length < 3) return [];

  try {
    const cleanQuery = query.trim();
    
    // Check cache first
    const cacheKey = cleanQuery.toLowerCase();
    if (suggestionCache.has(cacheKey)) {
      console.log('Using cached address suggestions for:', cleanQuery);
      return suggestionCache.get(cacheKey) || [];
    }

    // Check circuit breaker before making API call
    if (circuitBreaker.isOpen()) {
      console.warn('Address API circuit breaker is open - using fallback data');
      return getFallbackResults(cleanQuery);
    }
    
    // Reduced timeout to 5 seconds for faster fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('Address API request timeout (5s) - using fallback');
    }, 5000); // Reduced from 20s to 5s

    try {
      console.log('Fetching address suggestions for:', cleanQuery.substring(0, 20) + '...');
      
      const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanQuery)}&limit=5&autocomplete=1`;
      
      const response = await fetchWithRetry(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Simulateur Solaire/1.0'
        }
      }, 2); // Reduced retries to 2 to fail faster when service is down
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API address error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data: AddressResponse = await response.json();
      
      if (!Array.isArray(data.features)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format');
      }

      // Filter for relevant results
      const filteredResults = data.features.filter(feature => 
        feature.properties.type === 'housenumber' || 
        feature.properties.type === 'street'
      );
      
      console.log(`Received ${filteredResults.length} address suggestions`);
      
      // Cache the results and reset circuit breaker on success
      suggestionCache.set(cacheKey, filteredResults);
      circuitBreaker.reset();
      
      return filteredResults;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Record failure in circuit breaker
      circuitBreaker.recordFailure();
      
      if (fetchError.name === 'AbortError') {
        console.error('Address API request timeout');
        // Check cache again in case it was populated by another request
        const cachedResults = suggestionCache.get(cacheKey);
        if (cachedResults) {
          return cachedResults;
        }
      }
      
      // Enhanced error logging for network errors
      console.warn('Address API unavailable:', fetchError.name === 'AbortError' ? 'Timeout' : fetchError.message);
      
      return getFallbackResults(cleanQuery);
    }
  } catch (error) {
    console.warn('Address suggestions service unavailable:', error.message || 'Network error');
    return getFallbackResults(query.trim());
  }
}

// Enhanced fallback function with better matching and user feedback
function getFallbackResults(query: string): AddressFeature[] {
  const normalizedQuery = query.toLowerCase();
  
  // Try to match query against fallback cities
  const matchingCities = Object.keys(FALLBACK_CITIES).filter(city => 
    city.toLowerCase().includes(normalizedQuery) || 
    normalizedQuery.includes(city.toLowerCase())
  );

  if (matchingCities.length > 0) {
    return matchingCities.map(city => {
      const coords = FALLBACK_CITIES[city];
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords.lon, coords.lat]
        },
        properties: {
          label: `${city} (Service temporairement indisponible - Saisie manuelle recommandée)`,
          score: 1,
          type: 'city',
          name: city,
          postcode: '',
          citycode: '',
          x: coords.lon,
          y: coords.lat,
          city: city,
          context: '',
          id: '',
          importance: 1,
          street: '',
          housenumber: ''
        }
      };
    });
  }
  
  // If no city matches, return a single result indicating manual entry is needed
  return [{
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [2.3522, 48.8566] // Default to Paris coordinates
    },
    properties: {
      label: 'Service de suggestion d\'adresses temporairement indisponible. Veuillez saisir votre adresse manuellement.',
      score: 0,
      type: 'message',
      name: '',
      postcode: '',
      citycode: '',
      x: 2.3522,
      y: 48.8566,
      city: '',
      context: '',
      id: '',
      importance: 0,
      street: '',
      housenumber: ''
    }
  }];
}

// Improved fetch retry utility with exponential backoff and jitter
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff with jitter: base * (2^attempt) + random(0-1000ms)
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 20000);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} for ${url} after ${Math.round(backoffDelay)}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      // Check if signal is already aborted before making the request
      if (options.signal?.aborted) {
        throw new Error('Request was aborted');
      }
      
      const response = await fetch(url, options);
      
      // Consider 504 errors as service unavailability
      if (response.status === 504) {
        throw new Error('Gateway Timeout - Service temporarily unavailable');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, {
        attempt: attempt + 1,
        maxRetries,
        url,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        }
      });
      
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if the request was aborted
      if (error instanceof Error && (error.name === 'AbortError' || options.signal?.aborted)) {
        throw error;
      }
      
      // On last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error(`Failed to fetch after ${maxRetries} attempts`);
}

// Enhanced address validation function
export function validateAddress(address: string, postalCode: string, city: string): boolean {
  return (
    address.length > 3 && 
    postalCode.length === 5 && 
    /^\d{5}$/.test(postalCode) && 
    city.length > 1
  );
}

// Enhanced fallback coordinates function
export function getFallbackCoordinates(city: string): { lat: number; lon: number } | null {
  const normalizedCity = city.trim().toLowerCase();
  
  for (const [key, coords] of Object.entries(FALLBACK_CITIES)) {
    if (key.toLowerCase() === normalizedCity) {
      return coords;
    }
  }
  
  // Default to center of France if city not found
  return { lat: 46.603354, lon: 1.888334 };
}