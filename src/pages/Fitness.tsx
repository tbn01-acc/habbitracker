import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Dumbbell, Settings } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import { Workout, WORKOUT_COLORS } from '@/types/fitness';
import { WorkoutCard } from '@/components/WorkoutCard';
import { WorkoutDialog } from '@/components/WorkoutDialog';
import { PageHeader } from '@/components/PageHeader';
import { GenericSettingsDialog } from '@/components/GenericSettingsDialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
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

interface FitnessProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Fitness({ openDialog, onDialogClose }: FitnessProps) {
  const { 
    workouts, categories, tags, isLoading, 
    addWorkout, updateWorkout, deleteWorkout, toggleExerciseCompletion, getTodayWorkouts,
    addCategory, updateCategory, deleteCategory,
    addTag, updateTag, deleteTag
  } = useFitness();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deleteConfirmWorkout, setDeleteConfirmWorkout] = useState<Workout | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSaveWorkout = (workoutData: Omit<Workout, 'id' | 'createdAt'>) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, workoutData);
    } else {
      addWorkout(workoutData);
    }
    setEditingWorkout(null);
    setDialogOpen(false);
    onDialogClose?.();
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setDialogOpen(true);
  };

  const handleDeleteWorkout = (workout: Workout) => {
    setDeleteConfirmWorkout(workout);
  };

  const confirmDelete = () => {
    if (deleteConfirmWorkout) {
      deleteWorkout(deleteConfirmWorkout.id);
      setDeleteConfirmWorkout(null);
    }
  };

  // Filter workouts
  const filteredWorkouts = workouts.filter(w => {
    if (filterCategory && w.categoryId !== filterCategory) return false;
    if (filterTag && !w.tagIds?.includes(filterTag)) return false;
    return true;
  });

  const hasFilters = filterCategory || filterTag;

  const todayWorkouts = getTodayWorkouts().filter(w => {
    if (filterCategory && w.categoryId !== filterCategory) return false;
    if (filterTag && !w.tagIds?.includes(filterTag)) return false;
    return true;
  });
  const today = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-fitness" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader
          showTitle
          icon={<Dumbbell className="w-5 h-5 text-fitness" />}
          iconBgClass="bg-fitness/20"
          title={t('myFitness')}
          subtitle={`${workouts.length} ${t('workoutsCount')}`}
          rightAction={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9"
            >
              <Settings className="w-5 h-5 text-fitness" />
            </Button>
          }
        />

        {/* Today's workouts info */}
        {todayWorkouts.length > 0 && (
          <div className="bg-fitness/10 rounded-2xl p-4 mb-6 border border-fitness/20">
            <p className="text-sm text-fitness font-medium mb-1">{t('today')}</p>
            <p className="text-foreground">{todayWorkouts.map(w => w.name).join(', ')}</p>
          </div>
        )}

        {/* Category/Tag Filters */}
        {(categories.length > 0 || tags.length > 0) && (
          <div className="mb-4 space-y-2">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    !filterCategory ? "bg-fitness text-white" : "bg-muted text-muted-foreground"
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

        {/* Content */}
        <div className="mt-6">
          <AnimatePresence mode="popLayout">
            {filteredWorkouts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-fitness/20 to-fitness/10 flex items-center justify-center">
                  <Dumbbell className="w-10 h-10 text-fitness" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {hasFilters ? t('noHabitsToShow') : t('startFitness')}
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  {hasFilters ? t('clearFilters') : t('createFirstWorkout')}
                </p>
                {!hasFilters && (
                  <Button 
                    onClick={() => setDialogOpen(true)}
                    className="bg-fitness text-white hover:bg-fitness/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('createWorkout')}
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredWorkouts.map((workout, index) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    index={index}
                    isToday={todayWorkouts.some(w => w.id === workout.id)}
                    onToggleExercise={(exerciseId) => toggleExerciseCompletion(workout.id, exerciseId, today)}
                    onEdit={() => handleEditWorkout(workout)}
                    onDelete={() => handleDeleteWorkout(workout)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      {workouts.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-6"
        >
          <Button
            onClick={() => {
              setEditingWorkout(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full bg-fitness hover:bg-fitness/90 shadow-lg p-0"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <WorkoutDialog
        open={dialogOpen || !!openDialog}
        onClose={() => {
          setDialogOpen(false);
          setEditingWorkout(null);
          onDialogClose?.();
        }}
        onSave={handleSaveWorkout}
        workout={editingWorkout}
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
        colors={WORKOUT_COLORS}
        accentColor="hsl(262, 80%, 55%)"
        title={t('fitnessSettings')}
      />

      <AlertDialog open={!!deleteConfirmWorkout} onOpenChange={() => setDeleteConfirmWorkout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteWorkout')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWorkoutDescription')}
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
