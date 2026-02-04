import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, CheckSquare, Settings } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { useTaskReminders } from '@/hooks/useTaskReminders';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useOverdueNotifications } from '@/hooks/useOverdueNotifications';
import { useOverdueTasks } from '@/hooks/useOverdueTasks';
import { useGoals } from '@/hooks/useGoals';
import { useDeadlineNotifications } from '@/hooks/useDeadlineNotifications';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from '@/components/TaskCard';
import { TaskDialog } from '@/components/TaskDialog';
import { TaskSettingsDialog } from '@/components/TaskSettingsDialog';
import { TaskViewTabs } from '@/components/TaskViewTabs';
import { TaskProgressView } from '@/components/TaskProgressView';
import { TaskMonthCalendar } from '@/components/task/TaskMonthCalendar';
import { PageHeader } from '@/components/PageHeader';
import { CalendarExportButtons } from '@/components/CalendarExportButtons';
import { LimitWarning, LimitBadge } from '@/components/LimitWarning';
import { StatusGroupedList } from '@/components/StatusGroupedList';
import { SphereGoalFilter } from '@/components/SphereGoalFilter';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { exportTasksToCSV, exportTasksToPDF } from '@/utils/exportData';
import { exportTasksToICS } from '@/utils/icsExport';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { addDays, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TasksProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Tasks({ openDialog, onDialogClose }: TasksProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const { 
    tasks, categories, tags, isLoading, 
    addTask, updateTask, deleteTask, toggleTaskCompletion,
    addCategory, updateCategory, deleteCategory,
    addTag, updateTag, deleteTag
  } = useTasks();
  const { goals } = useGoals();
  const timeTracker = useTimeTracker();
  const { getTasksLimit } = useUsageLimits();
  const tasksLimit = getTasksLimit(tasks.length);
  const { syncTask } = useGoogleCalendar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'progress'>('list');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [filterSphereId, setFilterSphereId] = useState<number | null>(null);
  const [filterGoalId, setFilterGoalId] = useState<string | null>(null);
  const { t } = useTranslation();

  // Show notifications for overdue and high-priority tasks
  useTaskNotifications(tasks);
  
  // Show toast notifications for overdue tasks on app load
  useOverdueNotifications({ tasks });
  
  // Auto-move overdue tasks to today
  useOverdueTasks(tasks, updateTask);
  
  // Task reminders with push notifications
  const { requestPermission } = useTaskReminders(tasks, updateTask);

  // Deadline notifications for tasks and goals
  useDeadlineNotifications(
    tasks.map(t => ({ id: t.id, name: t.name, dueDate: t.dueDate, completed: t.completed })),
    goals.map(g => ({ id: g.id, name: g.name, target_date: g.target_date || null, status: g.status }))
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDate = startOfDay(new Date());

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      // Check limit before adding
      if (!tasksLimit.canAdd) {
        toast.error(t('language') === 'ru' ? 'Достигнут лимит задач. Перейдите на PRO!' : 'Task limit reached. Upgrade to PRO!');
        return;
      }
      addTask(taskData);
    }
    setEditingTask(null);
    setDialogOpen(false);
    onDialogClose?.();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeleteConfirmTask(task);
  };

  const confirmDelete = () => {
    if (deleteConfirmTask) {
      deleteTask(deleteConfirmTask.id);
      setDeleteConfirmTask(null);
    }
  };

  // Postpone handler
  const handlePostpone = (taskId: string, days: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newPostponeCount = (task.postponeCount || 0) + 1;
    const newDueDate = format(addDays(new Date(task.dueDate), days), 'yyyy-MM-dd');

    updateTask(taskId, {
      ...task,
      dueDate: newDueDate,
      postponeCount: newPostponeCount,
    });

    toast.success(isRussian 
      ? `Задача перенесена на ${days} дн.` 
      : `Task postponed by ${days} days`);
  };

  // Archive handler
  const handleArchive = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(taskId, {
      ...task,
      archivedAt: new Date().toISOString(),
    });

    toast.success(isRussian ? 'Задача перемещена в архив' : 'Task moved to archive');
  };

  // Filter out archived tasks and get unique tasks (for recurring, show only the base task)
  const activeTasks = useMemo(() => {
    const nonArchived = tasks.filter(t => !t.archivedAt);
    // Show unique tasks - recurring tasks shown once with recurrence indicator
    const seen = new Set<string>();
    return nonArchived.filter(task => {
      // For recurring tasks, only show the first instance
      if (task.recurrence && task.recurrence !== 'none') {
        const baseKey = `${task.name}-${task.recurrence}`;
        if (seen.has(baseKey)) return false;
        seen.add(baseKey);
      }
      return true;
    });
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return activeTasks.filter(task => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(task.categoryId || '')) {
        return false;
      }
      if (selectedTags.length > 0 && !task.tagIds.some(id => selectedTags.includes(id))) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
        return false;
      }
      // Sphere filter - check if task's goal is in the selected sphere
      if (filterSphereId) {
        const taskGoal = goals.find(g => g.id === (task as any).goalId);
        if (!taskGoal || taskGoal.sphere_id !== filterSphereId) return false;
      }
      // Goal filter
      if (filterGoalId && (task as any).goalId !== filterGoalId) return false;
      return true;
    });
  }, [activeTasks, selectedCategories, selectedTags, selectedStatuses, filterSphereId, filterGoalId, goals]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const completed: Task[] = [];
    const inProgress: Task[] = [];
    const todayList: Task[] = [];
    const future: Task[] = [];

    filteredTasks.forEach(task => {
      const taskDueDate = startOfDay(parseISO(task.dueDate));
      const isTaskToday = task.dueDate === today;
      const isTaskFuture = isAfter(taskDueDate, todayDate);
      const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
      const totalSubtasks = task.subtasks?.length || 0;
      const hasSubtasks = totalSubtasks > 0;

      if (task.completed && isTaskToday) {
        // Completed today
        completed.push(task);
      } else if (hasSubtasks && completedSubtasks > 0 && completedSubtasks < totalSubtasks && isTaskToday) {
        // Partially completed subtasks today
        inProgress.push(task);
      } else if (isTaskToday && !task.completed) {
        // Due today, not completed
        todayList.push(task);
      } else if (isTaskFuture && !task.completed) {
        // Future tasks
        future.push(task);
      } else if (!task.completed) {
        // Overdue or other - show in today
        todayList.push(task);
      }
    });

    // Sort future by due date
    future.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return { completed, inProgress, today: todayList, future };
  }, [filteredTasks, today, todayDate]);

  const hasFilters = selectedCategories.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0 || filterSphereId || filterGoalId;

  const statuses: { value: TaskStatus; label: string }[] = [
    { value: 'not_started', label: t('statusNotStarted') },
    { value: 'in_progress', label: t('statusInProgress') },
    { value: 'done', label: t('statusDone') },
  ];

  const toggleCategory = (id: string) => {
    setSelectedCategories(
      selectedCategories.includes(id)
        ? selectedCategories.filter(c => c !== id)
        : [...selectedCategories, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTags(
      selectedTags.includes(id)
        ? selectedTags.filter(t => t !== id)
        : [...selectedTags, id]
    );
  };

  const toggleStatus = (status: TaskStatus) => {
    setSelectedStatuses(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
    setFilterSphereId(null);
    setFilterGoalId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-task" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader
          showTitle
          icon={<CheckSquare className="w-5 h-5 text-task" />}
          iconBgClass="bg-task/20"
          title={t('myTasks')}
          subtitle={
            <span className="flex items-center gap-2">
              {`${tasks.length} ${t('tasks').toLowerCase()}`}
              <LimitBadge current={tasks.length} max={tasksLimit.max} />
            </span>
          }
          rightAction={
            <div className="flex items-center gap-1">
              <CalendarExportButtons
                onExportCSV={() => {
                  exportTasksToCSV(tasks, t as unknown as Record<string, string>);
                  toast.success(t('exportSuccess'));
                }}
                onExportPDF={() => {
                  exportTasksToPDF(tasks, t as unknown as Record<string, string>);
                }}
                onExportICS={() => {
                  const tasksForExport = tasks.filter(t => t.dueDate).map(task => ({
                    id: task.id,
                    name: task.name,
                    icon: task.icon,
                    dueDate: task.dueDate,
                    dueTime: undefined,
                    description: task.notes,
                    completed: task.completed
                  }));
                  exportTasksToICS(tasksForExport);
                }}
                onSyncGoogle={async () => {
                  for (const task of tasks) {
                    await syncTask(task);
                  }
                }}
                accentColor="hsl(var(--task))"
                type="tasks"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9"
              >
                <Settings className="w-5 h-5 text-task" />
              </Button>
              {/* Add button in header */}
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setDialogOpen(true);
                }}
                size="icon"
                className="w-9 h-9 rounded-[0.35rem] bg-task hover:bg-task/90 p-0"
              >
                <Plus className="w-5 h-5 text-white" />
              </Button>
            </div>
          }
        />

        {/* Limit Warning */}
        <LimitWarning current={tasks.length} max={tasksLimit.max} type="tasks" />

        {/* Sphere/Goal Filters */}
        <div className="mb-4">
          <SphereGoalFilter
            selectedSphereId={filterSphereId}
            selectedGoalId={filterGoalId}
            onSphereChange={setFilterSphereId}
            onGoalChange={setFilterGoalId}
            accentColor="hsl(var(--task))"
          />
        </div>

        {/* Inline Filters */}
        <div className="mb-4 space-y-2">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategories([])}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  selectedCategories.length === 0 ? "bg-task text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {t('uncategorized')}
              </button>
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                      isSelected ? "text-white" : "bg-muted text-muted-foreground"
                    )}
                    style={isSelected ? { backgroundColor: cat.color } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1",
                      isSelected ? "text-white" : "bg-muted/50 text-muted-foreground"
                    )}
                    style={isSelected ? { backgroundColor: tag.color } : undefined}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {statuses.map(status => (
              <button
                key={status.value}
                onClick={() => toggleStatus(status.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs transition-all",
                  selectedStatuses.includes(status.value)
                    ? "bg-task text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* View Tabs */}
        <div className="mt-4">
          <TaskViewTabs activeView={activeView} onViewChange={setActiveView} />
        </div>

        {/* Content */}
        <div className="mt-6">
          <AnimatePresence mode="popLayout">
            {activeView === 'list' && (
              <StatusGroupedList
                items={groupedTasks}
                getItemKey={(task) => task.id}
                showInProgress={true}
                renderItem={(task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onToggle={() => toggleTaskCompletion(task.id)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task)}
                    onPostpone={handlePostpone}
                    onArchive={handleArchive}
                    activeTimer={timeTracker.activeTimer}
                    elapsedTime={timeTracker.elapsedTime}
                    onStartTimer={timeTracker.startTimer}
                    onStopTimer={timeTracker.stopTimer}
                    formatDuration={timeTracker.formatDuration}
                  />
                )}
                emptyState={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-task/20 to-task/10 flex items-center justify-center">
                      <CheckSquare className="w-10 h-10 text-task" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {t('startTasks')}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                      {t('createFirstTask')}
                    </p>
                    <Button 
                      onClick={() => setDialogOpen(true)}
                      className="bg-task text-white hover:bg-task/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('createTask')}
                    </Button>
                  </motion.div>
                }
              />
            )}

            {activeView === 'calendar' && (
              <TaskMonthCalendar
                tasks={filteredTasks}
                categories={categories}
                onToggleTask={toggleTaskCompletion}
              />
            )}

            {activeView === 'progress' && (
              <TaskProgressView
                tasks={filteredTasks}
                categories={categories}
                tags={tags}
                period={7}
                timeEntries={timeTracker.entries}
                formatDuration={timeTracker.formatDuration}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={dialogOpen || !!openDialog}
        onClose={() => {
          setDialogOpen(false);
          setEditingTask(null);
          onDialogClose?.();
        }}
        onSave={handleSaveTask}
        task={editingTask}
        categories={categories}
        tags={tags}
        onAddCategory={addCategory}
        onAddTag={addTag}
        onRequestNotificationPermission={requestPermission}
      />

      <TaskSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        categories={categories}
        tags={tags}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onAddTag={addTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

      <AlertDialog open={!!deleteConfirmTask} onOpenChange={() => setDeleteConfirmTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} {t('tasks').toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTaskDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
