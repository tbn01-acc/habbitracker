import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Target, Settings } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { useHabitNotifications } from '@/hooks/useHabitNotifications';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Habit, HABIT_COLORS } from '@/types/habit';
import { HabitCard } from '@/components/HabitCard';
import { HabitDialog } from '@/components/HabitDialog';
import { PageHeader } from '@/components/PageHeader';
import { ViewTabs, ViewType } from '@/components/ViewTabs';
import { CalendarViewNew } from '@/components/CalendarViewNew';
import { ProgressView } from '@/components/ProgressView';
import { GenericSettingsDialog } from '@/components/GenericSettingsDialog';
import { ExportButtons } from '@/components/ExportButtons';
import { LimitWarning, LimitBadge } from '@/components/LimitWarning';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { exportHabitsToCSV, exportHabitsToPDF } from '@/utils/exportData';
import { toast } from 'sonner';
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

interface HabitsProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Habits({ openDialog, onDialogClose }: HabitsProps) {
  const { 
    habits, categories, tags, isLoading, 
    addHabit, updateHabit, deleteHabit, toggleHabitCompletion,
    addCategory, updateCategory, deleteCategory,
    addTag, updateTag, deleteTag
  } = useHabits();
  
  // Enable habit notifications
  useHabitNotifications(habits);
  
  // Usage limits
  const { getHabitsLimit } = useUsageLimits();
  const habitsLimit = getHabitsLimit(habits.length);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfirmHabit, setDeleteConfirmHabit] = useState<Habit | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('habits');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
    } else {
      // Check limit before adding
      if (!habitsLimit.canAdd) {
        toast.error(t('language') === 'ru' ? 'Достигнут лимит привычек. Перейдите на PRO!' : 'Habit limit reached. Upgrade to PRO!');
        return;
      }
      addHabit(habitData);
    }
    setEditingHabit(null);
    setDialogOpen(false);
    onDialogClose?.();
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    setDeleteConfirmHabit(habit);
  };

  const confirmDelete = () => {
    if (deleteConfirmHabit) {
      deleteHabit(deleteConfirmHabit.id);
      setDeleteConfirmHabit(null);
    }
  };

  // Filter habits
  const filteredHabits = habits.filter(habit => {
    if (filterCategory && habit.categoryId !== filterCategory) return false;
    if (filterTag && !habit.tagIds?.includes(filterTag)) return false;
    return true;
  });

  const hasFilters = filterCategory || filterTag;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-habit" />
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
          icon={<Target className="w-5 h-5 text-habit" />}
          iconBgClass="bg-habit/20"
          title={t('myHabits')}
          subtitle={
            <span className="flex items-center gap-2">
              {`${habits.length} ${t('habits').toLowerCase()}`}
              <LimitBadge current={habits.length} max={habitsLimit.max} />
            </span>
          }
          rightAction={
            <div className="flex items-center gap-1">
              <ExportButtons
                onExportCSV={() => {
                  exportHabitsToCSV(habits, t as unknown as Record<string, string>);
                  toast.success(t('exportSuccess'));
                }}
                onExportPDF={() => {
                  exportHabitsToPDF(habits, t as unknown as Record<string, string>);
                }}
                accentColor="hsl(var(--habit))"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9"
              >
                <Settings className="w-5 h-5 text-habit" />
              </Button>
            </div>
          }
        />

        {/* Limit Warning */}
        <LimitWarning current={habits.length} max={habitsLimit.max} type="habits" />

        {/* Category/Tag Filters */}
        {(categories.length > 0 || tags.length > 0) && (
          <div className="mb-4 space-y-2">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    !filterCategory ? "bg-habit text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {t('uncategorized')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                      filterCategory === cat.id ? "text-white" : "bg-muted text-muted-foreground"
                    )}
                    style={filterCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1",
                      filterTag === tag.id ? "text-white" : "bg-muted/50 text-muted-foreground"
                    )}
                    style={filterTag === tag.id ? { backgroundColor: tag.color } : undefined}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
            {hasFilters && (
              <button
                onClick={() => { setFilterCategory(null); setFilterTag(null); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* View Tabs */}
        <div className="mt-6">
          <ViewTabs value={activeView} onValueChange={setActiveView} />
        </div>

        {/* Content based on active view */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeView === 'habits' && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredHabits.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-habit/20 to-habit/10 flex items-center justify-center">
                        <Target className="w-10 h-10 text-habit" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {hasFilters ? t('noHabitsToShow') : t('startBuilding')}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                        {hasFilters ? t('clearFilters') : t('createFirst')}
                      </p>
                      {!hasFilters && (
                        <Button 
                          onClick={() => setDialogOpen(true)}
                          className="bg-habit text-white hover:bg-habit/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('createHabit')}
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHabits.map((habit, index) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          index={index}
                          onToggle={(date) => toggleHabitCompletion(habit.id, date)}
                          onEdit={() => handleEditHabit(habit)}
                          onDelete={() => handleDeleteHabit(habit)}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeView === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <CalendarViewNew 
                  habits={filteredHabits} 
                  onToggle={toggleHabitCompletion}
                  initialPeriod="7"
                />
              </motion.div>
            )}

            {activeView === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <ProgressView habits={filteredHabits} initialPeriod="7" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      {habits.length > 0 && activeView === 'habits' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-6"
        >
          <Button
            onClick={() => {
              setEditingHabit(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full bg-habit hover:bg-habit/90 shadow-lg p-0"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <HabitDialog
        open={dialogOpen || !!openDialog}
        onClose={() => {
          setDialogOpen(false);
          setEditingHabit(null);
          onDialogClose?.();
        }}
        onSave={handleSaveHabit}
        habit={editingHabit}
        categories={categories}
        tags={tags}
      />

      <GenericSettingsDialog
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
        colors={HABIT_COLORS}
        accentColor="hsl(168, 80%, 40%)"
        title={t('habitSettings')}
      />

      <AlertDialog open={!!deleteConfirmHabit} onOpenChange={() => setDeleteConfirmHabit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteHabit')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
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
