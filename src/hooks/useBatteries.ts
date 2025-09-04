import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PhysicalBattery } from '../types/battery';

export function useBatteries() {
  const [batteries, setBatteries] = useState<PhysicalBattery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBatteries() {
      try {
        const { data, error } = await supabase
          .from('battery_prices_purchase')
          .select('*')
          .order('capacity');

        if (error) throw error;

        const formattedBatteries: PhysicalBattery[] = data.map(battery => ({
          id: battery.id,
          brand: 'CUSTOM',
          model: battery.model,
          capacity: battery.capacity,
          oneTimePrice: battery.price,
          autoconsumptionIncrease: battery.autoconsumption_increase || 15
        }));

        setBatteries(formattedBatteries);
      } catch (err) {
        console.error('Error fetching batteries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch batteries');
      } finally {
        setLoading(false);
      }
    }

    fetchBatteries();
  }, []);

  return { batteries, loading, error };
}