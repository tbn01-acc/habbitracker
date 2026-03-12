import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Goal, GoalContact, GoalWithStats } from '@/types/goal';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// Helper to load from localStorage
function loadLocalTasks(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_tasks');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function loadLocalHabits(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_habits');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function loadLocalTransactions(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_finance');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function loadLocalTimeEntries(): any[] {
  try {
    const stored = localStorage.getItem('habitflow_time_entries');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function calculateLocalStats(goalId: string) {
  const localTasks = loadLocalTasks().filter(t => t.goalId === goalId);
  const localHabits = loadLocalHabits().filter(h => h.goalId === goalId && !h.archivedAt);
  const localTransactions = loadLocalTransactions().filter(t => t.goalId === goalId);
  const localTimeEntries = loadLocalTimeEntries().filter(t => t.goalId === goalId);

  const tasksCount = localTasks.length;
  const tasksCompleted = localTasks.filter((t: any) => t.completed).length;
  const totalSpent = localTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const totalTime = localTimeEntries.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

  // Calculate habit completion rate (this week)
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  let habitsCompletionRate = 0;
  if (localHabits.length > 0) {
    let totalExpected = 0;
    let actualCompletions = 0;
    localHabits.forEach((habit: any) => {
      const targetDays = habit.targetDays || [0, 1, 2, 3, 4, 5, 6];
      totalExpected += targetDays.length;
      const completedDates = habit.completedDates || [];
      const weeklyCompletions = completedDates.filter((date: string) =>
        date >= weekStart && date <= weekEnd
      ).length;
      actualCompletions += Math.min(weeklyCompletions, targetDays.length);
    });
    habitsCompletionRate = totalExpected > 0
      ? Math.round((actualCompletions / totalExpected) * 100)
      : 0;
  }

  return {
    tasks_count: tasksCount,
    tasks_completed: tasksCompleted,
    habits_count: localHabits.length,
    total_spent: totalSpent,
    total_time_minutes: Math.round(totalTime / 60),
    habits_completion_rate: habitsCompletionRate,
  };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch goals
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Build stats from localStorage (primary source for tasks/habits)
      const goalsWithStats: GoalWithStats[] = (goalsData || []).map((goal) => {
        const localStats = calculateLocalStats(goal.id);

        // Also try Supabase contacts count (async, but we set 0 initially)
        return {
          ...goal,
          tasks_count: localStats.tasks_count,
          tasks_completed: localStats.tasks_completed,
          habits_count: localStats.habits_count,
          total_spent: localStats.total_spent,
          total_time_minutes: localStats.total_time_minutes,
          contacts_count: 0,
        } as GoalWithStats;
      });

      // Fetch contacts counts in parallel
      const contactsPromises = goalsWithStats.map(async (goal) => {
        const { data: contacts } = await supabase
          .from('goal_contacts')
          .select('id')
          .eq('goal_id', goal.id);
        return { goalId: goal.id, count: contacts?.length || 0 };
      });

      const contactsCounts = await Promise.all(contactsPromises);
      
      // Merge contacts counts and auto-calculate progress
      const finalGoals = goalsWithStats.map(goal => {
        const contactInfo = contactsCounts.find(c => c.goalId === goal.id);
        const contactsCount = contactInfo?.count || 0;
        
        // Auto-calculate progress_percent based on tasks
        let autoProgress = goal.progress_percent || 0;
        if (goal.tasks_count > 0 && goal.status === 'active') {
          autoProgress = Math.round((goal.tasks_completed / goal.tasks_count) * 100);
        }

        return {
          ...goal,
          contacts_count: contactsCount,
          progress_percent: autoProgress,
        };
      });

      // Update progress_percent in Supabase for goals that changed
      for (const goal of finalGoals) {
        const originalGoal = goalsData?.find(g => g.id === goal.id);
        if (originalGoal && goal.progress_percent !== (originalGoal.progress_percent || 0) && goal.status === 'active') {
          supabase
            .from('goals')
            .update({ progress_percent: goal.progress_percent })
            .eq('id', goal.id)
            .then(() => {});
        }
      }

      setGoals(finalGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Listen for local data changes to refresh stats
  useEffect(() => {
    const handleDataChanged = () => {
      if (user) fetchGoals();
    };
    window.addEventListener('habitflow-data-changed', handleDataChanged);
    return () => window.removeEventListener('habitflow-data-changed', handleDataChanged);
  }, [user, fetchGoals]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress_percent'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchGoals();
      return data;
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Ошибка создания цели');
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Ошибка обновления цели');
    }
  };

  const deleteGoal = async (id: string, cascade: boolean = false) => {
    try {
      if (!cascade) {
        // Unlink items before deleting
        await supabase.from('tasks').update({ goal_id: null }).eq('goal_id', id);
        await supabase.from('habits').update({ goal_id: null }).eq('goal_id', id);
        await supabase.from('transactions').update({ goal_id: null }).eq('goal_id', id);
        await supabase.from('time_entries').update({ goal_id: null }).eq('goal_id', id);
      }

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Also unlink from localStorage
      try {
        const localTasks = loadLocalTasks();
        const updatedTasks = localTasks.map((t: any) => t.goalId === id ? { ...t, goalId: undefined } : t);
        localStorage.setItem('habitflow_tasks', JSON.stringify(updatedTasks));
        
        const localHabits = loadLocalHabits();
        const updatedHabits = localHabits.map((h: any) => h.goalId === id ? { ...h, goalId: undefined } : h);
        localStorage.setItem('habitflow_habits', JSON.stringify(updatedHabits));
      } catch (e) {
        console.error('Error unlinking local items:', e);
      }

      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Ошибка удаления цели');
    }
  };

  const completeGoal = async (id: string) => {
    await updateGoal(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress_percent: 100,
    });
  };

  const archiveGoal = async (id: string) => {
    await updateGoal(id, {
      status: 'archived',
      archived_at: new Date().toISOString(),
    });
  };

  // Goal contacts
  const addContact = async (contact: Omit<GoalContact, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('goal_contacts')
        .insert({
          ...contact,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchGoals();
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      return null;
    }
  };

  const getGoalContacts = async (goalId: string): Promise<GoalContact[]> => {
    const { data, error } = await supabase
      .from('goal_contacts')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }

    return data || [];
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goal_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchGoals();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    archiveGoal,
    addContact,
    getGoalContacts,
    deleteContact,
    refetch: fetchGoals,
  };
}
