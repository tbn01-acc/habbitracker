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
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from '@/components/TaskCard';
import { TaskDialog } from '@/components/TaskDialog';
import { TaskSettingsDialog } from '@/components/TaskSettingsDialog';
import { TaskViewTabs } from '@/components/TaskViewTabs';
import { TaskProgressView } from '@/components/TaskProgressView';
import { TaskCalendarView } from '@/components/TaskCalendarView';
import { TaskFilters } from '@/components/TaskFilters';
import { PeriodSelector } from '@/components/PeriodSelector';
import { PageHeader } from '@/components/PageHeader';
import { CalendarExportButtons } from '@/components/CalendarExportButtons';
import { LimitWarning, LimitBadge } from '@/components/LimitWarning';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { exportTasksToCSV, exportTasksToPDF } from '@/utils/exportData';
import { exportTasksToICS } from '@/utils/icsExport';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
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
  const timeTracker = useTimeTracker();
  const { getTasksLimit } = useUsageLimits();
  const tasksLimit = getTasksLimit(tasks.length);
  const { syncTask } = useGoogleCalendar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'progress'>('list');
  const [period, setPeriod] = useState<'7' | '14' | '30'>('7');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const { t } = useTranslation();

  // Show notifications for overdue and high-priority tasks
  useTaskNotifications(tasks);
  
  // Show toast notifications for overdue tasks on app load
  useOverdueNotifications({ tasks });
  
  // Auto-move overdue tasks to today
  useOverdueTasks(tasks, updateTask);
  
  // Task reminders with push notifications
  const { requestPermission } = useTaskReminders(tasks, updateTask);

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

  // Filter out archived tasks
  const activeTasks = tasks.filter(t => !t.archivedAt);

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
      return true;
    });
  }, [activeTasks, selectedCategories, selectedTags, selectedStatuses]);

  // Sort: incomplete first, then by due date
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredTasks]);

  // For the list tab, hide completed tasks
  const tasksForList = useMemo(() => {
    return sortedTasks.filter(task => !task.completed);
  }, [sortedTasks]);

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
                className="rounded-xl hover:bg-task/10 w-12 h-12"
              >
                <Settings className="w-7 h-7 text-task" />
              </Button>
            </div>
          }
        />

        {/* View Tabs */}
        <div className="mt-4">
          <TaskViewTabs activeView={activeView} onViewChange={setActiveView} />
        </div>

        {/* Period Selector for calendar/progress views */}
        {activeView !== 'list' && (
          <div className="mt-4">
            <PeriodSelector value={period} onValueChange={setPeriod} />
          </div>
        )}

        {/* Filters for list view */}
        {activeView === 'list' && (
          <div className="mt-4">
            <TaskFilters
              categories={categories}
              tags={tags}
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              selectedStatuses={selectedStatuses}
              onCategoriesChange={setSelectedCategories}
              onTagsChange={setSelectedTags}
              onStatusesChange={setSelectedStatuses}
            />
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          <AnimatePresence mode="popLayout">
            {activeView === 'list' && (
              <>
                {tasksForList.length === 0 ? (
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
                ) : (
                  <div className="space-y-3">
                    {tasksForList.map((task, index) => (
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
                    ))}
                  </div>
                )}
              </>
            )}

            {activeView === 'calendar' && (
              <TaskCalendarView
                tasks={filteredTasks}
                categories={categories}
                period={parseInt(period) as 7 | 14 | 30}
                onToggleTask={toggleTaskCompletion}
              />
            )}

            {activeView === 'progress' && (
              <TaskProgressView
                tasks={filteredTasks}
                categories={categories}
                tags={tags}
                period={parseInt(period) as 7 | 14 | 30}
                timeEntries={timeTracker.entries}
                formatDuration={timeTracker.formatDuration}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-6"
        >
          <Button
            onClick={() => {
              setEditingTask(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full bg-task hover:bg-task/90 shadow-lg p-0"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

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
            <AlertDialogTitle>{t('deleteTask')}</AlertDialogTitle>
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
