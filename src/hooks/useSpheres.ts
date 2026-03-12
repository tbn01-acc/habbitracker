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

export interface SphereStats {
  // Goals
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  goalsProgress: number;
  // Tasks
  totalTasks: number;
  completedTasks: number;
  // Habits
  totalHabits: number;
  habitCompletionRate: number; // weekly completion % (0-100)
  // Activity
  hasRecentActivity: boolean;
  // Time
  totalTimeMinutes: number;
  weeklyTimeMinutes: number;
  // Finance
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  // Contacts
  totalContacts: number;
}

// Cache the sphere lists at module level to avoid recalculating
const PERSONAL_SPHERES = getPersonalSpheres();
const SOCIAL_SPHERES = getSocialSpheres();

// Helper to load habits from localStorage
function loadLocalHabits(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_habits');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

// Helper to load tasks from localStorage
function loadLocalTasks(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_tasks');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

// Helper to load transactions from localStorage
function loadLocalTransactions(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_transactions');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

// Helper to load time entries from localStorage
function loadLocalTimeEntries(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_time_entries');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function useSpheres() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch stats from Supabase OR localStorage (hybrid approach)
  const fetchSphereStats = useCallback(async (sphereId: number): Promise<SphereStats> => {
    const emptyStats: SphereStats = {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      goalsProgress: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalHabits: 0,
      habitCompletionRate: 0,
      hasRecentActivity: false,
      totalTimeMinutes: 0,
      weeklyTimeMinutes: 0,
      totalIncome: 0,
      totalExpense: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      totalContacts: 0,
    };

    const now = new Date();
    const fortyEightHoursAgo = subDays(now, 2);
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

    // Always load localStorage data (primary source for tasks/habits)
    const localHabits = loadLocalHabits().filter(
      (h: any) => (h.sphereId === sphereId || h.sphere_id === sphereId) && !h.archivedAt
    );
    const localTasks = loadLocalTasks().filter(
      (t: any) => (t.sphereId === sphereId || t.sphere_id === sphereId) && !t.archivedAt
    );
    const localTransactions = loadLocalTransactions().filter(
      (t: any) => t.sphereId === sphereId || t.sphere_id === sphereId
    );
    const localTimeEntries = loadLocalTimeEntries().filter(
      (t: any) => t.sphereId === sphereId || t.sphere_id === sphereId
    );

    // Also include tasks/habits linked to goals in this sphere
    let goalIds: string[] = [];
    
    if (user) {
      try {
        const { data: goals } = await supabase
          .from('goals')
          .select('id, status, progress_percent')
          .eq('user_id', user.id)
          .eq('sphere_id', sphereId)
          .is('archived_at', null);

        goalIds = goals?.map(g => g.id) || [];
        
        const totalGoals = goals?.length || 0;
        const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
        const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;
        const goalsProgress = goals && goals.length > 0
          ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percent || 0), 0) / goals.length)
          : 0;

        // Get tasks linked to goals in this sphere (from localStorage)
        const goalLinkedTasks = loadLocalTasks().filter(
          (t: any) => t.goalId && goalIds.includes(t.goalId) && !t.archivedAt && t.sphereId !== sphereId
        );
        
        // Get habits linked to goals in this sphere (from localStorage)
        const goalLinkedHabits = loadLocalHabits().filter(
          (h: any) => h.goalId && goalIds.includes(h.goalId) && !h.archivedAt && h.sphereId !== sphereId
        );

        // Combine direct sphere items + goal-linked items (deduplicated)
        const allTaskIds = new Set<string>();
        const allTasks = [...localTasks, ...goalLinkedTasks].filter((t: any) => {
          if (allTaskIds.has(t.id)) return false;
          allTaskIds.add(t.id);
          return true;
        });

        const allHabitIds = new Set<string>();
        const allHabits = [...localHabits, ...goalLinkedHabits].filter((h: any) => {
          if (allHabitIds.has(h.id)) return false;
          allHabitIds.add(h.id);
          return true;
        });

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter((t: any) => t.completed).length;
        const totalHabits = allHabits.length;

        // Calculate habit completion rate
        let habitCompletionRate = 0;
        if (allHabits.length > 0) {
          let totalExpectedCompletions = 0;
          let actualCompletions = 0;

          allHabits.forEach((habit: any) => {
            const targetDays = habit.targetDays || habit.target_days || [0, 1, 2, 3, 4, 5, 6];
            totalExpectedCompletions += targetDays.length;

            const completedDates = habit.completedDates || habit.completed_dates || [];
            const weeklyCompletions = completedDates.filter((date: string) =>
              date >= weekStart && date <= weekEnd
            ).length;
            actualCompletions += Math.min(weeklyCompletions, targetDays.length);
          });

          habitCompletionRate = totalExpectedCompletions > 0
            ? Math.round((actualCompletions / totalExpectedCompletions) * 100)
            : 0;
        }

        // Check recent activity
        const recentActivityCheck = fortyEightHoursAgo.toISOString();
        const hasLocalActivity = 
          localTimeEntries.some((t: any) => (t.created_at || t.createdAt) >= recentActivityCheck) ||
          localTransactions.some((t: any) => (t.created_at || t.createdAt) >= recentActivityCheck);

        let hasRecentActivity = hasLocalActivity;

        // Also check Supabase for time/transaction activity
        const { data: recentTime } = await supabase
          .from('time_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('sphere_id', sphereId)
          .gte('created_at', fortyEightHoursAgo.toISOString())
          .limit(1);

        const { data: recentTx } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('sphere_id', sphereId)
          .gte('created_at', fortyEightHoursAgo.toISOString())
          .limit(1);

        hasRecentActivity = hasRecentActivity || 
          (recentTime && recentTime.length > 0) || 
          (recentTx && recentTx.length > 0) || false;

        // Time entries
        const totalTimeMinutes = Math.round(
          localTimeEntries.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) / 60
        );
        const weeklyTimeMinutes = Math.round(
          localTimeEntries
            .filter((t: any) => (t.created_at || t.createdAt) >= weekStart)
            .reduce((sum: number, t: any) => sum + (t.duration || 0), 0) / 60
        );

        // Transactions
        const totalIncome = localTransactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const totalExpense = localTransactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const monthlyIncome = localTransactions
          .filter((t: any) => t.type === 'income' && (t.date || '') >= monthStart)
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const monthlyExpense = localTransactions
          .filter((t: any) => t.type === 'expense' && (t.date || '') >= monthStart)
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        // Contacts
        const { data: contactSpheres } = await supabase
          .from('contact_spheres')
          .select('id')
          .eq('user_id', user.id)
          .eq('sphere_id', sphereId);

        const totalContacts = contactSpheres?.length || 0;

        return {
          totalGoals,
          activeGoals,
          completedGoals,
          goalsProgress,
          totalTasks,
          completedTasks,
          totalHabits,
          habitCompletionRate,
          hasRecentActivity,
          totalTimeMinutes,
          weeklyTimeMinutes,
          totalIncome,
          totalExpense,
          monthlyIncome,
          monthlyExpense,
          totalContacts,
        };
      } catch (error) {
        console.error('Error fetching sphere stats from Supabase:', error);
        // Fall through to localStorage-only path
      }
    }

    // localStorage-only path (guest or fallback)
    // Calculate habit completion rate from local data
    let habitCompletionRate = 0;
    if (localHabits.length > 0) {
      let totalExpected = 0;
      let actualCompletions = 0;

      localHabits.forEach((habit: any) => {
        const targetDays = habit.targetDays || habit.target_days || [0, 1, 2, 3, 4, 5, 6];
        totalExpected += targetDays.length;

        const completedDates = habit.completedDates || habit.completed_dates || [];
        const weeklyCompletions = completedDates.filter((date: string) =>
          date >= weekStart && date <= weekEnd
        ).length;
        actualCompletions += Math.min(weeklyCompletions, targetDays.length);
      });

      habitCompletionRate = totalExpected > 0
        ? Math.round((actualCompletions / totalExpected) * 100)
        : 0;
    }

    // Check recent activity
    const recentActivityCheck = fortyEightHoursAgo.toISOString();
    const hasRecentActivity = 
      localTimeEntries.some((t: any) => (t.created_at || t.createdAt) >= recentActivityCheck) ||
      localTransactions.some((t: any) => (t.created_at || t.createdAt) >= recentActivityCheck);

    const totalTimeMinutes = Math.round(
      localTimeEntries.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) / 60
    );

    const totalIncome = localTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const totalExpense = localTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    return {
      ...emptyStats,
      totalTasks: localTasks.length,
      completedTasks: localTasks.filter((t: any) => t.completed).length,
      totalHabits: localHabits.length,
      habitCompletionRate,
      hasRecentActivity,
      totalTimeMinutes,
      totalIncome,
      totalExpense,
    };
  }, [user]);

  // Calculate sphere index using the weighted formula
  const calculateSphereIndex = useCallback((stats: SphereStats): number => {
    // G: Strategy/Goals progress (task completion %)
    const goalsProgress = stats.totalTasks > 0
      ? (stats.completedTasks / stats.totalTasks) * 100
      : 0;

    // H: Discipline/Habits (weekly completion %)
    const habitsProgress = stats.habitCompletionRate;

    // A: Pulse/Activity (binary: 100 if recent activity, 0 otherwise)
    const activityScore = stats.hasRecentActivity ? 100 : 0;

    // Index = (G × 0.6) + (H × 0.3) + (A × 0.1)
    const index =
      (goalsProgress * INDEX_WEIGHTS.goals) +
      (habitsProgress * INDEX_WEIGHTS.habits) +
      (activityScore * INDEX_WEIGHTS.activity);

    return Math.round(Math.min(100, Math.max(0, index)));
  }, []);

  // Fetch complete Life Index data for all spheres
  const fetchLifeIndexData = useCallback(async (): Promise<LifeIndexData> => {
    setLoading(true);

    try {
      const activeSpheres = SPHERES.filter(s => s.group_type !== 'system');
      const sphereIndices: SphereIndex[] = [];

      // Fetch stats for all spheres in parallel
      const statsPromises = activeSpheres.map(sphere => fetchSphereStats(sphere.id));
      const allStats = await Promise.all(statsPromises);

      activeSpheres.forEach((sphere, idx) => {
        const stats = allStats[idx];
        const goalsProgress = stats.totalTasks > 0
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
          : 0;

        const index = calculateSphereIndex(stats);

        sphereIndices.push({
          sphereId: sphere.id,
          sphereKey: sphere.key,
          goalsProgress,
          habitsProgress: stats.habitCompletionRate,
          activityScore: stats.hasRecentActivity ? 100 : 0,
          index,
          // Extended stats for display
          totalGoals: stats.totalGoals,
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          totalHabits: stats.totalHabits,
          totalTimeMinutes: stats.totalTimeMinutes,
          totalContacts: stats.totalContacts,
          monthlyIncome: stats.monthlyIncome,
          monthlyExpense: stats.monthlyExpense,
        });
      });

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

      // Overall life index
      const lifeIndex = sphereIndices.length > 0
        ? Math.round(sphereIndices.reduce((sum, s) => sum + s.index, 0) / sphereIndices.length)
        : 0;

      // Mindfulness = Spirit sphere habits completion
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
  }, [fetchSphereStats, calculateSphereIndex]);

  // Memoized sphere lists
  const spheres = useMemo(() => SPHERES, []);
  const personalSpheres = useMemo(() => PERSONAL_SPHERES, []);
  const socialSpheres = useMemo(() => SOCIAL_SPHERES, []);

  return {
    loading,
    fetchSphereStats,
    fetchLifeIndexData,
    calculateSphereIndex,
    spheres,
    personalSpheres,
    socialSpheres,
  };
}
