import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Timer, Clock, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { PomodoroPhase } from '@/types/service';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TimerMode = 'pomodoro' | 'stopwatch';

export function PomodoroWidgetCompact() {
  const { t } = useTranslation();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchStartTime, setStopwatchStartTime] = useState<number | null>(null);
  const [isStopped, setIsStopped] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [unsavedTime, setUnsavedTime] = useState(0);
  const [selectedItemType, setSelectedItemType] = useState<'task' | 'habit'>('task');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const {
    currentPhase,
    timeLeft,
    isRunning,
    currentTaskId,
    currentHabitId,
    start,
    pause,
    reset,
  } = usePomodoro();

  const { startTimer, stopTimer, activeTimer } = useTimeTracker();

  const today = format(new Date(), 'yyyy-MM-dd');
  const dayOfWeek = new Date().getDay();

  // Filter today's tasks and habits (include completed for selection)
  const todayTasks = tasks.filter(task => task.dueDate === today && !task.archivedAt);
  const todayHabits = habits.filter(h => h.targetDays.includes(dayOfWeek) && !h.archivedAt);

  const selectedTask = tasks.find(t => t.id === currentTaskId);
  const selectedHabit = habits.find(h => h.id === currentHabitId);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isTaskSelectorOpen && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: 8,
        width: window.innerWidth - 16,
      });
    }
  }, [isTaskSelectorOpen]);

  // Stopwatch logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStopwatchRunning && stopwatchStartTime) {
      interval = setInterval(() => {
        setStopwatchTime(Math.floor((Date.now() - stopwatchStartTime) / 1000));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning, stopwatchStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work': return 'hsl(var(--service))';
      case 'short_break': return 'hsl(var(--success))';
      case 'long_break': return 'hsl(var(--accent))';
    }
  };

  const displayColor = mode === 'pomodoro' ? getPhaseColor(currentPhase) : 'hsl(var(--task))';

  const handleTaskSelect = (type: 'task' | 'habit', id: string) => {
    if (mode === 'pomodoro') {
      if (type === 'task') {
        start(id, undefined, undefined);
      } else {
        start(undefined, undefined, id);
      }
    } else {
      startTimer(id);
      setIsStopwatchRunning(true);
      setStopwatchStartTime(Date.now());
      setIsStopped(false);
    }
    setIsTaskSelectorOpen(false);
  };

  const handlePlayPause = () => {
    if (mode === 'pomodoro') {
      if (isRunning) {
        pause();
      } else {
        if (!currentTaskId && !currentHabitId) {
          start(undefined, undefined, undefined);
        } else {
          start(currentTaskId, undefined, currentHabitId);
        }
      }
      setIsStopped(false);
    } else {
      if (isStopwatchRunning) {
        setIsStopwatchRunning(false);
        setIsStopped(false);
      } else {
        if (!activeTimer && stopwatchTime === 0) {
          setStopwatchStartTime(Date.now());
        } else if (stopwatchStartTime) {
          setStopwatchStartTime(Date.now() - stopwatchTime * 1000);
        } else {
          setStopwatchStartTime(Date.now());
        }
        setIsStopwatchRunning(true);
        setIsStopped(false);
      }
    }
  };

  const handleStopReset = () => {
    if (mode === 'pomodoro') {
      if (isRunning) {
        pause();
        setIsStopped(true);
        if (!currentTaskId && !currentHabitId && timeLeft < 25 * 60) {
          const elapsed = 25 * 60 - timeLeft;
          if (elapsed > 10) {
            setUnsavedTime(elapsed);
            setSaveDialogOpen(true);
          }
        }
      } else if (isStopped || !isRunning) {
        reset();
        setIsStopped(false);
      }
    } else {
      if (isStopwatchRunning) {
        setIsStopwatchRunning(false);
        stopTimer();
        setIsStopped(true);
        if (!activeTimer && stopwatchTime > 10) {
          setUnsavedTime(stopwatchTime);
          setSaveDialogOpen(true);
        }
      } else if (isStopped) {
        setStopwatchTime(0);
        setStopwatchStartTime(null);
        setIsStopped(false);
      } else {
        setStopwatchTime(0);
        setStopwatchStartTime(null);
      }
    }
  };

  const handleSaveTime = () => {
    if (selectedItemId) {
      if (selectedItemType === 'task') {
        startTimer(selectedItemId);
        setTimeout(() => stopTimer(), 100);
      }
    }
    setSaveDialogOpen(false);
    setUnsavedTime(0);
    setSelectedItemId('');
    if (mode === 'pomodoro') {
      reset();
    } else {
      setStopwatchTime(0);
      setStopwatchStartTime(null);
    }
    setIsStopped(false);
  };

  const handleDiscardTime = () => {
    setSaveDialogOpen(false);
    setUnsavedTime(0);
    if (mode === 'pomodoro') {
      reset();
    } else {
      setStopwatchTime(0);
      setStopwatchStartTime(null);
    }
    setIsStopped(false);
  };

  const currentTime = mode === 'pomodoro' ? timeLeft : stopwatchTime;
  const currentRunning = mode === 'pomodoro' ? isRunning : isStopwatchRunning;

  const maxTime = mode === 'pomodoro' 
    ? (currentPhase === 'work' ? 25 * 60 : currentPhase === 'short_break' ? 5 * 60 : 15 * 60)
    : Math.max(stopwatchTime, 60 * 60);
  const progress = mode === 'pomodoro' 
    ? timeLeft / maxTime 
    : Math.min(stopwatchTime / (60 * 60), 1);

  return (
    <>
      <motion.div
        ref={widgetRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-1.5 shadow-card border border-border"
      >
        {/* Header with mode toggle - single line */}
        <div className="flex items-center gap-2 mb-1">
          <Timer className="w-3 h-3 text-service shrink-0" />
          <button
            onClick={() => setMode('pomodoro')}
            className={cn(
              "text-[9px] transition-colors",
              mode === 'pomodoro' 
                ? "text-service font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Помодоро
          </button>
          <span className="text-muted-foreground text-[9px]">/</span>
          <button
            onClick={() => setMode('stopwatch')}
            className={cn(
              "text-[9px] transition-colors",
              mode === 'stopwatch' 
                ? "text-task font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Секундомер
          </button>
        </div>

        {/* Timer display and controls */}
        <div className="flex items-center gap-1.5">
          {/* Timer circle */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke={displayColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 17}`}
                strokeDashoffset={`${2 * Math.PI * 17 * (mode === 'pomodoro' ? (1 - progress) : progress)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-bold">{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* Play/Pause button */}
          <Button
            size="icon"
            onClick={handlePlayPause}
            className="h-9 w-9 rounded-full shrink-0"
            style={{ backgroundColor: displayColor }}
          >
            {currentRunning ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </Button>

          {/* Stop/Reset button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleStopReset}
            className={cn(
              "h-7 w-7 rounded-full shrink-0",
              isStopped && "border-destructive text-destructive"
            )}
          >
            {currentRunning ? (
              <Square className="w-2.5 h-2.5" />
            ) : (
              <RotateCcw className="w-2.5 h-2.5" />
            )}
          </Button>

          {/* Task selector chevron */}
          <div className="relative flex-1 min-w-0">
            <button 
              onClick={() => setIsTaskSelectorOpen(!isTaskSelectorOpen)}
              className="w-full flex items-center justify-between text-[9px] text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-muted/50"
            >
              <span className="truncate flex-1 text-left">
                {selectedTask ? (
                  <span className="flex items-center gap-0.5 text-foreground">
                    {selectedTask.icon && <span>{selectedTask.icon}</span>}
                    <span className="truncate">{selectedTask.name}</span>
                  </span>
                ) : selectedHabit ? (
                  <span className="flex items-center gap-0.5 text-foreground">
                    {selectedHabit.icon && <span>{selectedHabit.icon}</span>}
                    <span className="truncate">{selectedHabit.name}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Выбрать...</span>
                )}
              </span>
              <ChevronDown className={cn("w-3 h-3 transition-transform shrink-0", isTaskSelectorOpen && "rotate-180")} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Dropdown - positioned below widget, scrolls with page */}
      <AnimatePresence>
        {isTaskSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-card border border-border rounded-lg shadow-lg z-40 max-h-60 overflow-auto mt-1"
            style={{ 
              minWidth: '100%',
              maxWidth: '100%',
            }}
          >
            {/* Tasks section */}
            {todayTasks.length > 0 && (
              <>
                <div className="px-2 py-1 text-[8px] text-muted-foreground font-medium bg-muted/30 sticky top-0 z-10">
                  Задачи
                </div>
                {todayTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelect('task', task.id)}
                    className={cn(
                      "w-full px-2 py-1.5 text-left hover:bg-muted flex items-center gap-1.5 text-[10px] group",
                      task.completed && "opacity-50"
                    )}
                  >
                    {task.icon && <span className="shrink-0">{task.icon}</span>}
                    <span className="overflow-hidden whitespace-nowrap flex-1">
                      <span className={cn(
                        "inline-block group-hover:animate-marquee",
                        task.completed && "line-through"
                      )}>
                        {task.name}
                      </span>
                    </span>
                    {task.completed && <span className="text-[8px] text-success">✓</span>}
                  </button>
                ))}
              </>
            )}
            
            {/* Habits section */}
            {todayHabits.length > 0 && (
              <>
                <div className="px-2 py-1 text-[8px] text-muted-foreground font-medium bg-muted/30 sticky top-0 z-10">
                  Привычки
                </div>
                {todayHabits.map(habit => {
                  const isCompletedToday = habit.completedDates?.includes(today);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleTaskSelect('habit', habit.id)}
                      className={cn(
                        "w-full px-2 py-1.5 text-left hover:bg-muted flex items-center gap-1.5 text-[10px] group",
                        isCompletedToday && "opacity-50"
                      )}
                    >
                      {habit.icon && <span className="shrink-0">{habit.icon}</span>}
                      <span className="overflow-hidden whitespace-nowrap flex-1">
                        <span className={cn(
                          "inline-block group-hover:animate-marquee",
                          isCompletedToday && "line-through"
                        )}>
                          {habit.name}
                        </span>
                      </span>
                      {isCompletedToday && <span className="text-[8px] text-success">✓</span>}
                    </button>
                  );
                })}
              </>
            )}

            {todayTasks.length === 0 && todayHabits.length === 0 && (
              <div className="px-2 py-2 text-[9px] text-muted-foreground text-center">
                Нет задач на сегодня
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save time dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm p-3">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Сохранить время?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Вы отработали <span className="font-bold text-foreground">{formatTime(unsavedTime)}</span>. 
              Привязать к задаче или привычке?
            </p>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={selectedItemType === 'task' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedItemType('task')}
                  className="flex-1 text-xs h-7"
                >
                  Задача
                </Button>
                <Button
                  variant={selectedItemType === 'habit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedItemType('habit')}
                  className="flex-1 text-xs h-7"
                >
                  Привычка
                </Button>
              </div>
              
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedItemType === 'task' ? (
                    todayTasks.map(task => (
                      <SelectItem key={task.id} value={task.id} className="text-xs">
                        {task.icon} {task.name}
                      </SelectItem>
                    ))
                  ) : (
                    todayHabits.map(habit => (
                      <SelectItem key={habit.id} value={habit.id} className="text-xs">
                        {habit.icon} {habit.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDiscardTime}
                className="flex-1 text-xs h-8"
              >
                <X className="w-3 h-3 mr-1" />
                Не сохранять
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveTime}
                disabled={!selectedItemId}
                className="flex-1 text-xs h-8"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
