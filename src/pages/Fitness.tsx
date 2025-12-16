import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Dumbbell } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import { Workout } from '@/types/fitness';
import { WorkoutCard } from '@/components/WorkoutCard';
import { WorkoutDialog } from '@/components/WorkoutDialog';
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

interface FitnessProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Fitness({ openDialog, onDialogClose }: FitnessProps) {
  const { workouts, isLoading, addWorkout, updateWorkout, deleteWorkout, toggleExerciseCompletion, getTodayWorkouts } = useFitness();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deleteConfirmWorkout, setDeleteConfirmWorkout] = useState<Workout | null>(null);
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

  const todayWorkouts = getTodayWorkouts();
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
        />

        {/* Today's workouts info */}
        {todayWorkouts.length > 0 && (
          <div className="bg-fitness/10 rounded-2xl p-4 mb-6 border border-fitness/20">
            <p className="text-sm text-fitness font-medium mb-1">{t('today')}</p>
            <p className="text-foreground">{todayWorkouts.map(w => w.name).join(', ')}</p>
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          <AnimatePresence mode="popLayout">
            {workouts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-fitness/20 to-fitness/10 flex items-center justify-center">
                  <Dumbbell className="w-10 h-10 text-fitness" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {t('startFitness')}
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  {t('createFirstWorkout')}
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-fitness text-white hover:bg-fitness/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createWorkout')}
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {workouts.map((workout, index) => (
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
