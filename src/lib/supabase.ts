import { createClient } from '@supabase/supabase-js';

// Vérification des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');
  throw new Error('Configuration Supabase incomplète. Vérifiez vos variables d\'environnement.');
} else {
  console.log('✅ Client Supabase initialisé avec succès pour l\'environnement de production');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);