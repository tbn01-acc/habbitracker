import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MoreVertical, Pencil, Trash2, Repeat, Bell, ListTodo, Paperclip, StickyNote, Play, Square, Timer, Zap, CalendarClock } from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { toast } from 'sonner';
import { TaskDetailDialog } from './TaskDetailDialog';
import { PostponeDialog } from './PostponeDialog';
import { triggerCompletionCelebration } from '@/utils/celebrations';
import { isBefore, startOfDay, parseISO, differenceInDays } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPostpone?: (taskId: string, days: number) => void;
  onArchive?: (taskId: string) => void;
  activeTimer?: { taskId: string; subtaskId?: string } | null;
  elapsedTime?: number;
  onStartTimer?: (taskId: string, subtaskId?: string) => void;
  onStopTimer?: () => void;
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
  activeTimer,
  elapsedTime = 0,
  onStartTimer,
  onStopTimer,
  formatDuration,
  onTagClick
}: TaskCardProps) {
  const { t } = useTranslation();
  const { tags: userTags } = useUserTags();
  const { start: startPomodoro, isRunning: isPomodoroRunning, currentTaskId: pomodoroTaskId } = usePomodoro();
  const [detailOpen, setDetailOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);

  const isPomodoroActiveForThis = isPomodoroRunning && pomodoroTaskId === task.id;
  const taskTags = userTags.filter(tag => task.tagIds?.includes(tag.id));

  const handleStartPomodoro = () => {
    if (isPomodoroRunning) {
      toast.info('Помодоро уже запущен');
      return;
    }
    startPomodoro(task.id);
    toast.success(`Помодоро запущен для "${task.name}"`);
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

  const recurrenceLabels = {
    daily: t('recurrenceDaily'),
    weekly: t('recurrenceWeekly'),
    monthly: t('recurrenceMonthly'),
  };

  const today = startOfDay(new Date());
  const taskDueDate = startOfDay(parseISO(task.dueDate));
  const isOverdue = !task.completed && task.status !== 'done' && isBefore(taskDueDate, today);
  const daysOverdue = isOverdue ? differenceInDays(today, taskDueDate) : 0;
  const isToday = task.dueDate === new Date().toISOString().split('T')[0];
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isTimerActive = activeTimer?.taskId === task.id;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "bg-card rounded-2xl p-4 shadow-card border border-border transition-all cursor-pointer hover:shadow-md",
          task.completed && "opacity-60"
        )}
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!task.completed) {
                triggerCompletionCelebration();
              }
              onToggle(); 
            }}
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
              task.completed
                ? "border-transparent bg-task"
                : "border-task/50 hover:border-task"
            )}
          >
            {task.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{task.icon}</span>
                <h3 
                  className={cn(
                    "font-medium text-foreground",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.name}
                </h3>
              </div>

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
                  {onPostpone && !task.completed && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPostponeOpen(true); }}>
                      <CalendarClock className="w-4 h-4 mr-2" />
                      {t('postpone') || 'Перенести'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Overdue Badge with Lightning */}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium animate-pulse">
                  <Zap className="w-3 h-3" />
                  Просрочено {daysOverdue > 1 ? `(${daysOverdue} дн.)` : ''}
                </span>
              )}
              <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColors[task.status])}>
                {statusLabels[task.status]}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", priorityColors[task.priority])}>
                {priorityLabels[task.priority]}
              </span>
              <span 
                className={cn(
                  "text-xs",
                  isOverdue ? "text-destructive" : isToday ? "text-task" : "text-muted-foreground"
                )}
              >
                {isOverdue ? t('overdue') : isToday ? t('today') : task.dueDate}
              </span>
              {task.recurrence && task.recurrence !== 'none' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-task/10 text-task flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  {recurrenceLabels[task.recurrence]}
                </span>
              )}
              {task.reminder?.enabled && (
                <Bell className="w-3 h-3 text-task" />
              )}
              {totalSubtasks > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  <ListTodo className="w-3 h-3" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
              {(task.attachments?.length || 0) > 0 && (
                <Paperclip className="w-3 h-3 text-muted-foreground" />
              )}
              {task.notes && (
                <StickyNote className="w-3 h-3 text-amber-500" />
              )}
            </div>

            {/* Tags */}
            {taskTags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {taskTags.slice(0, 3).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => onTagClick?.(tag.id)}
                    className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-muted-foreground">{tag.name}</span>
                  </button>
                ))}
                {taskTags.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{taskTags.length - 3}</span>
                )}
              </div>
            )}

            {/* Timer buttons */}
            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              {onStartTimer && onStopTimer && !task.completed && (
                <button
                  onClick={() => isTimerActive ? onStopTimer() : onStartTimer(task.id)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors",
                    isTimerActive 
                      ? "bg-destructive/20 text-destructive hover:bg-destructive/30" 
                      : "bg-service/20 text-service hover:bg-service/30"
                  )}
                >
                  {isTimerActive ? (
                    <>
                      <Square className="w-3 h-3" />
                      {formatDuration ? formatDuration(elapsedTime) : '00:00'}
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      {t('startTimer')}
                    </>
                  )}
                </button>
              )}

              {!task.completed && (
                <button
                  onClick={handleStartPomodoro}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors",
                    isPomodoroActiveForThis 
                      ? "bg-task/30 text-task animate-pulse" 
                      : "bg-task/10 text-task hover:bg-task/20"
                  )}
                  title={isPomodoroActiveForThis ? 'Помодоро активен' : 'Запустить Помодоро'}
                >
                  <Timer className="w-3 h-3" />
                  {isPomodoroActiveForThis ? 'Помодоро' : 'Помодоро'}
                </button>
              )}
            </div>
          </div>
        </div>
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
