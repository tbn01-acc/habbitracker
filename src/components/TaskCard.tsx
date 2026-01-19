import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, MoreVertical, Pencil, Trash2, Repeat, Bell, ListTodo, Paperclip, StickyNote, 
  Play, Square, Timer, Zap, CalendarClock, ChevronDown, ChevronUp, Archive,
  Calendar, Pause, RotateCcw
} from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { useGoals } from '@/hooks/useGoals';
import { useSpheres } from '@/hooks/useSpheres';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { TaskDetailDialog } from './TaskDetailDialog';
import { PostponeDialog } from './PostponeDialog';
import { triggerCompletionCelebration } from '@/utils/celebrations';
import { isBefore, startOfDay, parseISO, differenceInDays, format } from 'date-fns';


interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPostpone?: (taskId: string, days: number) => void;
  onArchive?: (taskId: string) => void;
  onSubtaskToggle?: (taskId: string, subtaskId: string) => void;
  activeTimer?: { taskId: string; subtaskId?: string } | null;
  elapsedTime?: number;
  totalTime?: number;
  onStartTimer?: (taskId: string, subtaskId?: string) => void;
  onStopTimer?: () => void;
  onPauseTimer?: () => void;
  onResetTimer?: () => void;
  formatDuration?: (seconds: number) => string;
  onTagClick?: (tagId: string) => void;
}

export function TaskCard({ 
  task, 
  index, 
  onToggle, 
  onEdit, 
  onDelete,
  onPostpone,
  onArchive,
  onSubtaskToggle,
  activeTimer,
  elapsedTime = 0,
  totalTime = 0,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResetTimer,
  formatDuration,
  onTagClick
}: TaskCardProps) {
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';
  const { tags: userTags } = useUserTags();
  const { goals } = useGoals();
  const { spheres } = useSpheres();
  const { isProActive: isPro } = useSubscription();
  const { start: startPomodoro, isRunning: isPomodoroRunning, currentTaskId: pomodoroTaskId, pause: pausePomodoro } = usePomodoro();
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [timerType, setTimerType] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const nameRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);

  const isPomodoroActiveForThis = isPomodoroRunning && pomodoroTaskId === task.id;
  const taskTags = userTags.filter(tag => task.tagIds?.includes(tag.id));
  const taskGoal = goals.find(g => g.id === (task as any).goalId);
  const taskSphere = spheres.find(s => s.id === (task as any).sphereId);

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasSubtasks = totalSubtasks > 0;
  const completionPercent = hasSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : (task.completed ? 100 : 0);

  const today = startOfDay(new Date());
  const taskDueDate = startOfDay(parseISO(task.dueDate));
  const isOverdue = !task.completed && task.status !== 'done' && isBefore(taskDueDate, today);
  const daysOverdue = isOverdue ? differenceInDays(today, taskDueDate) : 0;
  const isToday = task.dueDate === new Date().toISOString().split('T')[0];
  const isTimerActive = activeTimer?.taskId === task.id;

  // Check if name needs marquee
  useEffect(() => {
    if (nameRef.current) {
      setNeedsMarquee(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  }, [task.name]);

  const handleStartPomodoro = () => {
    if (isPomodoroRunning) {
      toast.info(isRussian ? 'Помодоро уже запущен' : 'Pomodoro already running');
      return;
    }
    startPomodoro(task.id);
    setTimerType('pomodoro');
    setTimerState('running');
    toast.success(isRussian ? `Помодоро запущен для "${task.name}"` : `Pomodoro started for "${task.name}"`);
  };

  const handleTimerClick = () => {
    if (timerState === 'idle') {
      if (onStartTimer) {
        onStartTimer(task.id);
        setTimerType('stopwatch');
        setTimerState('running');
      }
    } else if (timerState === 'running') {
      if (onPauseTimer) {
        onPauseTimer();
        setTimerState('paused');
      }
    } else if (timerState === 'paused') {
      if (onStopTimer) {
        onStopTimer();
        setTimerState('idle');
      }
    }
  };

  const handleExportICS = () => {
    const startDate = task.dueDate.replace(/-/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${startDate}
SUMMARY:${task.name}
DESCRIPTION:${task.notes || ''}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${task.name.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isRussian ? 'Файл .ics скачан' : '.ics file downloaded');
  };

  const handleGoogleCalendar = () => {
    if (!isPro) {
      toast.error(isRussian ? 'Доступно только для PRO' : 'PRO feature only');
      return;
    }
    const startDate = task.dueDate.replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.name)}&dates=${startDate}/${startDate}&details=${encodeURIComponent(task.notes || '')}`;
    window.open(url, '_blank');
  };

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-accent/20 text-accent',
    high: 'bg-destructive/20 text-destructive',
  };

  const priorityLabels = {
    low: t('priorityLow'),
    medium: t('priorityMedium'),
    high: t('priorityHigh'),
  };

  const statusLabels = {
    not_started: t('statusNotStarted'),
    in_progress: t('statusInProgress'),
    done: t('statusDone'),
  };

  const statusColors = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-amber-500/20 text-amber-600',
    done: 'bg-task/20 text-task',
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "bg-card rounded-2xl shadow-card border border-border transition-all overflow-hidden",
          task.completed && "opacity-60"
        )}
        style={{ borderLeftColor: task.color, borderLeftWidth: 4 }}
      >
        {/* Row 1: Checkbox, Icon, Name, Percent, Chevron */}
        <div 
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Checkbox - only show if no subtasks */}
          {!hasSubtasks && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!task.completed) {
                  triggerCompletionCelebration();
                }
                onToggle(); 
              }}
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                task.completed
                  ? "border-transparent bg-task"
                  : "border-task/50 hover:border-task"
              )}
            >
              {task.completed && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>
          )}

          {/* Icon */}
          <span className="text-lg flex-shrink-0">{task.icon}</span>

          {/* Name with marquee if needed */}
          <div 
            ref={nameRef}
            className={cn(
              "flex-1 min-w-0 font-medium text-foreground overflow-hidden whitespace-nowrap",
              task.completed && "line-through text-muted-foreground",
              needsMarquee && !expanded && "animate-marquee"
            )}
          >
            {task.name}
          </div>

          {/* Completion percent */}
          {hasSubtasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSubtasks(!showSubtasks);
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {completionPercent}%
            </button>
          )}

          {/* Chevron */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Subtasks dropdown */}
        <AnimatePresence>
          {showSubtasks && hasSubtasks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-2 space-y-1 overflow-hidden"
            >
              {task.subtasks.map((subtask) => (
                <div 
                  key={subtask.id}
                  className="flex items-center gap-2 pl-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSubtaskToggle?.(task.id, subtask.id)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                      subtask.completed
                        ? "border-transparent bg-task"
                        : "border-muted-foreground/50 hover:border-task"
                    )}
                  >
                    {subtask.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={cn(
                    "text-sm",
                    subtask.completed && "line-through text-muted-foreground"
                  )}>
                    {subtask.name}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Row 2: Priority, Status, Due Date, Menu */}
              <div className="flex items-center gap-2 px-3 pb-2 flex-wrap">
                <span className={cn("text-xs px-2 py-0.5 rounded-full", priorityColors[task.priority])}>
                  {priorityLabels[task.priority]}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColors[task.status])}>
                  {statusLabels[task.status]}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  isOverdue ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  {isOverdue ? `${isRussian ? 'Просрочено' : 'Overdue'} (${daysOverdue}д)` : 
                   isToday ? (isRussian ? 'Сегодня' : 'Today') : 
                   format(parseISO(task.dueDate), 'dd.MM.yyyy')}
                </span>
                
                {/* Menu */}
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('edit')}
                      </DropdownMenuItem>
                      {isPro && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleGoogleCalendar(); }}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Google Calendar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportICS(); }}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {isRussian ? 'Скачать .ics' : 'Download .ics'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Row 3-4: Sphere, Goal, Tags */}
              <div className="flex items-center gap-1.5 px-3 pb-2 flex-wrap">
                {taskSphere && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: taskSphere.color + '20', color: taskSphere.color }}
                  >
                    {taskSphere.icon} {isRussian ? taskSphere.name_ru : taskSphere.name_en}
                  </span>
                )}
                {taskGoal && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: taskGoal.color + '20', color: taskGoal.color }}
                  >
                    {taskGoal.icon} {taskGoal.name}
                  </span>
                )}
                {taskTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.id); }}
                    className="text-xs px-2 py-0.5 rounded-full transition-colors"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              {/* Row 5: Timer, Total Time, Postpone, Archive */}
              <div className="flex items-center gap-2 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                {/* Timer dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                      timerState === 'running' ? "bg-task/20 text-task" : 
                      timerState === 'paused' ? "bg-amber-500/20 text-amber-600" :
                      "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}>
                      {timerState === 'running' ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          {formatDuration ? formatDuration(elapsedTime) : formatTime(elapsedTime)}
                        </>
                      ) : timerState === 'paused' ? (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          {isRussian ? 'Стоп' : 'Stop'}
                        </>
                      ) : (
                        <>
                          <Timer className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => {
                      if (onStartTimer) {
                        onStartTimer(task.id);
                        setTimerType('stopwatch');
                        setTimerState('running');
                      }
                    }}>
                      <Play className="w-4 h-4 mr-2" />
                      {isRussian ? 'Секундомер' : 'Stopwatch'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleStartPomodoro}>
                      <Timer className="w-4 h-4 mr-2" />
                      {isRussian ? 'Помодоро' : 'Pomodoro'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Total time */}
                <span className="text-xs text-muted-foreground">
                  {isRussian ? 'Всего:' : 'Total:'} {formatTime(totalTime)}
                </span>

                <div className="flex-1" />

                {/* Postpone */}
                {onPostpone && !task.completed && (
                  <button
                    onClick={() => setPostponeOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={isRussian ? 'Отложить' : 'Postpone'}
                  >
                    <CalendarClock className="w-4 h-4" />
                  </button>
                )}

                {/* Archive */}
                {onArchive && (
                  <button
                    onClick={() => onArchive(task.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={isRussian ? 'В архив' : 'Archive'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom progress bar for subtasks (collapsed state) */}
        {hasSubtasks && !expanded && (
          <div className="h-1 bg-muted">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${completionPercent}%`,
                backgroundColor: task.color 
              }}
            />
          </div>
        )}
      </motion.div>

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onTagClick={onTagClick}
      />

      {onPostpone && onArchive && (
        <PostponeDialog
          open={postponeOpen}
          onOpenChange={setPostponeOpen}
          currentPostponeCount={task.postponeCount || 0}
          onPostpone={(days) => onPostpone(task.id, days)}
          onArchive={() => onArchive(task.id)}
          onDelete={onDelete}
          itemName={task.name}
          itemType="task"
        />
      )}
    </>
  );
}