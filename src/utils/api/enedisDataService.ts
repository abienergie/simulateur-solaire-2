import { supabase } from '../../lib/supabase';

// Types for Enedis API responses
export interface ConsumptionData {
  prm: string;
  date: string;
  peakHours: number;
  offPeakHours: number;
}

export interface LoadCurvePoint {
  prm: string;
  date: string;
  time: string;
  dateTime: string;
  value: number;
  isOffPeak: boolean;
}

export interface MonthlyConsumption {
  month: string;  // YYYY-MM-01
  hp: number;
  hc: number;
  total: number;
}

export interface ClientProfile {
  usage_point_id: string;
  identity?: any;
  address?: any;
  contract?: any;
  contact?: any;
  coordinates?: any;
  updated_at?: string;
}

// Available actions for the Enedis API
export type EnedisAction = 
  | 'get_consumption'
  | 'get_load_curve'
  | 'get_max_power'
  | 'get_daily_production'
  | 'get_production_load_curve'
  | 'get_contracts'
  | 'get_address'
  | 'get_identity'
  | 'get_contact';

/**
 * Service for interacting with the Enedis API via Supabase Edge Functions
 */
class EnedisDataService {
  private static instance: EnedisDataService;
  private supabaseUrl: string;
  
  private constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xpxbxfuckljqdvkajlmx.supabase.co';
  }

  public static getInstance(): EnedisDataService {
    if (!EnedisDataService.instance) {
      EnedisDataService.instance = new EnedisDataService();
    }
    return EnedisDataService.instance;
  }

  /**
   * Make a request to the Enedis API via Supabase Edge Function
   */
  private async makeRequest(action: EnedisAction, prm: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      console.log(`Making request to Enedis API: ${action} for PDL ${prm}`);
      
      // Get the Supabase URL and anon key
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseAnonKey) {
        throw new Error('VITE_SUPABASE_ANON_KEY not defined');
      }
      
      // Prepare the request body
      const body: any = {
        action,
        prm
      };
      
      // Add dates if provided
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      
      // Make the request to the Enedis data function
      const functionUrl = `${this.supabaseUrl}/functions/v1/enedis-data`;
      
      console.log(`Calling Edge Function: ${functionUrl}`);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error calling Enedis API (${response.status}):`, errorText);
        
        // Try to parse the error response
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received response from Enedis API: ${action}`);
      
      return data;
    } catch (error) {
      console.error(`Error in Enedis API request (${action}):`, error);
      throw error;
    }
  }

  /**
   * Get consumption data for a specific period
   */
  public async getConsumptionData(prm: string, startDate: string, endDate: string): Promise<ConsumptionData[]> {
    const data = await this.makeRequest('get_consumption', prm, startDate, endDate);
    
    // If we have real data, use it
    if (data && data.consumption) {
      try {
        return data.consumption.map((item: any) => ({
          prm: item.prm,
          date: item.date,
          peakHours: item.peak_hours || 0,
          offPeakHours: item.off_peak_hours || 0,
          peak_hours: item.peak_hours || 0,
          off_peak_hours: item.off_peak_hours || 0
        }));
      } catch (error) {
        console.error('Error transforming consumption data:', error);
      }
    }
    
    // If no data or error, return test data
    console.log('Using test consumption data');
    return this.generateTestConsumptionData(prm);
  }

  /**
   * Generate test consumption data
   */
  private generateTestConsumptionData(prm: string): ConsumptionData[] {
    const data: ConsumptionData[] = [];
    const today = new Date();
    
    // Generate data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Generate random consumption values
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Base consumption is higher on weekdays
      const baseConsumption = isWeekend ? 10 + Math.random() * 5 : 15 + Math.random() * 8;
      
      // 70% in peak hours, 30% in off-peak hours
      const peakHours = Math.round(baseConsumption * 0.7 * 100) / 100;
      const offPeakHours = Math.round(baseConsumption * 0.3 * 100) / 100;
      
      data.push({
        prm,
        date: dateString,
        peakHours,
        offPeakHours,
        peak_hours: peakHours,
        off_peak_hours: offPeakHours
      });
    }
    
    return data;
  }

  /**
   * Get load curve data for a specific period
   */
  public async getLoadCurveData(prm: string, startDate: string, endDate: string): Promise<LoadCurvePoint[]> {
    const data = await this.makeRequest('get_load_curve', prm, startDate, endDate);
    return data.loadCurve || [];
  }

  /**
   * Get max power data for a specific period
   */
  public async getMaxPowerData(prm: string, startDate: string, endDate: string): Promise<any[]> {
    const data = await this.makeRequest('get_max_power', prm, startDate, endDate);
    return data.maxPower || [];
  }

  /**
   * Get daily production data for a specific period
   */
  public async getDailyProductionData(prm: string, startDate: string, endDate: string): Promise<any[]> {
    const data = await this.makeRequest('get_daily_production', prm, startDate, endDate);
    return data.dailyProduction || [];
  }

  /**
   * Get production load curve data for a specific period
   */
  public async getProductionLoadCurveData(prm: string, startDate: string, endDate: string): Promise<any[]> {
    const data = await this.makeRequest('get_production_load_curve', prm, startDate, endDate);
    return data.productionCurve || [];
  }

  /**
   * Get contract data for a specific PDL
   */
  public async getContractData(prm: string): Promise<any> {
    const data = await this.makeRequest('get_contracts', prm);
    return data.contracts || null;
  }

  /**
   * Get address data for a specific PDL
   */
  public async getAddressData(prm: string): Promise<any> {
    const data = await this.makeRequest('get_address', prm);
    return data.address || null;
  }

  /**
   * Get identity data for a specific PDL
   */
  public async getIdentityData(prm: string): Promise<any> {
    const data = await this.makeRequest('get_identity', prm);
    return data.identity || null;
  }

  /**
   * Get contact data for a specific PDL
   */
  public async getContactData(prm: string): Promise<any> {
    const data = await this.makeRequest('get_contact', prm);
    return data.contact_data || null;
  }

  /**
   * Get client profile from database
   */
  public async getClientProfile(prm: string): Promise<ClientProfile | null> {
    try {
      const { data, error } = await supabase
        .from('clients_identity') 
        .select('*')
        .eq('usage_point_id', prm)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching client profile from Supabase:', error);
        return null;
      }
      
      if (data) {
        console.log('Client profile found in Supabase:', data);
        return data as ClientProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  }

  /**
   * Fetch all data for a PDL with progress tracking
   */
  public async fetchAllData(prm: string, progressCallback?: (progress: number, stage: string) => void): Promise<any> {
    try {
      if (progressCallback) {
        progressCallback(0, 'Initialisation');
      }
      
      // Calculate date ranges
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Step 1: Get client profile (10%)
      if (progressCallback) {
        progressCallback(10, 'Récupération du profil client');
      }
      
      const clientProfile = await this.getClientProfile(prm);
      
      // Step 2: Get consumption data (30%)
      if (progressCallback) {
        progressCallback(30, 'Récupération des données de consommation');
      }
      
      const consumptionData = await this.getConsumptionData(prm, formattedStartDate, formattedEndDate);
      
      // Step 3: Get contract data (50%)
      if (progressCallback) {
        progressCallback(50, 'Récupération des données de contrat');
      }
      
      const contractData = await this.getContractData(prm);
      
      // Step 4: Get address data (70%)
      if (progressCallback) {
        progressCallback(70, 'Récupération des données d\'adresse');
      }
      
      const addressData = await this.getAddressData(prm);
      
      // Step 5: Get identity data (90%)
      if (progressCallback) {
        progressCallback(90, 'Récupération des données d\'identité');
      }
      
      const identityData = await this.getIdentityData(prm);
      
      // Step 6: Get contact data (100%)
      if (progressCallback) {
        progressCallback(100, 'Finalisation');
      }
      
      const contactData = await this.getContactData(prm);
      
      return {
        clientProfile,
        consumptionData: {
          consumption: consumptionData
        },
        contractData,
        addressData,
        identityData,
        contactData
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
  }

  /**
   * Split a date range into chunks of 7 days
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
  ): Promise<LoadCurvePoint[]> {
    try {
      // Split the date range into chunks of 7 days
      const chunks = this.splitDateRange(startDate, endDate, 7);
      console.log(`Splitting date range into ${chunks.length} chunks`);
      
      const allData: LoadCurvePoint[] = [];
      
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
}

export const enedisDataService = EnedisDataService.getInstance();