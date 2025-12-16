import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, CheckSquare, Settings } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { useTaskReminders } from '@/hooks/useTaskReminders';
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
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
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
  const { 
    tasks, categories, tags, isLoading, 
    addTask, updateTask, deleteTask, toggleTaskCompletion,
    addCategory, updateCategory, deleteCategory,
    addTag, updateTag, deleteTag
  } = useTasks();
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
  
  // Task reminders with push notifications
  const { requestPermission } = useTaskReminders(tasks, updateTask);

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
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
  }, [tasks, selectedCategories, selectedTags, selectedStatuses]);

  // Sort: incomplete first, then by due date
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredTasks]);

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
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <PageHeader
            showTitle
            icon={<CheckSquare className="w-5 h-5 text-task" />}
            iconBgClass="bg-task/20"
            title={t('myTasks')}
            subtitle={`${tasks.length} ${t('tasks').toLowerCase()}`}
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
                {sortedTasks.length === 0 ? (
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
                    {sortedTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onToggle={() => toggleTaskCompletion(task.id)}
                        onEdit={() => handleEditTask(task)}
                        onDelete={() => handleDeleteTask(task)}
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
