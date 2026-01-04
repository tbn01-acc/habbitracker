import { Calendar, Clock, Tag, Edit2, Trash2, ListTodo, Repeat, Bell, AlertCircle } from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tagId: string) => void;
}

export function TaskDetailDialog({ open, onOpenChange, task, onEdit, onDelete, onTagClick }: TaskDetailDialogProps) {
  const { t } = useTranslation();
  const { tags: userTags } = useUserTags();
  
  const taskTags = userTags.filter(tag => task.tagIds?.includes(tag.id));
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString());
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-accent/20 text-accent',
    high: 'bg-destructive/20 text-destructive',
  };

  const statusColors = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-amber-500/20 text-amber-600',
    done: 'bg-task/20 text-task',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-task/20 flex items-center justify-center text-2xl">
              {task.icon}
            </div>
            <div>
              <h2 className={cn("text-xl font-semibold", task.completed && "line-through text-muted-foreground")}>
                {task.name}
              </h2>
              <p className="text-sm text-muted-foreground font-normal">{t('task')}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Status & Priority */}
            <div className="flex gap-2">
              <Badge className={statusColors[task.status]}>
                {task.status === 'done' ? t('statusDone') : task.status === 'in_progress' ? t('statusInProgress') : t('statusNotStarted')}
              </Badge>
              <Badge className={priorityColors[task.priority]}>
                {task.priority === 'high' ? t('priorityHigh') : task.priority === 'medium' ? t('priorityMedium') : t('priorityLow')}
              </Badge>
              {task.recurrence && task.recurrence !== 'none' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  {task.recurrence}
                </Badge>
              )}
            </div>

            {/* Due Date */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              isOverdue ? "bg-destructive/10" : "bg-muted/50"
            )}>
              {isOverdue ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <Calendar className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t('dueDate')}</p>
                <p className={cn("font-medium", isOverdue && "text-destructive")}>
                  {task.dueDate}
                </p>
              </div>
              {task.reminder?.enabled && (
                <Bell className="w-4 h-4 text-task ml-auto" />
              )}
            </div>

            {/* Notes */}
            {task.notes && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">{t('taskNotes')}</p>
                <p className="text-sm">{task.notes}</p>
              </div>
            )}

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <ListTodo className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {t('subtasks')} ({completedSubtasks}/{totalSubtasks})
                  </span>
                </div>
                <div className="space-y-2">
                  {task.subtasks?.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox checked={subtask.completed} disabled />
                      <span className={cn("text-sm", subtask.completed && "line-through text-muted-foreground")}>
                        {subtask.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {taskTags.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('tagsLabel')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {taskTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => { onTagClick?.(tag.id); onOpenChange(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm">{tag.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="text-xs text-muted-foreground text-center">
              {t('createdAt')}: {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => { onEdit(); onOpenChange(false); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
          <Button variant="destructive" onClick={() => { onDelete(); onOpenChange(false); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
