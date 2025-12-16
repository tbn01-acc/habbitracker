import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Bell, BellOff, Repeat, ListTodo, Paperclip } from 'lucide-react';
import { Task, TaskCategory, TaskTag, TaskStatus, TaskRecurrence, TaskReminder, SubTask, TaskAttachment, TASK_ICONS, TASK_COLORS } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SubtaskList } from '@/components/SubtaskList';
import { TaskAttachments } from '@/components/TaskAttachments';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getNotificationPermissionStatus } from '@/hooks/useTaskReminders';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  task?: Task | null;
  categories: TaskCategory[];
  tags: TaskTag[];
  onAddCategory?: (category: Omit<TaskCategory, 'id'>) => void;
  onAddTag?: (tag: Omit<TaskTag, 'id'>) => void;
  onRequestNotificationPermission?: () => Promise<boolean>;
}

export function TaskDialog({ open, onClose, onSave, task, categories, tags, onAddCategory, onAddTag, onRequestNotificationPermission }: TaskDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(TASK_ICONS[0]);
  const [color, setColor] = useState(TASK_COLORS[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (task) {
      setName(task.name);
      setIcon(task.icon);
      setColor(task.color);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setStatus(task.status);
      setCategoryId(task.categoryId);
      setTagIds(task.tagIds);
      setRecurrence(task.recurrence || 'none');
      setReminderEnabled(task.reminder?.enabled || false);
      setReminderTime(task.reminder?.time || '09:00');
      setSubtasks(task.subtasks || []);
      setAttachments(task.attachments || []);
      setNotes(task.notes || '');
      setShowSubtasks((task.subtasks?.length || 0) > 0);
      setShowAttachments((task.attachments?.length || 0) > 0 || !!task.notes);
    } else {
      setName('');
      setIcon(TASK_ICONS[0]);
      setColor(TASK_COLORS[0]);
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('medium');
      setStatus('not_started');
      setCategoryId(undefined);
      setTagIds([]);
      setRecurrence('none');
      setReminderEnabled(false);
      setReminderTime('09:00');
      setSubtasks([]);
      setAttachments([]);
      setNotes('');
      setShowSubtasks(false);
      setShowAttachments(false);
    }
  }, [task, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    const reminder: TaskReminder | undefined = reminderEnabled 
      ? { enabled: true, time: reminderTime }
      : undefined;
    onSave({ 
      name: name.trim(), icon, color, dueDate, priority, status, 
      categoryId, tagIds, recurrence, reminder, subtasks, attachments, notes
    });
    onClose();
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled) {
      const permissionStatus = getNotificationPermissionStatus();
      if (permissionStatus === 'unsupported') {
        return;
      }
      if (permissionStatus !== 'granted' && onRequestNotificationPermission) {
        const granted = await onRequestNotificationPermission();
        if (!granted) return;
      }
    }
    setReminderEnabled(enabled);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && onAddCategory) {
      onAddCategory({ name: newCategoryName.trim(), color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)] });
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim() && onAddTag) {
      onAddTag({ name: newTagName.trim(), color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)] });
      setNewTagName('');
      setShowNewTag(false);
    }
  };

  const toggleTag = (id: string) => {
    setTagIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAttachmentsChange = (newAttachments: TaskAttachment[], newNotes?: string) => {
    setAttachments(newAttachments);
    if (newNotes !== undefined) setNotes(newNotes);
  };

  const priorities: Array<{ value: 'low' | 'medium' | 'high'; label: string }> = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
  ];

  const statuses: Array<{ value: TaskStatus; label: string }> = [
    { value: 'not_started', label: t('statusNotStarted') },
    { value: 'in_progress', label: t('statusInProgress') },
    { value: 'done', label: t('statusDone') },
  ];

  const recurrenceOptions: Array<{ value: TaskRecurrence; label: string }> = [
    { value: 'none', label: t('recurrenceNone') },
    { value: 'daily', label: t('recurrenceDaily') },
    { value: 'weekly', label: t('recurrenceWeekly') },
    { value: 'monthly', label: t('recurrenceMonthly') },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-24 max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {task ? t('editTask') : t('newTask')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('taskName')}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('taskNamePlaceholder')}
                className="bg-background border-border"
              />
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('dueDate')}
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('priority')}
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                      priority === p.value
                        ? "bg-task text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('status')}
              </label>
              <div className="flex gap-2">
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all",
                      status === s.value
                        ? "bg-task text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurrence */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <Repeat className="w-4 h-4 inline mr-1" />
                {t('recurrence')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {recurrenceOptions.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRecurrence(r.value)}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-medium transition-all",
                      recurrence === r.value
                        ? "bg-task text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {reminderEnabled ? <Bell className="w-4 h-4 inline mr-1" /> : <BellOff className="w-4 h-4 inline mr-1" />}
                {t('reminder')}
              </label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={handleReminderToggle}
                />
                {reminderEnabled && (
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-32 bg-background border-border"
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {reminderEnabled ? t('reminderEnabled') : t('reminderDisabled')}
                </span>
              </div>
            </div>

            {/* Subtasks toggle and list */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  showSubtasks ? "text-task" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListTodo className="w-4 h-4" />
                {t('subtasks')} {subtasks.length > 0 && `(${subtasks.length})`}
              </button>
              {showSubtasks && (
                <div className="mt-2 pl-2 border-l-2 border-task/30">
                  <SubtaskList subtasks={subtasks} onChange={setSubtasks} />
                </div>
              )}
            </div>

            {/* Attachments toggle and section */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  showAttachments ? "text-task" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Paperclip className="w-4 h-4" />
                {t('attachments')} {attachments.length > 0 && `(${attachments.length})`}
              </button>
              {showAttachments && (
                <div className="mt-2 pl-2 border-l-2 border-task/30">
                  <TaskAttachments 
                    attachments={attachments} 
                    notes={notes}
                    onChange={handleAttachmentsChange}
                  />
                </div>
              )}
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('category')}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(categoryId === cat.id ? undefined : cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-all",
                      categoryId === cat.id
                        ? "ring-2 ring-offset-2 ring-offset-card"
                        : "opacity-60 hover:opacity-100"
                    )}
                    style={{ 
                      backgroundColor: cat.color + '33', 
                      color: cat.color,
                      ...(categoryId === cat.id && { ringColor: cat.color })
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
                {showNewCategory ? (
                  <div className="flex gap-1">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="..."
                      className="h-7 w-24 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button size="sm" onClick={handleAddCategory} className="h-7 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    + {t('addCategory')}
                  </button>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('tagsLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-all",
                      tagIds.includes(tag.id)
                        ? "ring-2 ring-offset-2 ring-offset-card"
                        : "opacity-60 hover:opacity-100"
                    )}
                    style={{ 
                      backgroundColor: tag.color + '33', 
                      color: tag.color 
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
                {showNewTag ? (
                  <div className="flex gap-1">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="..."
                      className="h-7 w-24 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button size="sm" onClick={handleAddTag} className="h-7 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewTag(true)}
                    className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    + {t('addTag')}
                  </button>
                )}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('icon')}
              </label>
              <div className="grid grid-cols-8 gap-2">
                {TASK_ICONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                      icon === i
                        ? "bg-task/20 ring-2 ring-task"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('color')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {TASK_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color === c && "ring-2 ring-offset-2 ring-offset-card ring-task"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full bg-task hover:bg-task/90 text-white"
            >
              {t('save')}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
