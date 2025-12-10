import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { Habit } from '@/types/habit';
import { HabitCard } from '@/components/HabitCard';
import { HabitDialog } from '@/components/HabitDialog';
import { StatsHeader } from '@/components/StatsHeader';
import { Button } from '@/components/ui/button';
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

const Index = () => {
  const { habits, isLoading, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useHabits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfirmHabit, setDeleteConfirmHabit] = useState<Habit | null>(null);

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
    } else {
      addHabit(habitData);
    }
    setEditingHabit(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <StatsHeader habits={habits} />

        {/* Habits section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Мои привычки</h2>
            <span className="text-sm text-muted-foreground">{habits.length}</span>
          </div>

          <AnimatePresence mode="popLayout">
            {habits.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Начните формировать привычки
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  Создайте свою первую привычку и начните путь к лучшей версии себя
                </p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать привычку
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit, index) => (
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
        </div>
      </div>

      {/* FAB */}
      {habits.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-6 right-6"
        >
          <Button
            onClick={() => {
              setEditingHabit(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full gradient-primary shadow-glow p-0"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <HabitDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        habit={editingHabit}
      />

      <AlertDialog open={!!deleteConfirmHabit} onOpenChange={() => setDeleteConfirmHabit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить привычку?</AlertDialogTitle>
            <AlertDialogDescription>
              Привычка "{deleteConfirmHabit?.name}" будет удалена вместе со всей историей. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
