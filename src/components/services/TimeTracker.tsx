import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Clock, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useTasks } from '@/hooks/useTasks';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function TimeTracker() {
  const { t } = useTranslation();
  const {
    entries,
    activeTimer,
    elapsedTime,
    startTimer,
    stopTimer,
    deleteEntry,
    getTodayEntries,
    getTodayTotalTime,
    formatDuration,
    isTimerRunning,
  } = useTimeTracker();
  
  const { tasks } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const todayEntries = getTodayEntries();
  const todayTotal = getTodayTotalTime();

  const groupedEntries = useMemo(() => {
    const groups: Record<string, typeof entries> = {};
    todayEntries.forEach(entry => {
      const task = tasks.find(t => t.id === entry.taskId);
      const key = task?.name || 'Без задачи';
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [todayEntries, tasks]);

  const handleStart = () => {
    if (selectedTaskId) {
      startTimer(selectedTaskId, selectedSubtaskId || undefined);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedSubtaskId(null);
    setIsTaskSelectorOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Active timer display */}
      <div className="text-center py-6">
        <div className="text-5xl font-bold text-foreground tracking-tight">
          {formatDuration(isTimerRunning ? elapsedTime : 0)}
        </div>
        {isTimerRunning && activeTimer && (
          <p className="text-sm text-muted-foreground mt-2">
            {tasks.find(t => t.id === activeTimer.taskId)?.name || 'Задача'}
          </p>
        )}
      </div>

      {/* Task selector */}
      <div className="space-y-3">
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
              ) : (
                <span className="text-muted-foreground">
                  {t('selectTask') || 'Выберите задачу'}
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
                {tasks.filter(t => !t.completed).map(task => (
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
                {tasks.filter(t => !t.completed).length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    {t('noActiveTasks') || 'Нет активных задач'}
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
            className="w-32 h-12 gap-2"
          >
            <Square className="w-5 h-5" />
            {t('stop') || 'Стоп'}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!selectedTaskId}
            className="w-32 h-12 gap-2 bg-service hover:bg-service/90"
          >
            <Play className="w-5 h-5" />
            {t('start') || 'Старт'}
          </Button>
        )}
      </div>

      {/* Today's summary */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('todayTime') || 'Время за сегодня'}
          </h4>
          <span className="text-lg font-bold text-service">
            {formatDuration(todayTotal)}
          </span>
        </div>

        {Object.keys(groupedEntries).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(groupedEntries).map(([taskName, taskEntries]) => {
              const totalTime = taskEntries.reduce((sum, e) => sum + e.duration, 0);
              return (
                <div key={taskName} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{taskName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {formatDuration(totalTime)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => taskEntries.forEach(e => deleteEntry(e.id))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
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
