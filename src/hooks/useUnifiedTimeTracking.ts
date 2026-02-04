import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TimeEntry } from '@/types/service';

const TIME_ENTRIES_KEY = 'habitflow_time_entries';
const POMODORO_SESSIONS_KEY = 'habitflow_pomodoro_sessions';

interface DailyTimeStats {
  date: string;
  totalSeconds: number;
  byTask: Record<string, number>;
  byGoal: Record<string, number>;
  bySphere: Record<number, number>;
}

/**
 * Unified Time Tracking Hook
 * 
 * This hook provides:
 * 1. Real-time aggregation of time from both Pomodoro and Stopwatch
 * 2. Daily accumulation that persists across timer stops
 * 3. Automatic reset at midnight
 * 4. Database persistence for analytics
 */
export function useUnifiedTimeTracking() {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState<DailyTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncRef = useRef<string | null>(null);

  // Get today's date string
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Load time entries from localStorage
  const loadTimeEntries = useCallback((): TimeEntry[] => {
    const stored = localStorage.getItem(TIME_ENTRIES_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  // Load pomodoro sessions from localStorage
  const loadPomodoroSessions = useCallback(() => {
    const stored = localStorage.getItem(POMODORO_SESSIONS_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  // Calculate stats for a specific date
  const calculateDailyStats = useCallback((date: string): DailyTimeStats => {
    const timeEntries = loadTimeEntries();
    const pomodoroSessions = loadPomodoroSessions();
    
    const stats: DailyTimeStats = {
      date,
      totalSeconds: 0,
      byTask: {},
      byGoal: {},
      bySphere: {},
    };

    // Process time tracker entries for the date
    timeEntries
      .filter(e => e.startTime.startsWith(date))
      .forEach(entry => {
        stats.totalSeconds += entry.duration;
        
        if (entry.taskId) {
          stats.byTask[entry.taskId] = (stats.byTask[entry.taskId] || 0) + entry.duration;
        }
        if (entry.goalId) {
          stats.byGoal[entry.goalId] = (stats.byGoal[entry.goalId] || 0) + entry.duration;
        }
        if (entry.sphereId !== undefined && entry.sphereId !== null) {
          stats.bySphere[entry.sphereId] = (stats.bySphere[entry.sphereId] || 0) + entry.duration;
        }
      });

    // Process pomodoro sessions for the date (work phase only)
    pomodoroSessions
      .filter((s: any) => s.startTime?.startsWith(date) && s.completed && s.phase === 'work')
      .forEach((session: any) => {
        const duration = session.endTime 
          ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
          : 0;
        
        if (duration > 0) {
          stats.totalSeconds += duration;
          
          if (session.taskId) {
            stats.byTask[session.taskId] = (stats.byTask[session.taskId] || 0) + duration;
          }
        }
      });

    return stats;
  }, [loadTimeEntries, loadPomodoroSessions]);

  // Recalculate today's stats
  const recalculateTodayStats = useCallback(() => {
    const today = getTodayDate();
    const stats = calculateDailyStats(today);
    setTodayStats(stats);
    return stats;
  }, [getTodayDate, calculateDailyStats]);

  // Initial load
  useEffect(() => {
    recalculateTodayStats();
    setIsLoading(false);
  }, [recalculateTodayStats]);

  // Listen for data changes
  useEffect(() => {
    const handleDataChange = () => {
      recalculateTodayStats();
    };

    window.addEventListener('habitflow-data-changed', handleDataChange);
    window.addEventListener('storage', handleDataChange);

    return () => {
      window.removeEventListener('habitflow-data-changed', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [recalculateTodayStats]);

  // Check for day change every minute
  useEffect(() => {
    let currentDate = getTodayDate();
    
    const checkDayChange = () => {
      const newDate = getTodayDate();
      if (newDate !== currentDate) {
        currentDate = newDate;
        recalculateTodayStats();
      }
    };

    const interval = setInterval(checkDayChange, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [getTodayDate, recalculateTodayStats]);

  // Sync entries to Supabase
  const syncToDatabase = useCallback(async () => {
    if (!user) return;
    
    const timeEntries = loadTimeEntries();
    const today = getTodayDate();
    const todayEntries = timeEntries.filter(e => e.startTime.startsWith(today));
    
    // Sync each entry to database
    for (const entry of todayEntries) {
      try {
        await supabase.from('time_entries').upsert({
          id: entry.id,
          user_id: user.id,
          task_id: entry.taskId,
          subtask_id: entry.subtaskId,
          start_time: entry.startTime,
          end_time: entry.endTime,
          duration: entry.duration,
          description: entry.description,
          goal_id: entry.goalId || null,
          sphere_id: entry.sphereId ?? null,
        }, { onConflict: 'id' });
      } catch (err) {
        console.error('Error syncing time entry:', err);
      }
    }
    
    lastSyncRef.current = new Date().toISOString();
  }, [user, loadTimeEntries, getTodayDate]);

  // Auto-sync with debounce
  useEffect(() => {
    if (!user) return;

    let debounceTimer: NodeJS.Timeout;
    
    const handleDataChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncToDatabase, 3000);
    };

    window.addEventListener('habitflow-data-changed', handleDataChange);
    
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('habitflow-data-changed', handleDataChange);
    };
  }, [user, syncToDatabase]);

  // Get time for a specific period
  const getTimeByPeriod = useCallback((period: 'today' | 'week' | 'month') => {
    const now = new Date();
    const entries = loadTimeEntries();
    const sessions = loadPomodoroSessions();
    
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    let total = 0;

    // Time tracker entries
    entries
      .filter(e => new Date(e.startTime) >= startDate)
      .forEach(e => { total += e.duration; });

    // Pomodoro sessions
    sessions
      .filter((s: any) => s.startTime && new Date(s.startTime) >= startDate && s.completed && s.phase === 'work')
      .forEach((s: any) => {
        if (s.endTime) {
          total += Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        }
      });

    return total;
  }, [loadTimeEntries, loadPomodoroSessions]);

  // Get time for a specific task
  const getTimeForTask = useCallback((taskId: string, period: 'today' | 'week' | 'month' = 'today') => {
    const now = new Date();
    const entries = loadTimeEntries();
    const sessions = loadPomodoroSessions();
    
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    let total = 0;

    entries
      .filter(e => e.taskId === taskId && new Date(e.startTime) >= startDate)
      .forEach(e => { total += e.duration; });

    sessions
      .filter((s: any) => s.taskId === taskId && s.startTime && new Date(s.startTime) >= startDate && s.completed)
      .forEach((s: any) => {
        if (s.endTime) {
          total += Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        }
      });

    return total;
  }, [loadTimeEntries, loadPomodoroSessions]);

  // Get time for a specific goal
  const getTimeForGoal = useCallback((goalId: string, period: 'today' | 'week' | 'month' = 'today') => {
    const now = new Date();
    const entries = loadTimeEntries();
    
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return entries
      .filter(e => e.goalId === goalId && new Date(e.startTime) >= startDate)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [loadTimeEntries]);

  // Get time for a specific sphere
  const getTimeForSphere = useCallback((sphereId: number, period: 'today' | 'week' | 'month' = 'today') => {
    const now = new Date();
    const entries = loadTimeEntries();
    
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return entries
      .filter(e => e.sphereId === sphereId && new Date(e.startTime) >= startDate)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [loadTimeEntries]);

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    todayStats,
    isLoading,
    todayTotalSeconds: todayStats?.totalSeconds || 0,
    recalculateTodayStats,
    syncToDatabase,
    getTimeByPeriod,
    getTimeForTask,
    getTimeForGoal,
    getTimeForSphere,
    formatDuration,
  };
}
