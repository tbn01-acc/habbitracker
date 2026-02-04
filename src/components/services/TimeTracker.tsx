import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Clock, Trash2, ChevronDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type Period = 'today' | 'week' | 'month';

/**
 * Time Tracker Service Component
 * 
 * Displays unified time tracking that:
 * 1. Shows accumulated time for the selected period
 * 2. Includes both Pomodoro and Stopwatch time
 * 3. Groups time by task/habit
 * 4. Persists throughout the day and resets at midnight
 */
export function TimeTracker() {
  const { t } = useTranslation();
  const {
    entries,
    activeTimer,
    elapsedTime,
    startTimer,
    stopTimer,
    deleteEntry,
    formatDuration,
    isTimerRunning,
  } = useTimeTracker();
  
  const { isRunning: isPomodoroRunning, timeLeft, currentPhase, settings } = usePomodoro();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [displayTotal, setDisplayTotal] = useState(0);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const selectedHabit = habits.find(h => h.id === selectedTaskId);

  // Filter entries by period - time_entries is now the single source of truth
  // It includes both stopwatch and completed pomodoro sessions
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    switch (selectedPeriod) {
      case 'today':
        startDate = startOfToday;
        break;
      case 'week':
        startDate = new Date(startOfToday);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(startOfToday);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    return entries.filter(e => new Date(e.startTime) >= startDate);
  }, [entries, selectedPeriod]);

  // Total from time_entries (single source of truth - includes both stopwatch and pomodoro)
  const baseTotal = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.duration, 0);
  }, [filteredEntries]);

  // Calculate real-time display total
  useEffect(() => {
    const calculateRealTimeTotal = () => {
      let activeTime = 0;
      
      // Add currently running stopwatch time
      if (isTimerRunning) {
        activeTime += elapsedTime;
      }
      
      // Add currently running pomodoro time (work phase only)
      if (isPomodoroRunning && currentPhase === 'work') {
        const phaseDuration = 25 * 60;
        const pomodoroElapsed = phaseDuration - timeLeft;
        if (pomodoroElapsed > 0) {
          activeTime += pomodoroElapsed;
        }
      }
      
      return baseTotal + activeTime;
    };

    setDisplayTotal(calculateRealTimeTotal());

    // Update every second if any timer is running
    if (isTimerRunning || isPomodoroRunning) {
      const interval = setInterval(() => {
        setDisplayTotal(calculateRealTimeTotal());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [baseTotal, isTimerRunning, isPomodoroRunning, elapsedTime, timeLeft, currentPhase]);

  // Group entries by task/habit - time_entries includes all sources
  const groupedEntries = useMemo(() => {
    const groups: Record<string, { 
      name: string; 
      icon?: string; 
      duration: number; 
      entryIds: string[]; 
      isHabit?: boolean;
    }> = {};
    
    filteredEntries.forEach(entry => {
      const task = tasks.find(t => t.id === entry.taskId);
      const habit = habits.find(h => h.id === entry.taskId);
      const key = entry.taskId || 'none';
      const name = task?.name || habit?.name || entry.description || 'Без задачи';
      const icon = task?.icon || habit?.icon;
      
      if (!groups[key]) {
        groups[key] = { name, icon, duration: 0, entryIds: [], isHabit: !!habit };
      }
      groups[key].duration += entry.duration;
      groups[key].entryIds.push(entry.id);
    });

    return Object.entries(groups).sort((a, b) => b[1].duration - a[1].duration);
  }, [filteredEntries, tasks, habits]);

  const handleStart = () => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      const habit = habits.find(h => h.id === selectedTaskId);
      startTimer(
        selectedTaskId, 
        selectedSubtaskId || undefined,
        undefined,
        task?.goalId || habit?.goalId,
        task?.sphereId || habit?.sphereId,
        habit ? selectedTaskId : undefined
      );
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedSubtaskId(null);
    setIsTaskSelectorOpen(false);
  };

  const handleDeleteTaskEntries = (entryIds: string[]) => {
    entryIds.forEach(id => deleteEntry(id));
  };

  const periodLabels: Record<Period, string> = {
    today: t('today') || 'Сегодня',
    week: t('week') || 'Неделя',
    month: t('month') || 'Месяц',
  };

  const isAnyTimerRunning = isTimerRunning || isPomodoroRunning;

  return (
    <div className="space-y-4">
      {/* Active timer display */}
      <div className="text-center py-4">
        <div className={cn(
          "text-4xl font-bold tracking-tight transition-colors",
          isAnyTimerRunning ? "text-success" : "text-foreground"
        )}>
          {formatDuration(isTimerRunning ? elapsedTime : 0)}
        </div>
        {isTimerRunning && activeTimer && (
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.find(t => t.id === activeTimer.taskId)?.name || 
             habits.find(h => h.id === activeTimer.taskId)?.name || 
             'Задача'}
          </p>
        )}
        {isAnyTimerRunning && (
          <div className="flex items-center justify-center gap-1 text-xs text-success mt-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Таймер активен</span>
          </div>
        )}
      </div>

      {/* Task/Habit selector */}
      <div className="space-y-2">
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsTaskSelectorOpen(!isTaskSelectorOpen)}
            disabled={isTimerRunning}
          >
            <span className="flex items-center gap-2">
              {selectedTask ? (
                <>
                  <span>{selectedTask.icon}</span>
                  <span>{selectedTask.name}</span>
                </>
              ) : selectedHabit ? (
                <>
                  <span>{selectedHabit.icon}</span>
                  <span>{selectedHabit.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t('selectTask') || 'Выберите задачу или привычку'}
                </span>
              )}
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isTaskSelectorOpen && "rotate-180")} />
          </Button>
          
          <AnimatePresence>
            {isTaskSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-auto"
              >
                {/* Tasks section */}
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                  Задачи
                </div>
                {tasks.filter(t => !t.completed && !t.archivedAt).map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelect(task.id)}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"
                  >
                    <span>{task.icon}</span>
                    <span className="flex-1">{task.name}</span>
                    {task.subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {task.subtasks.filter(s => !s.completed).length} подзадач
                      </span>
                    )}
                  </button>
                ))}
                {tasks.filter(t => !t.completed && !t.archivedAt).length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    Нет активных задач
                  </div>
                )}
                
                {/* Habits section */}
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-t border-border">
                  Привычки
                </div>
                {habits.filter(h => !h.archivedAt).map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => handleTaskSelect(habit.id)}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"
                  >
                    <span>{habit.icon}</span>
                    <span className="flex-1">{habit.name}</span>
                  </button>
                ))}
                {habits.filter(h => !h.archivedAt).length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    Нет активных привычек
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtask selector */}
        {selectedTask && selectedTask.subtasks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSubtaskId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubtaskId(null)}
              disabled={isTimerRunning}
            >
              {t('wholeTask') || 'Вся задача'}
            </Button>
            {selectedTask.subtasks.filter(s => !s.completed).map(subtask => (
              <Button
                key={subtask.id}
                variant={selectedSubtaskId === subtask.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubtaskId(subtask.id)}
                disabled={isTimerRunning}
              >
                {subtask.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Start/Stop button */}
      <div className="flex justify-center">
        {isTimerRunning ? (
          <Button
            size="lg"
            variant="destructive"
            onClick={stopTimer}
            className="w-28 h-10 gap-2"
          >
            <Square className="w-4 h-4" />
            {t('stop') || 'Стоп'}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!selectedTaskId}
            className="w-28 h-10 gap-2 bg-service hover:bg-service/90"
          >
            <Play className="w-4 h-4" />
            {t('start') || 'Старт'}
          </Button>
        )}
      </div>

      {/* Period selector */}
      <div className="flex justify-center gap-2">
        {(['today', 'week', 'month'] as Period[]).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {periodLabels[period]}
          </Button>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {periodLabels[selectedPeriod]}
          </h4>
          <div className="flex items-center gap-2">
            {selectedPeriod === 'today' && isAnyTimerRunning && (
              <TrendingUp className="w-4 h-4 text-success" />
            )}
            <span className={cn(
              "text-lg font-bold",
              selectedPeriod === 'today' && isAnyTimerRunning ? "text-success" : "text-service"
            )}>
              {formatDuration(selectedPeriod === 'today' ? displayTotal : baseTotal)}
            </span>
          </div>
        </div>

        {groupedEntries.length > 0 ? (
          <div className="space-y-2">
            {groupedEntries.map(([key, data]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {data.icon && <span>{data.icon}</span>}
                  <span className={data.isHabit ? 'text-habit' : ''}>{data.name}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {formatDuration(data.duration)}
                  </span>
                  {data.entryIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteTaskEntries(data.entryIds)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('noTimeEntriesYet') || 'Записей пока нет'}
          </p>
        )}
      </div>
    </div>
  );
}
