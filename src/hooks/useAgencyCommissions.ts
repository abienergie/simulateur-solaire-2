import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AgencyCommission {
  id: string;
  power_kwc: number;
  commission_commercial: number;
  commission_super_regie: number;
}

export function useAgencyCommissions() {
  const [commissions, setCommissions] = useState<AgencyCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommissions() {
      try {
        const { data, error } = await supabase
          .from('agency_commissions')
          .select('*')
          .order('power_kwc');

        if (error) throw error;

        setCommissions(data);
      } catch (err) {
        console.error('Error fetching commissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch commissions');
      } finally {
        setLoading(false);
      }
    }

    fetchCommissions();
  }, []);

  return { commissions, loading, error };
}