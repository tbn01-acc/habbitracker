import { useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  SPHERES, 
  SphereIndex, 
  LifeIndexData, 
  INDEX_WEIGHTS,
  getPersonalSpheres,
  getSocialSpheres,
  getSphereById,
} from '@/types/sphere';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface SphereStats {
  totalTasks: number;
  completedTasks: number;
  totalHabits: number;
  completedHabits: number;
  hasRecentActivity: boolean;
  totalTimeMinutes: number;
  totalIncome: number;
  totalExpense: number;
}

// Cache the sphere lists at module level to avoid recalculating
const PERSONAL_SPHERES = getPersonalSpheres();
const SOCIAL_SPHERES = getSocialSpheres();

export function useSpheres() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchSphereStats = useCallback(async (sphereId: number): Promise<SphereStats> => {
    if (!user) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalHabits: 0,
        completedHabits: 0,
        hasRecentActivity: false,
        totalTimeMinutes: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    const now = new Date();
    const fortyEightHoursAgo = subDays(now, 2).toISOString();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const today = format(now, 'yyyy-MM-dd');

    try {
      // Get active goals for this sphere
      const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId)
        .eq('status', 'active');

      const goalIds = goals?.map(g => g.id) || [];

      // Get tasks in active goals of this sphere
      let totalTasks = 0;
      let completedTasks = 0;

      if (goalIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, completed')
          .eq('user_id', user.id)
          .in('goal_id', goalIds);

        totalTasks = tasks?.length || 0;
        completedTasks = tasks?.filter(t => t.completed).length || 0;
      }

      // Get habits for this sphere (current week completion)
      const { data: habits } = await supabase
        .from('habits')
        .select('id, completed_dates, target_days')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId)
        .is('archived_at', null);

      const totalHabits = habits?.length || 0;
      let completedHabits = 0;

      if (habits && habits.length > 0) {
        // Calculate weekly habit completion
        const daysInWeek = 7;
        let totalExpectedCompletions = 0;
        let actualCompletions = 0;

        habits.forEach(habit => {
          const targetDays = habit.target_days || [0, 1, 2, 3, 4, 5, 6];
          totalExpectedCompletions += targetDays.length;

          const completedDates = habit.completed_dates || [];
          // Count completions within this week
          const weeklyCompletions = completedDates.filter((date: string) => 
            date >= weekStart && date <= weekEnd
          ).length;
          actualCompletions += Math.min(weeklyCompletions, targetDays.length);
        });

        completedHabits = totalExpectedCompletions > 0 
          ? Math.round((actualCompletions / totalExpectedCompletions) * 100)
          : 0;
      }

      // Check for recent activity (time entries or transactions in last 48 hours)
      const { data: recentTimeEntries } = await supabase
        .from('time_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId)
        .gte('created_at', fortyEightHoursAgo)
        .limit(1);

      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId)
        .gte('created_at', fortyEightHoursAgo)
        .limit(1);

      const hasRecentActivity = 
        (recentTimeEntries && recentTimeEntries.length > 0) ||
        (recentTransactions && recentTransactions.length > 0);

      // Get total time spent
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId);

      const totalTimeMinutes = Math.round(
        (timeEntries?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0) / 60
      );

      // Get financial data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId);

      const totalIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalExpense = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      return {
        totalTasks,
        completedTasks,
        totalHabits,
        completedHabits,
        hasRecentActivity,
        totalTimeMinutes,
        totalIncome,
        totalExpense,
      };
    } catch (error) {
      console.error('Error fetching sphere stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalHabits: 0,
        completedHabits: 0,
        hasRecentActivity: false,
        totalTimeMinutes: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }
  }, [user]);

  const calculateSphereIndex = (stats: SphereStats): number => {
    // G: Goals progress (tasks completion in active goals)
    const goalsProgress = stats.totalTasks > 0 
      ? (stats.completedTasks / stats.totalTasks) * 100 
      : 0;

    // H: Habits progress (weekly completion %)
    const habitsProgress = stats.completedHabits;

    // A: Activity (binary: 100 if recent activity, 0 otherwise)
    const activityScore = stats.hasRecentActivity ? 100 : 0;

    // Index = (G × 0.6) + (H × 0.3) + (A × 0.1)
    const index = 
      (goalsProgress * INDEX_WEIGHTS.goals) +
      (habitsProgress * INDEX_WEIGHTS.habits) +
      (activityScore * INDEX_WEIGHTS.activity);

    return Math.round(Math.min(100, Math.max(0, index)));
  };

  const fetchLifeIndexData = useCallback(async (): Promise<LifeIndexData> => {
    setLoading(true);

    try {
      const activeSpheres = SPHERES.filter(s => s.group_type !== 'system');
      const sphereIndices: SphereIndex[] = [];

      for (const sphere of activeSpheres) {
        const stats = await fetchSphereStats(sphere.id);
        
        const goalsProgress = stats.totalTasks > 0 
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
          : 0;

        const index = calculateSphereIndex(stats);

        sphereIndices.push({
          sphereId: sphere.id,
          sphereKey: sphere.key,
          goalsProgress,
          habitsProgress: stats.completedHabits,
          activityScore: stats.hasRecentActivity ? 100 : 0,
          index,
        });
      }

      // Calculate group averages
      const personalIndices = sphereIndices.filter(s => {
        const sphere = getSphereById(s.sphereId);
        return sphere?.group_type === 'personal';
      });

      const socialIndices = sphereIndices.filter(s => {
        const sphere = getSphereById(s.sphereId);
        return sphere?.group_type === 'social';
      });

      const personalEnergy = personalIndices.length > 0
        ? Math.round(personalIndices.reduce((sum, s) => sum + s.index, 0) / personalIndices.length)
        : 0;

      const externalSuccess = socialIndices.length > 0
        ? Math.round(socialIndices.reduce((sum, s) => sum + s.index, 0) / socialIndices.length)
        : 0;

      // Calculate overall life index
      const lifeIndex = sphereIndices.length > 0
        ? Math.round(sphereIndices.reduce((sum, s) => sum + s.index, 0) / sphereIndices.length)
        : 0;

      // Calculate mindfulness (Spirit sphere habits completion in last 7 days)
      const spiritIndex = sphereIndices.find(s => s.sphereKey === 'spirit');
      const mindfulnessLevel = spiritIndex?.habitsProgress || 0;

      return {
        lifeIndex,
        personalEnergy,
        externalSuccess,
        mindfulnessLevel,
        sphereIndices,
      };
    } catch (error) {
      console.error('Error fetching life index data:', error);
      return {
        lifeIndex: 0,
        personalEnergy: 0,
        externalSuccess: 0,
        mindfulnessLevel: 0,
        sphereIndices: [],
      };
    } finally {
      setLoading(false);
    }
  }, [fetchSphereStats]);

  return {
    loading,
    fetchSphereStats,
    fetchLifeIndexData,
    calculateSphereIndex,
    spheres: SPHERES,
    personalSpheres: PERSONAL_SPHERES,
    socialSpheres: SOCIAL_SPHERES,
  };
}
