import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays, subMonths } from 'date-fns';

interface LifeIndexRecord {
  id: string;
  user_id: string;
  life_index: number;
  personal_energy: number | null;
  external_success: number | null;
  mindfulness_level: number | null;
  sphere_indices: Record<string, number> | null;
  recorded_at: string;
  created_at: string;
}

interface FormattedHistoryData {
  date: string;
  value: number;
  label: string;
}

export function useLifeIndexHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Save today's life index
  const saveLifeIndex = useCallback(async (
    lifeIndex: number,
    personalEnergy?: number,
    externalSuccess?: number,
    mindfulnessLevel?: number,
    sphereIndices?: Record<string, number>
  ) => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Upsert to handle one record per day
      const { error } = await supabase
        .from('life_index_history')
        .upsert({
          user_id: user.id,
          life_index: lifeIndex,
          personal_energy: personalEnergy,
          external_success: externalSuccess,
          mindfulness_level: mindfulnessLevel,
          sphere_indices: sphereIndices,
          recorded_at: today,
        }, {
          onConflict: 'user_id,recorded_at',
        });

      if (error) {
        console.error('Error saving life index:', error);
      }
    } catch (err) {
      console.error('Error saving life index:', err);
    }
  }, [user]);

  // Fetch history for period
  const fetchHistory = useCallback(async (
    period: 'month' | 'year',
    locale: Locale
  ): Promise<FormattedHistoryData[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const now = new Date();
      const startDate = period === 'month' 
        ? format(subDays(now, 30), 'yyyy-MM-dd')
        : format(subMonths(now, 12), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('life_index_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate)
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error fetching life index history:', error);
        return [];
      }

      // Format data based on period
      if (period === 'month') {
        return (data as LifeIndexRecord[]).map(record => ({
          date: record.recorded_at,
          value: Number(record.life_index),
          label: format(new Date(record.recorded_at), 'd MMM', { locale }),
        }));
      } else {
        // Aggregate by month for year view
        const monthlyData = new Map<string, { sum: number; count: number }>();
        
        (data as LifeIndexRecord[]).forEach(record => {
          const monthKey = format(new Date(record.recorded_at), 'yyyy-MM');
          const existing = monthlyData.get(monthKey) || { sum: 0, count: 0 };
          monthlyData.set(monthKey, {
            sum: existing.sum + Number(record.life_index),
            count: existing.count + 1,
          });
        });

        return Array.from(monthlyData.entries()).map(([monthKey, { sum, count }]) => ({
          date: monthKey,
          value: Math.round(sum / count),
          label: format(new Date(monthKey + '-01'), 'MMM', { locale }),
        }));
      }
    } catch (err) {
      console.error('Error fetching life index history:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    saveLifeIndex,
    fetchHistory,
  };
}

// Re-export Locale type for consumers
import type { Locale } from 'date-fns';
export type { Locale };
