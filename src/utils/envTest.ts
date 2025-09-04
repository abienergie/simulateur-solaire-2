/**
 * Utilitaire pour tester les variables d'environnement
 */

export function logEnvVars() {
  console.log('Variables d\'environnement:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Définie' : 'Non définie');
  console.log('VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 5)}...` : 'Non définie');
  console.log('VITE_GOOGLE_MAPS_API_KEY (longueur):', import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0);
}