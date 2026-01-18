import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SpreadLevel } from '@/hooks/useBalanceSpread';

interface BalanceStatusEntry {
  level: SpreadLevel;
  spread: number;
  minValue: number;
  maxValue: number;
  minSphereId: number | null;
  maxSphereId: number | null;
  allSpheresAboveMinimum: boolean;
  starsAwarded?: number;
}

export function useBalanceStatusHistory() {
  const { user } = useAuth();

  const saveStatusChange = useCallback(async (entry: BalanceStatusEntry) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('balance_status_history')
        .insert({
          user_id: user.id,
          level: entry.level,
          spread: entry.spread,
          min_value: entry.minValue,
          max_value: entry.maxValue,
          min_sphere_id: entry.minSphereId,
          max_sphere_id: entry.maxSphereId,
          all_spheres_above_minimum: entry.allSpheresAboveMinimum,
          stars_awarded: entry.starsAwarded || 0,
        });

      if (error) {
        console.error('Error saving balance status history:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error saving balance status history:', err);
      return false;
    }
  }, [user]);

  const getStatusHistory = useCallback(async (limit = 50) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('balance_status_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching balance status history:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching balance status history:', err);
      return [];
    }
  }, [user]);

  return {
    saveStatusChange,
    getStatusHistory,
  };
}
