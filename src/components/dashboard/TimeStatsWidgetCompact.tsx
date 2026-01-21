import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { usePomodoro } from '@/contexts/PomodoroContext';

export function TimeStatsWidgetCompact() {
  const { getTodayTotalTime, elapsedTime, isTimerRunning } = useTimeTracker();
  const { getTodayPomodoroTime, isRunning: isPomodoroRunning, timeLeft } = usePomodoro();
  const [displayTime, setDisplayTime] = useState(0);

  // Calculate real-time total including active timer/pomodoro
  useEffect(() => {
    const calculateTotal = () => {
      const todayTimeTracker = getTodayTotalTime();
      const todayPomodoro = getTodayPomodoroTime();
      
      let activeTime = 0;
      // Add currently running stopwatch time
      if (isTimerRunning) {
        activeTime += elapsedTime;
      }
      // Add currently running pomodoro time (elapsed = 25*60 - timeLeft for work phase)
      if (isPomodoroRunning) {
        const pomodoroElapsed = 25 * 60 - timeLeft;
        if (pomodoroElapsed > 0) {
          activeTime += pomodoroElapsed;
        }
      }
      
      return todayTimeTracker + todayPomodoro + activeTime;
    };

    setDisplayTime(calculateTotal());
    
    // Update every second when timer is running
    if (isTimerRunning || isPomodoroRunning) {
      const interval = setInterval(() => {
        setDisplayTime(calculateTotal());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [getTodayTotalTime, getTodayPomodoroTime, elapsedTime, isTimerRunning, isPomodoroRunning, timeLeft]);

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
