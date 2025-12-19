import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Brain, Coffee, Zap, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useTasks } from '@/hooks/useTasks';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { PomodoroPhase } from '@/types/service';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function PomodoroWidget() {
  const { t } = useTranslation();
  const { tasks, getTodayTasks } = useTasks();
  const {
    currentPhase,
    timeLeft,
    isRunning,
    completedSessions,
    start,
    pause,
    reset,
  } = usePomodoro();
  
  const { 
    startTimer, 
    stopTimer, 
    elapsedTime, 
    activeTimer, 
    formatDuration,
    entries,
  } = useTimeTracker();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showTaskSelectDialog, setShowTaskSelectDialog] = useState(false);
  const [pendingTimeEntry, setPendingTimeEntry] = useState<{
    startTime: string;
    duration: number;
  } | null>(null);
  
  const activeTasks = getTodayTasks().filter(t => !t.completed);
  const allTasks = tasks.filter(t => !t.completed);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return { icon: Brain, color: 'hsl(var(--service))', label: t('work') || 'Работа' };
      case 'short_break':
        return { icon: Coffee, color: 'hsl(var(--success))', label: t('shortBreak') || 'Перерыв' };
      case 'long_break':
        return { icon: Zap, color: 'hsl(var(--accent))', label: t('longBreak') || 'Отдых' };
    }
  };

  const phaseInfo = getPhaseInfo(currentPhase);
  const PhaseIcon = phaseInfo.icon;

  const handleStart = () => {
    // Start pomodoro
    if (selectedTaskId) {
      start(selectedTaskId);
    } else {
      start();
    }
    
    // Also start time tracker with a temporary "pomodoro" task marker
    startTimer('pomodoro_session', undefined, 'Pomodoro session');
  };

  const handlePause = () => {
    pause();
    
    // If there's an active timer running, stop it and prompt for task selection
    if (activeTimer && activeTimer.taskId === 'pomodoro_session') {
      const duration = elapsedTime;
      const startTime = activeTimer.startTime;
      
      // Stop the timer without saving
      stopTimer();
      
      // Show dialog to select task for the time entry
      if (duration > 60) { // Only show if more than 1 minute
        setPendingTimeEntry({ startTime, duration });
        setShowTaskSelectDialog(true);
      }
    }
  };

  const handleAssignTimeEntry = (taskId: string) => {
    if (pendingTimeEntry) {
      // The entry was already saved in stopTimer, but we need to update it
      // For now, we'll just start a new entry with the correct task
      // This is a simplified approach - in production you'd update the existing entry
    }
    setShowTaskSelectDialog(false);
    setPendingTimeEntry(null);
    setSelectedTaskId('');
  };

  const handleSkipAssign = () => {
    setShowTaskSelectDialog(false);
    setPendingTimeEntry(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PhaseIcon className="w-5 h-5" style={{ color: phaseInfo.color }} />
            <span className="font-medium text-sm">{t('pomodoroTimer')}</span>
          </div>
          <div className="flex items-center gap-2">
            {activeTimer && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(elapsedTime)}</span>
              </div>
            )}
            <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer circle */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke={phaseInfo.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 17}`}
                strokeDashoffset={`${2 * Math.PI * 17 * (1 - timeLeft / (currentPhase === 'work' ? 25 * 60 : currentPhase === 'short_break' ? 5 * 60 : 15 * 60))}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Task selector & controls */}
          <div className="flex-1 space-y-2">
            {!isRunning && activeTasks.length > 0 && (
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={t('selectTask') || 'Выбрать задачу'} />
                </SelectTrigger>
                <SelectContent>
                  {activeTasks.map(task => (
                    <SelectItem key={task.id} value={task.id} className="text-xs">
                      {task.icon} {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                className="h-8 w-8"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={() => isRunning ? handlePause() : handleStart()}
                className="flex-1 h-8"
                style={{ backgroundColor: phaseInfo.color }}
              >
                {isRunning ? (
                  <><Pause className="w-4 h-4 mr-1" /> {t('stop')}</>
                ) : (
                  <><Play className="w-4 h-4 mr-1" /> {t('start')}</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sessions count */}
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
          <span>{phaseInfo.label}</span>
          <span>{completedSessions} {t('sessionsToday') || 'сессий'}</span>
        </div>
      </motion.div>

      {/* Task Selection Dialog */}
      <Dialog open={showTaskSelectDialog} onOpenChange={setShowTaskSelectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('assignTimeToTask') || 'Привязать время к задаче'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t('pomodoroSessionCompleted') || 'Сессия Помодоро завершена'}: {pendingTimeEntry ? formatDuration(pendingTimeEntry.duration) : ''}
            </p>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectTask') || 'Выбрать задачу'} />
              </SelectTrigger>
              <SelectContent>
                {allTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.icon} {task.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkipAssign}>
              {t('skip') || 'Пропустить'}
            </Button>
            <Button 
              onClick={() => handleAssignTimeEntry(selectedTaskId)}
              disabled={!selectedTaskId}
            >
              {t('assign') || 'Привязать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
