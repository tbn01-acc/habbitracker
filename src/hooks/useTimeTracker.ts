import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from '@/types/service';

const STORAGE_KEY = 'habitflow_time_entries';
const ACTIVE_KEY = 'habitflow_active_timer';

interface ActiveTimer {
  taskId: string;
  subtaskId?: string;
  habitId?: string;
  startTime: string;
  description?: string;
  goalId?: string;
  sphereId?: number;
}

export function useTimeTracker() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load entries and active timer
  useEffect(() => {
    const storedEntries = localStorage.getItem(STORAGE_KEY);
    if (storedEntries) {
      try {
        setEntries(JSON.parse(storedEntries));
      } catch (e) {
        console.error('Failed to parse time entries:', e);
      }
    }

    const storedActive = localStorage.getItem(ACTIVE_KEY);
    if (storedActive) {
      try {
        const active = JSON.parse(storedActive);
        setActiveTimer(active);
        // Calculate elapsed time from start
        const elapsed = Math.floor(
          (Date.now() - new Date(active.startTime).getTime()) / 1000
        );
        setElapsedTime(elapsed);
      } catch (e) {
        console.error('Failed to parse active timer:', e);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Timer tick
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setElapsedTime(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer]);

  const saveEntries = useCallback((newEntries: TimeEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    // Dispatch event for other components to sync
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  // Start timer with optional goal/sphere linking
  const startTimer = useCallback((
    taskId: string, 
    subtaskId?: string, 
    description?: string,
    goalId?: string,
    sphereId?: number,
    habitId?: string
  ) => {
    // Stop existing timer if running
    if (activeTimer) {
      stopTimerInternal();
    }
    
    const timer: ActiveTimer = {
      taskId,
      subtaskId,
      habitId,
      startTime: new Date().toISOString(),
      description,
      goalId,
      sphereId,
    };
    
    setActiveTimer(timer);
    setElapsedTime(0);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(timer));
  }, [activeTimer]);

  const stopTimerInternal = useCallback(() => {
    if (!activeTimer) return null;
    
    const endTime = new Date().toISOString();
    const duration = Math.floor(
      (new Date(endTime).getTime() - new Date(activeTimer.startTime).getTime()) / 1000
    );
    
    // Only save if duration > 5 seconds
    if (duration > 5) {
      const newEntry: TimeEntry = {
        id: crypto.randomUUID(),
        taskId: activeTimer.habitId || activeTimer.taskId, // Use habitId if available
        subtaskId: activeTimer.subtaskId,
        startTime: activeTimer.startTime,
        endTime,
        duration,
        description: activeTimer.description,
        goalId: activeTimer.goalId,
        sphereId: activeTimer.sphereId,
      };
      const updatedEntries = [...entries, newEntry];
      saveEntries(updatedEntries);
      
      // Dispatch event for unified time tracking to update
      window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
      
      return newEntry;
    }
    
    return null;
  }, [activeTimer, entries, saveEntries]);

  const stopTimer = useCallback(() => {
    const entry = stopTimerInternal();
    setActiveTimer(null);
    setElapsedTime(0);
    localStorage.removeItem(ACTIVE_KEY);
    return entry;
  }, [stopTimerInternal]);

  // Add a manual time entry (for saving time that was tracked without binding)
  const addManualEntry = useCallback((
    taskId: string,
    duration: number,
    goalId?: string,
    sphereId?: number,
    habitId?: string,
    description?: string
  ) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - duration * 1000).toISOString();
    const endTime = now.toISOString();
    
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      taskId: habitId || taskId, // Use habitId as taskId if provided
      startTime,
      endTime,
      duration,
      description,
      goalId,
      sphereId,
    };
    
    saveEntries([...entries, newEntry]);
    
    // Dispatch event for unified time tracking to update
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
    
    return newEntry;
  }, [entries, saveEntries]);

  const deleteEntry = useCallback((id: string) => {
    saveEntries(entries.filter(e => e.id !== id));
  }, [entries, saveEntries]);

  const getEntriesForTask = useCallback((taskId: string) => {
    return entries.filter(e => e.taskId === taskId);
  }, [entries]);

  const getTotalTimeForTask = useCallback((taskId: string) => {
    return entries
      .filter(e => e.taskId === taskId)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [entries]);

  const getEntriesForGoal = useCallback((goalId: string) => {
    return entries.filter(e => e.goalId === goalId);
  }, [entries]);

  const getTotalTimeForGoal = useCallback((goalId: string) => {
    return entries
      .filter(e => e.goalId === goalId)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [entries]);

  const getEntriesForSphere = useCallback((sphereId: number) => {
    return entries.filter(e => e.sphereId === sphereId);
  }, [entries]);

  const getTotalTimeForSphere = useCallback((sphereId: number) => {
    return entries
      .filter(e => e.sphereId === sphereId)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [entries]);

  const getTodayEntries = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.filter(e => e.startTime.startsWith(today));
  }, [entries]);

  const getTodayTotalTime = useCallback(() => {
    return getTodayEntries().reduce((sum, e) => sum + e.duration, 0);
  }, [getTodayEntries]);

  const getWeekEntries = useCallback(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    return entries.filter(e => new Date(e.startTime) >= startOfWeek);
  }, [entries]);

  const getWeekTotalTime = useCallback(() => {
    return getWeekEntries().reduce((sum, e) => sum + e.duration, 0);
  }, [getWeekEntries]);

  const getMonthEntries = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now);
    startOfMonth.setMonth(now.getMonth() - 1);
    return entries.filter(e => new Date(e.startTime) >= startOfMonth);
  }, [entries]);

  const getMonthTotalTime = useCallback(() => {
    return getMonthEntries().reduce((sum, e) => sum + e.duration, 0);
  }, [getMonthEntries]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    entries,
    activeTimer,
    elapsedTime,
    isLoading,
    startTimer,
    stopTimer,
    addManualEntry,
    deleteEntry,
    getEntriesForTask,
    getTotalTimeForTask,
    getEntriesForGoal,
    getTotalTimeForGoal,
    getEntriesForSphere,
    getTotalTimeForSphere,
    getTodayEntries,
    getTodayTotalTime,
    getWeekEntries,
    getWeekTotalTime,
    getMonthEntries,
    getMonthTotalTime,
    formatDuration,
    isTimerRunning: !!activeTimer,
  };
}
