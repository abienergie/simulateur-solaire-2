import { supabase } from '../lib/supabase';

export async function listSalespeople() {
  try {
    const { data, error } = await supabase
      .from('salespeople')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des commerciaux:', error);
    throw error;
  }
}