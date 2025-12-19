import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from '@/types/service';

const STORAGE_KEY = 'habitflow_time_entries';
const ACTIVE_KEY = 'habitflow_active_timer';

interface ActiveTimer {
  taskId: string;
  subtaskId?: string;
  startTime: string;
  description?: string;
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
  }, []);

  const startTimer = useCallback((taskId: string, subtaskId?: string, description?: string) => {
    // Stop existing timer if running
    if (activeTimer) {
      stopTimer();
    }
    
    const timer: ActiveTimer = {
      taskId,
      subtaskId,
      startTime: new Date().toISOString(),
      description,
    };
    
    setActiveTimer(timer);
    setElapsedTime(0);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(timer));
  }, [activeTimer]);

  const stopTimer = useCallback(() => {
    if (!activeTimer) return;
    
    const endTime = new Date().toISOString();
    const duration = Math.floor(
      (new Date(endTime).getTime() - new Date(activeTimer.startTime).getTime()) / 1000
    );
    
    // Only save if duration > 5 seconds
    if (duration > 5) {
      const newEntry: TimeEntry = {
        id: crypto.randomUUID(),
        taskId: activeTimer.taskId,
        subtaskId: activeTimer.subtaskId,
        startTime: activeTimer.startTime,
        endTime,
        duration,
        description: activeTimer.description,
      };
      saveEntries([...entries, newEntry]);
    }
    
    setActiveTimer(null);
    setElapsedTime(0);
    localStorage.removeItem(ACTIVE_KEY);
  }, [activeTimer, entries, saveEntries]);

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

  const getTodayEntries = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.filter(e => e.startTime.startsWith(today));
  }, [entries]);

  const getTodayTotalTime = useCallback(() => {
    return getTodayEntries().reduce((sum, e) => sum + e.duration, 0);
  }, [getTodayEntries]);

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
    deleteEntry,
    getEntriesForTask,
    getTotalTimeForTask,
    getTodayEntries,
    getTodayTotalTime,
    formatDuration,
    isTimerRunning: !!activeTimer,
  };
}
