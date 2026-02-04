import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Timer, ChevronDown, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { PomodoroPhase } from '@/types/service';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TaskDialog } from '@/components/TaskDialog';
import { HabitDialog } from '@/components/HabitDialog';

type TimerMode = 'pomodoro' | 'stopwatch';
type SelectorCategory = 'task' | 'habit' | null;

export function PomodoroWidgetCompact() {
  const { t } = useTranslation();
  const { tasks, categories: taskCategories, tags: taskTags, addTask, addCategory: addTaskCategory, addTag: addTaskTag } = useTasks();
  const { habits, categories: habitCategories, tags: habitTags, addHabit } = useHabits();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [selectorCategory, setSelectorCategory] = useState<SelectorCategory>(null);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchStartTime, setStopwatchStartTime] = useState<number | null>(null);
  const [isStopped, setIsStopped] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [unsavedTime, setUnsavedTime] = useState(0);
  const [selectedItemType, setSelectedItemType] = useState<'task' | 'habit'>('task');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  
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

  const { startTimer, stopTimer, activeTimer, addManualEntry } = useTimeTracker();

  const today = format(new Date(), 'yyyy-MM-dd');
  const dayOfWeek = new Date().getDay();

  // Filter today's tasks and habits (include completed for selection)
  const todayTasks = tasks.filter(task => task.dueDate === today && !task.archivedAt);
  const todayHabits = habits.filter(h => h.targetDays.includes(dayOfWeek) && !h.archivedAt);

  const selectedTask = tasks.find(t => t.id === currentTaskId);
  const selectedHabit = habits.find(h => h.id === currentHabitId);

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

  const handleCategorySelect = (category: SelectorCategory) => {
    if (selectorCategory === category) {
      setSelectorCategory(null);
    } else {
      setSelectorCategory(category);
    }
  };

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
    setSelectorCategory(null);
  };

  const handlePlayPause = () => {
    if (mode === 'pomodoro') {
      if (isRunning) {
        pause();
      } else {
        // Allow start without task/habit selection
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
        // Allow start without task selection
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
        // Show save dialog if no task/habit selected and time elapsed
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
        // Show save dialog if no task selected and time elapsed
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
      // Get goal and sphere from the selected item
      let goalId: string | undefined;
      let sphereId: number | undefined;
      
      if (selectedItemType === 'task') {
        const task = tasks.find(t => t.id === selectedItemId);
        goalId = task?.goalId;
        sphereId = task?.sphereId;
        // Add manual entry with the elapsed time
        addManualEntry(
          selectedItemId,
          unsavedTime,
          goalId,
          sphereId,
          undefined,
          task?.name
        );
      } else {
        const habit = habits.find(h => h.id === selectedItemId);
        goalId = habit?.goalId;
        sphereId = habit?.sphereId;
        // Add manual entry for habit
        addManualEntry(
          selectedItemId,
          unsavedTime,
          goalId,
          sphereId,
          selectedItemId,
          habit?.name
        );
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

  const handleCreateNew = (type: 'task' | 'habit') => {
    setSaveDialogOpen(false);
    if (type === 'task') {
      setShowTaskDialog(true);
    } else {
      setShowHabitDialog(true);
    }
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

          {/* Selected item display */}
          <div className="flex-1 min-w-0 text-[9px] text-muted-foreground px-1 truncate">
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
              <span className="text-muted-foreground italic">Без привязки</span>
            )}
          </div>
        </div>

        {/* Bottom chevron selector - inside widget */}
        <div className="mt-1.5 pt-1 border-t border-border/50">
          <button 
            onClick={() => {
              setIsTaskSelectorOpen(!isTaskSelectorOpen);
              if (!isTaskSelectorOpen) setSelectorCategory(null);
            }}
            className="w-full flex items-center justify-center text-[9px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
          >
            <span className="mr-1">Привязать к</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", isTaskSelectorOpen && "rotate-180")} />
          </button>
        </div>

        {/* Inline Dropdown - inside widget, expands widget height */}
        <AnimatePresence>
          {isTaskSelectorOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 border-t border-border/50 pt-1.5">
                {/* Category buttons */}
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleCategorySelect('task')}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors",
                      selectorCategory === 'task' 
                        ? "bg-task/10 text-task" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Задачи ({todayTasks.length})
                  </button>
                  <button
                    onClick={() => handleCategorySelect('habit')}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors border-l border-border",
                      selectorCategory === 'habit' 
                        ? "bg-habit/10 text-habit" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Привычки ({todayHabits.length})
                  </button>
                </div>

                {/* Items list */}
                <AnimatePresence mode="wait">
                  {selectorCategory && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-1.5 max-h-32 overflow-auto bg-muted/30 rounded-lg"
                    >
                      {selectorCategory === 'task' && (
                        <>
                          {todayTasks.length > 0 ? (
                            todayTasks.map(task => (
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
                            ))
                          ) : (
                            <div className="px-2 py-2 text-[9px] text-muted-foreground text-center">
                              Нет задач на сегодня
                            </div>
                          )}
                        </>
                      )}

                      {selectorCategory === 'habit' && (
                        <>
                          {todayHabits.length > 0 ? (
                            todayHabits.map(habit => {
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
                            })
                          ) : (
                            <div className="px-2 py-2 text-[9px] text-muted-foreground text-center">
                              Нет привычек на сегодня
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hint when no category selected */}
                {!selectorCategory && (
                  <div className="px-2 py-1.5 text-[9px] text-muted-foreground text-center">
                    Выберите категорию
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Save time dialog - mandatory selection */}
      <Dialog open={saveDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm p-3" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Сохранить время?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Вы отработали <span className="font-bold text-foreground">{formatTime(unsavedTime)}</span>. 
              Выберите, куда привязать результат:
            </p>
            
            <div className="space-y-2">
              {/* Type toggle */}
              <div className="flex gap-2">
                <Button
                  variant={selectedItemType === 'task' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedItemType('task');
                    setSelectedItemId('');
                  }}
                  className="flex-1 text-xs h-7"
                >
                  Задача
                </Button>
                <Button
                  variant={selectedItemType === 'habit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedItemType('habit');
                    setSelectedItemId('');
                  }}
                  className="flex-1 text-xs h-7"
                >
                  Привычка
                </Button>
              </div>
              
              {/* Items list */}
              <div className="max-h-32 overflow-auto border border-border rounded-md">
                {selectedItemType === 'task' ? (
                  todayTasks.length > 0 ? (
                    todayTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedItemId(task.id)}
                        className={cn(
                          "w-full px-2 py-1.5 text-left text-xs flex items-center gap-1.5 transition-colors",
                          selectedItemId === task.id 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        {task.icon && <span>{task.icon}</span>}
                        <span className="truncate">{task.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                      Нет задач на сегодня
                    </div>
                  )
                ) : (
                  todayHabits.length > 0 ? (
                    todayHabits.map(habit => (
                      <button
                        key={habit.id}
                        onClick={() => setSelectedItemId(habit.id)}
                        className={cn(
                          "w-full px-2 py-1.5 text-left text-xs flex items-center gap-1.5 transition-colors",
                          selectedItemId === habit.id 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        {habit.icon && <span>{habit.icon}</span>}
                        <span className="truncate">{habit.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                      Нет привычек на сегодня
                    </div>
                  )
                )}
              </div>

              {/* Create new button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateNew(selectedItemType)}
                className="w-full text-xs h-7 gap-1"
              >
                <Plus className="w-3 h-3" />
                Создать новую {selectedItemType === 'task' ? 'задачу' : 'привычку'}
              </Button>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
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

      {/* Task creation dialog */}
      <TaskDialog
        open={showTaskDialog}
        onClose={() => setShowTaskDialog(false)}
        categories={taskCategories}
        tags={taskTags}
        onAddCategory={addTaskCategory}
        onAddTag={addTaskTag}
        onSave={(taskData) => {
          const newTask = addTask(taskData);
          setShowTaskDialog(false);
          // After creating, select this task and save time
          setSelectedItemType('task');
          setSelectedItemId(newTask.id);
          setSaveDialogOpen(true);
        }}
      />

      {/* Habit creation dialog */}
      <HabitDialog
        open={showHabitDialog}
        onClose={() => setShowHabitDialog(false)}
        categories={habitCategories}
        tags={habitTags}
        onSave={(habitData) => {
          const newHabit = addHabit(habitData);
          setShowHabitDialog(false);
          // After creating, select this habit and save time
          setSelectedItemType('habit');
          setSelectedItemId(newHabit.id);
          setSaveDialogOpen(true);
        }}
      />
    </>
  );
}
