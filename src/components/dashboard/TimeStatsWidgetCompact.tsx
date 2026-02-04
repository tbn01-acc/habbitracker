import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { usePomodoro } from '@/contexts/PomodoroContext';

const TIME_ENTRIES_KEY = 'habitflow_time_entries';

/**
 * Time Stats Widget - Compact version for dashboard
 * 
 * Displays unified real-time daily total (HH:MM:SS) that:
 * 1. Aggregates all time entries (from both Pomodoro and Stopwatch) for today
 * 2. Includes currently running timer time
 * 3. Accumulates throughout the day (doesn't reset on timer stop)
 * 4. Resets at midnight for a new day
 * 
 * Uses time_entries as the single source of truth to avoid duplication.
 */
export function TimeStatsWidgetCompact() {
  const { elapsedTime, isTimerRunning } = useTimeTracker();
  const { isRunning: isPomodoroRunning, timeLeft, currentPhase, settings } = usePomodoro();
  const [displayTime, setDisplayTime] = useState(0);
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const dataVersionRef = useRef(0);

  // Get today's completed entries from localStorage (single source of truth)
  const getTodayCompletedTime = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedEntries = localStorage.getItem(TIME_ENTRIES_KEY);
    
    if (!storedEntries) return 0;
    
    try {
      const entries = JSON.parse(storedEntries);
      return entries
        .filter((e: any) => e.startTime && e.startTime.startsWith(today))
        .reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
    } catch {
      return 0;
    }
  }, []);

  // Calculate real-time total including active timer/pomodoro
  const calculateTotal = useCallback(() => {
    // Get all completed time entries for today (includes both stopped stopwatch and completed pomodoros)
    const todayCompleted = getTodayCompletedTime();
    
    let activeTime = 0;
    
    // Add currently running stopwatch time (not yet saved to entries)
    if (isTimerRunning) {
      activeTime += elapsedTime;
    }
    
    // Add currently running pomodoro time (work phase only)
    // For pomodoro: elapsed = phaseDuration - timeLeft
    if (isPomodoroRunning && currentPhase === 'work') {
      const phaseDuration = (settings?.workDuration || 25) * 60;
      const pomodoroElapsed = phaseDuration - timeLeft;
      if (pomodoroElapsed > 0) {
        activeTime += pomodoroElapsed;
      }
    }
    
    return todayCompleted + activeTime;
  }, [getTodayCompletedTime, elapsedTime, isTimerRunning, isPomodoroRunning, timeLeft, currentPhase, settings]);

  // Initial calculation and updates
  useEffect(() => {
    setDisplayTime(calculateTotal());
    
    // Update every second when any timer is running
    if (isTimerRunning || isPomodoroRunning) {
      const interval = setInterval(() => {
        setDisplayTime(calculateTotal());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [calculateTotal, isTimerRunning, isPomodoroRunning, dataVersionRef.current]);

  // Listen for data changes (when timer stops and entry is saved)
  useEffect(() => {
    const handleDataChange = () => {
      dataVersionRef.current += 1;
      setDisplayTime(calculateTotal());
    };

    window.addEventListener('habitflow-data-changed', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    
    return () => {
      window.removeEventListener('habitflow-data-changed', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [calculateTotal]);

  // Check for day change every minute
  useEffect(() => {
    const checkDayChange = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== todayDate) {
        setTodayDate(currentDate);
        // Stats will automatically recalculate for the new day
        dataVersionRef.current += 1;
        setDisplayTime(calculateTotal());
      }
    };

    const interval = setInterval(checkDayChange, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [todayDate, calculateTotal]);

  // Format as HH:MM:SS
  const formatTimeHMS = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAnyTimerRunning = isTimerRunning || isPomodoroRunning;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-xl p-1.5 shadow-card border border-border"
    >
      {/* Header - single line */}
      <div className="flex items-center gap-1 mb-1">
        <Clock className="w-3 h-3 text-task" />
        <span className="font-medium text-[9px]">Учёт времени</span>
        {isAnyTimerRunning && (
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse ml-auto" />
        )}
      </div>

      {/* Today total - compact with HH:MM:SS */}
      <div className="bg-muted/50 rounded-lg p-1 text-center">
        <div className={`text-sm font-bold ${isAnyTimerRunning ? 'text-success' : 'text-foreground'}`}>
          {formatTimeHMS(displayTime)}
        </div>
        <div className="text-[7px] text-muted-foreground">Сегодня</div>
      </div>
    </motion.div>
  );
}
