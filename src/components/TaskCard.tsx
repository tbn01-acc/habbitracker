import { motion } from 'framer-motion';
import { Check, MoreVertical, Pencil, Trash2, Repeat, Bell, ListTodo, Paperclip, StickyNote } from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, index, onToggle, onEdit, onDelete }: TaskCardProps) {
  const { t } = useTranslation();

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

  const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString());
  const isToday = task.dueDate === new Date().toISOString().split('T')[0];
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-card rounded-2xl p-4 shadow-card border border-border transition-all",
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
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
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
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
        </div>
      </div>
    </motion.div>
  );
}
