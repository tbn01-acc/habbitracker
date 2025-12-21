import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Habit } from '@/types/habit';
import { Task, SubTask, TaskAttachment } from '@/types/task';
import { FinanceTransaction } from '@/types/finance';
import { TimeEntry } from '@/types/service';
import { useToast } from './use-toast';

// Storage keys
const HABITS_KEY = 'habitflow_habits';
const TASKS_KEY = 'habitflow_tasks';
const FINANCE_KEY = 'habitflow_finance';
const TIME_ENTRIES_KEY = 'habitflow_time_entries';
const SYNC_HISTORY_KEY = 'habitflow_sync_history';

interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  habitsCount: number;
  tasksCount: number;
  transactionsCount: number;
}

export function useSupabaseSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);

  // Load sync history on mount
  useEffect(() => {
    const stored = localStorage.getItem(SYNC_HISTORY_KEY);
    if (stored) {
      try {
        setSyncHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse sync history:', e);
      }
    }
  }, []);

  const addSyncHistoryEntry = useCallback((entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: SyncHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    const newHistory = [newEntry, ...syncHistory].slice(0, 20);
    setSyncHistory(newHistory);
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(newHistory));
    
    return newEntry;
  }, [syncHistory]);

  // Sync habits to Supabase
  const syncHabitsToSupabase = useCallback(async () => {
    if (!user) return;
    
    const stored = localStorage.getItem(HABITS_KEY);
    if (!stored) return;
    
    try {
      const habits: Habit[] = JSON.parse(stored);
      
      for (const habit of habits) {
        const { error } = await supabase
          .from('habits')
          .upsert({
            id: habit.id,
            user_id: user.id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            target_days: habit.targetDays,
            completed_dates: habit.completedDates,
            streak: habit.streak,
            category_id: habit.categoryId,
            tags: habit.tagIds,
            created_at: habit.createdAt,
          }, { onConflict: 'id' });
          
        if (error) console.error('Error syncing habit:', error);
      }
    } catch (e) {
      console.error('Error parsing habits for sync:', e);
    }
  }, [user]);

  // Sync tasks to Supabase
  const syncTasksToSupabase = useCallback(async () => {
    if (!user) return;
    
    const stored = localStorage.getItem(TASKS_KEY);
    if (!stored) return;
    
    try {
      const tasks: Task[] = JSON.parse(stored);
      
      for (const task of tasks) {
        const { error } = await supabase
          .from('tasks')
          .upsert({
            id: task.id,
            user_id: user.id,
            name: task.name,
            description: task.notes,
            icon: task.icon,
            priority: task.priority,
            status: task.status,
            completed: task.completed,
            due_date: task.dueDate,
            due_time: task.reminder?.time,
            recurrence: task.recurrence,
            category_id: task.categoryId,
            tags: task.tagIds,
            subtasks: task.subtasks as unknown as any,
            attachments: task.attachments as unknown as any,
            created_at: task.createdAt,
          }, { onConflict: 'id' });
          
        if (error) console.error('Error syncing task:', error);
      }
    } catch (e) {
      console.error('Error parsing tasks for sync:', e);
    }
  }, [user]);

  // Sync transactions to Supabase
  const syncTransactionsToSupabase = useCallback(async () => {
    if (!user) return;
    
    const stored = localStorage.getItem(FINANCE_KEY);
    if (!stored) return;
    
    try {
      const transactions: FinanceTransaction[] = JSON.parse(stored);
      
      for (const tx of transactions) {
        const { error } = await supabase
          .from('transactions')
          .upsert({
            id: tx.id,
            user_id: user.id,
            name: tx.name,
            type: tx.type,
            amount: tx.amount,
            date: tx.date,
            completed: tx.completed,
            category_id: tx.customCategoryId || tx.category,
            tags: tx.tagIds,
            recurrence: undefined,
            created_at: tx.createdAt,
          }, { onConflict: 'id' });
          
        if (error) console.error('Error syncing transaction:', error);
      }
    } catch (e) {
      console.error('Error parsing transactions for sync:', e);
    }
  }, [user]);

  // Sync time entries to Supabase
  const syncTimeEntriesToSupabase = useCallback(async () => {
    if (!user) return;
    
    const stored = localStorage.getItem(TIME_ENTRIES_KEY);
    if (!stored) return;
    
    try {
      const entries: TimeEntry[] = JSON.parse(stored);
      
      for (const entry of entries) {
        const { error } = await supabase
          .from('time_entries')
          .upsert({
            id: entry.id,
            user_id: user.id,
            task_id: entry.taskId,
            subtask_id: entry.subtaskId,
            start_time: entry.startTime,
            end_time: entry.endTime,
            duration: entry.duration,
            description: entry.description,
          }, { onConflict: 'id' });
          
        if (error) console.error('Error syncing time entry:', error);
      }
    } catch (e) {
      console.error('Error parsing time entries for sync:', e);
    }
  }, [user]);

  // Load habits from Supabase
  const loadHabitsFromSupabase = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) {
      console.error('Error loading habits:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const habits: Habit[] = data.map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon || '🎯',
        color: h.color || 'hsl(168, 80%, 40%)',
        frequency: 'daily' as const,
        targetDays: h.target_days,
        completedDates: h.completed_dates,
        createdAt: h.created_at,
        streak: h.streak,
        categoryId: h.category_id || undefined,
        tagIds: h.tags || [],
      }));
      localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    }
  }, [user]);

  // Load tasks from Supabase
  const loadTasksFromSupabase = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const tasks: Task[] = data.map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon || '📝',
        color: 'hsl(200, 80%, 50%)',
        dueDate: t.due_date || new Date().toISOString().split('T')[0],
        completed: t.completed,
        completedAt: undefined,
        createdAt: t.created_at,
        priority: t.priority as 'low' | 'medium' | 'high',
        status: t.status as any,
        categoryId: t.category_id || undefined,
        tagIds: t.tags || [],
        recurrence: (t.recurrence || 'none') as any,
        reminder: t.due_time ? { enabled: true, time: t.due_time } : undefined,
        subtasks: (Array.isArray(t.subtasks) ? t.subtasks : []) as unknown as SubTask[],
        attachments: (Array.isArray(t.attachments) ? t.attachments : []) as unknown as TaskAttachment[],
        notes: t.description || undefined,
      }));
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
  }, [user]);

  // Load transactions from Supabase
  const loadTransactionsFromSupabase = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const transactions: FinanceTransaction[] = data.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type as 'income' | 'expense',
        amount: Number(t.amount),
        category: t.category_id || 'other',
        date: t.date,
        completed: t.completed,
        createdAt: t.created_at,
        customCategoryId: t.category_id || undefined,
        tagIds: t.tags || [],
      }));
      localStorage.setItem(FINANCE_KEY, JSON.stringify(transactions));
    }
  }, [user]);

  // Full sync
  const syncAll = useCallback(async () => {
    if (!user || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // First load from Supabase (in case there's newer data from another device)
      await Promise.all([
        loadHabitsFromSupabase(),
        loadTasksFromSupabase(),
        loadTransactionsFromSupabase(),
      ]);
      
      // Then push local changes
      await Promise.all([
        syncHabitsToSupabase(),
        syncTasksToSupabase(),
        syncTransactionsToSupabase(),
        syncTimeEntriesToSupabase(),
      ]);
      
      // Get counts for history
      const habitsStored = localStorage.getItem(HABITS_KEY);
      const tasksStored = localStorage.getItem(TASKS_KEY);
      const financeStored = localStorage.getItem(FINANCE_KEY);
      
      const habitsCount = habitsStored ? JSON.parse(habitsStored).length : 0;
      const tasksCount = tasksStored ? JSON.parse(tasksStored).length : 0;
      const transactionsCount = financeStored ? JSON.parse(financeStored).length : 0;
      
      // Add to sync history
      addSyncHistoryEntry({
        habitsCount,
        tasksCount,
        transactionsCount,
      });
      
      setLastSyncTime(new Date().toISOString());
      toast({
        title: '✅ Данные синхронизированы',
        description: 'Все данные успешно сохранены в облако',
      });
    } catch (e) {
      console.error('Sync error:', e);
      toast({
        title: '⚠️ Ошибка синхронизации',
        description: 'Не удалось синхронизировать данные',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, loadHabitsFromSupabase, loadTasksFromSupabase, loadTransactionsFromSupabase, syncHabitsToSupabase, syncTasksToSupabase, syncTransactionsToSupabase, syncTimeEntriesToSupabase, addSyncHistoryEntry, toast]);

  // Auto-sync on login
  useEffect(() => {
    if (user) {
      syncAll();
    }
  }, [user?.id]);

  return {
    isSyncing,
    lastSyncTime,
    syncHistory,
    syncAll,
    syncHabitsToSupabase,
    syncTasksToSupabase,
    syncTransactionsToSupabase,
  };
}
