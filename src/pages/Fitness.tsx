import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Dumbbell, Settings, BarChart3, List, History, Download, FileText, Timer } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import { Workout, WORKOUT_COLORS } from '@/types/fitness';
import { WorkoutCard } from '@/components/WorkoutCard';
import { WorkoutDialog } from '@/components/WorkoutDialog';
import { FitnessAnalytics } from '@/components/FitnessAnalytics';
import { WorkoutHistory } from '@/components/WorkoutHistory';
import { WorkoutTemplates } from '@/components/WorkoutTemplates';
import { WeightProgressChart } from '@/components/WeightProgressChart';
import { RestTimer } from '@/components/RestTimer';
import { ShareWorkoutDialog } from '@/components/ShareWorkoutDialog';
import { PageHeader } from '@/components/PageHeader';
import { GenericSettingsDialog } from '@/components/GenericSettingsDialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Period } from '@/components/PeriodSelector';
import { exportFitnessToCSV, exportWorkoutsToCSV } from '@/utils/fitnessExport';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FitnessProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

type FitnessView = 'workouts' | 'analytics';

export default function Fitness({ openDialog, onDialogClose }: FitnessProps) {
  const { 
    workouts, completions, categories, exerciseCategories, tags, exerciseLogs, templates, isLoading, 
    addWorkout, updateWorkout, deleteWorkout, toggleExerciseCompletion, getTodayWorkouts,
    addCategory, updateCategory, deleteCategory,
    addExerciseCategory, updateExerciseCategory, deleteExerciseCategory,
    addTag, updateTag, deleteTag,
    addTemplate, deleteTemplate, createWorkoutFromTemplate
  } = useFitness();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingWorkout, setSharingWorkout] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deleteConfirmWorkout, setDeleteConfirmWorkout] = useState<Workout | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<FitnessView>('workouts');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<Period>('7');
  const [showDetailedTracking, setShowDetailedTracking] = useState(true);
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

  const handleShareWorkout = (workout: Workout) => {
    setSharingWorkout(workout);
    setShareDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteConfirmWorkout) {
      deleteWorkout(deleteConfirmWorkout.id);
      setDeleteConfirmWorkout(null);
    }
  };

  const handleExportHistory = () => {
    exportFitnessToCSV(exerciseLogs, workouts, completions);
    toast.success(t('exportData'));
  };

  const handleExportWorkouts = () => {
    exportWorkoutsToCSV(workouts);
    toast.success(t('exportData'));
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
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTimer(!showTimer)}
                className={cn("w-9 h-9", showTimer && "bg-fitness/20")}
              >
                <Timer className="w-5 h-5 text-fitness" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTemplatesOpen(true)}
                className="w-9 h-9"
              >
                <FileText className="w-5 h-5 text-fitness" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistoryOpen(true)}
                className="w-9 h-9"
              >
                <History className="w-5 h-5 text-fitness" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9">
                    <Download className="w-5 h-5 text-fitness" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportHistory}>
                    {t('exportHistory')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWorkouts}>
                    {t('exportWorkouts')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9"
              >
                <Settings className="w-5 h-5 text-fitness" />
              </Button>
            </div>
          }
        />

        {/* Rest Timer (collapsible) */}
        <AnimatePresence>
          {showTimer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <RestTimer defaultDuration={90} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCurrentView('workouts')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              currentView === 'workouts'
                ? "bg-fitness text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <List className="w-4 h-4" />
            {t('workout')}
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              currentView === 'analytics'
                ? "bg-fitness text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            {t('progress')}
          </button>
        </div>

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="space-y-6">
            <FitnessAnalytics 
              period={analyticsPeriod} 
              onPeriodChange={setAnalyticsPeriod} 
            />
            <WeightProgressChart period={analyticsPeriod === '7' ? 7 : analyticsPeriod === '14' ? 14 : 30} />
          </div>
        )}

        {/* Workouts View */}
        {currentView === 'workouts' && (
          <>
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
                      <div className="flex flex-col gap-2 items-center">
                        <Button 
                          onClick={() => setDialogOpen(true)}
                          className="bg-fitness text-white hover:bg-fitness/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('createWorkout')}
                        </Button>
                        {templates.length > 0 && (
                          <Button 
                            variant="outline"
                            onClick={() => setTemplatesOpen(true)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {t('workoutTemplates')}
                          </Button>
                        )}
                      </div>
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
                        onShare={() => handleShareWorkout(workout)}
                        showDetailedTracking={showDetailedTracking}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      {currentView === 'workouts' && workouts.length > 0 && (
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
        exerciseCategories={exerciseCategories}
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
        exerciseCategories={exerciseCategories}
        onAddExerciseCategory={addExerciseCategory}
        onUpdateExerciseCategory={updateExerciseCategory}
        onDeleteExerciseCategory={deleteExerciseCategory}
      />

      <WorkoutHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <WorkoutTemplates
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        onSaveTemplate={addTemplate}
        onDeleteTemplate={deleteTemplate}
        onCreateFromTemplate={createWorkoutFromTemplate}
        workouts={workouts}
      />

      <ShareWorkoutDialog
        open={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setSharingWorkout(null);
        }}
        workout={sharingWorkout}
        exerciseLogs={exerciseLogs
          .filter(log => log.workoutId === sharingWorkout?.id)
          .map(log => ({
            date: log.date,
            sets: log.sets.filter(s => s.completed).length,
            totalWeight: log.sets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0)
          }))}
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
