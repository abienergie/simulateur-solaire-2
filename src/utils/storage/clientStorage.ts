import { ClientInfo, Address } from '../../types/client';

const STORAGE_KEY = 'solar_client_data';

interface StoredData {
  clientInfo: ClientInfo;
  address: Address;
}

export function saveClientData(data: StoredData): void {
  try {
    // Ensure we're not storing any undefined values that could cause issues
    const cleanData = {
      clientInfo: {
        civilite: data.clientInfo.civilite || '',
        nom: data.clientInfo.nom || '',
        prenom: data.clientInfo.prenom || '',
        telephone: data.clientInfo.telephone || '',
        email: data.clientInfo.email || '',
        adresse: data.clientInfo.adresse || '',
        codePostal: data.clientInfo.codePostal || '',
        ville: data.clientInfo.ville || ''
      },
      address: {
        rue: data.address.rue || '',
        codePostal: data.address.codePostal || '',
        ville: data.address.ville || '',
        pays: data.address.pays || 'France',
        region: data.address.region || '',
        coordinates: data.address.coordinates || undefined
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
  } catch (error) {
    console.error('Error saving client data:', error);
  }
}

export function loadClientData(): StoredData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Validate the structure to prevent errors
    if (!data.clientInfo || !data.address) {
      console.warn('Invalid client data structure in storage, resetting');
      clearClientData();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading client data:', error);
    // If there's an error parsing, clear the corrupted data
    clearClientData();
    return null;
  }
}

export function clearClientData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    
    // Preserve authentication tokens if they exist
    const authToken = sessionStorage.getItem('auth_token');
    if (authToken) {
      sessionStorage.setItem('auth_token', authToken);
    }
  } catch (error) {
    console.error('Error clearing client data:', error);
  }
}

// Helper function to check if client data is complete
export function isClientDataComplete(data: StoredData): boolean {
  const { clientInfo, address } = data;
  
  // Vérifier les champs d'adresse dans les deux objets
  const hasAddressInClientInfo = !!(clientInfo.adresse && clientInfo.codePostal && clientInfo.ville);
  const hasAddressInAddress = !!(address.rue && address.codePostal && address.ville);
  
  return !!(
    clientInfo.civilite &&
    clientInfo.nom &&
    clientInfo.prenom &&
    clientInfo.telephone &&
    clientInfo.email &&
    (hasAddressInClientInfo || hasAddressInAddress)
  );
}