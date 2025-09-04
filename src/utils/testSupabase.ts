import { supabase } from '../lib/supabase';

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Try to fetch system health
    const { error } = await supabase.from('consumption_data').select('count').limit(0);
    
    // If no error, connection is working
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}