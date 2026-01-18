import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitCategory, HabitTag, HabitCompletion, DEFAULT_HABIT_CATEGORIES, DEFAULT_HABIT_TAGS } from '@/types/habit';
import { triggerCompletionCelebration } from '@/utils/celebrations';
import { format, parseISO, isBefore, isAfter, startOfDay, subDays } from 'date-fns';
import { toast } from 'sonner';

const STORAGE_KEY = 'habitflow_habits';
const CATEGORIES_KEY = 'habitflow_habit_categories';
const TAGS_KEY = 'habitflow_habit_tags';

// Helper to get reps completed for a habit on a specific date
export function getCompletedReps(habit: Habit, date: string): number {
  if (!habit.completions) {
    // Legacy: if no completions array, check completedDates (1 rep if completed)
    return habit.completedDates.includes(date) ? (habit.targetRepsPerDay || 1) : 0;
  }
  const completion = habit.completions.find(c => c.date === date);
  return completion?.reps || 0;
}

// Helper to calculate completion percentage for a date
export function getCompletionPercent(habit: Habit, date: string): number {
  const targetReps = habit.targetRepsPerDay || 1;
  const completedReps = getCompletedReps(habit, date);
  return Math.min(100, (completedReps / targetReps) * 100);
}

// Helper to check if habit is fully completed for a date
export function isFullyCompleted(habit: Habit, date: string): boolean {
  const targetReps = habit.targetRepsPerDay || 1;
  return getCompletedReps(habit, date) >= targetReps;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [tags, setTags] = useState<HabitTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old habits without tagIds
        const migrated = parsed.map((h: any) => ({
          ...h,
          tagIds: h.tagIds || [],
        }));
        setHabits(migrated);
      } catch (e) {
        console.error('Failed to parse habits:', e);
      }
    }
    
    // Load categories
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        setCategories(DEFAULT_HABIT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_HABIT_CATEGORIES);
    }
    
    // Load tags
    const storedTags = localStorage.getItem(TAGS_KEY);
    if (storedTags) {
      try {
        setTags(JSON.parse(storedTags));
      } catch (e) {
        setTags(DEFAULT_HABIT_TAGS);
      }
    } else {
      setTags(DEFAULT_HABIT_TAGS);
    }
    
    setIsLoading(false);
  }, []);

  const saveHabits = useCallback((newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHabits));
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  const saveCategories = useCallback((newCategories: HabitCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  const saveTags = useCallback((newTags: HabitTag[]) => {
    setTags(newTags);
    localStorage.setItem(TAGS_KEY, JSON.stringify(newTags));
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      streak: 0,
      tagIds: habit.tagIds || [],
    };
    saveHabits([...habits, newHabit]);
    return newHabit;
  }, [habits, saveHabits]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const newHabits = habits.map(h => 
      h.id === id ? { ...h, ...updates } : h
    );
    saveHabits(newHabits);
  }, [habits, saveHabits]);

  const deleteHabit = useCallback((id: string) => {
    saveHabits(habits.filter(h => h.id !== id));
  }, [habits, saveHabits]);

  // Toggle/increment habit completion - returns habitId and wasCompleted for star awarding
  const toggleHabitCompletion = useCallback((id: string, date: string): { habitId: string; completed: boolean } | null => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return null;

    // Check date restrictions
    const today = startOfDay(new Date());
    const targetDate = startOfDay(parseISO(date));
    const twoDaysAgo = startOfDay(subDays(today, 2));

    // Cannot complete in the future
    if (isAfter(targetDate, today)) {
      toast.error('Нельзя отмечать привычки в будущем');
      return null;
    }

    // Cannot complete more than 2 days in the past
    if (isBefore(targetDate, twoDaysAgo)) {
      toast.error('Можно отмечать выполнение только за последние 2 дня');
      return null;
    }

    const isToday = format(targetDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const targetReps = habit.targetRepsPerDay || 1;
    
    // Get current completions array or migrate from legacy
    let completions = habit.completions ? [...habit.completions] : [];
    const existingIndex = completions.findIndex(c => c.date === date);
    const currentReps = existingIndex >= 0 ? completions[existingIndex].reps : 0;
    
    let newReps: number;
    let justFullyCompleted = false;
    
    if (currentReps >= targetReps) {
      // Reset to 0 if already fully completed (toggle off)
      newReps = 0;
    } else {
      // Increment by 1
      newReps = currentReps + 1;
      if (newReps === targetReps) {
        justFullyCompleted = true;
        triggerCompletionCelebration();
      }
    }
    
    // Update completions array
    if (existingIndex >= 0) {
      if (newReps === 0) {
        completions.splice(existingIndex, 1);
      } else {
        completions[existingIndex] = { date, reps: newReps };
      }
    } else if (newReps > 0) {
      completions.push({ date, reps: newReps });
    }
    
    // Also update legacy completedDates for backwards compatibility
    let newCompletedDates = habit.completedDates.filter(d => d !== date);
    if (newReps >= targetReps) {
      newCompletedDates.push(date);
    }
    
    // Show warning for past completions
    if (!isToday && newReps > currentReps) {
      toast.info('Отметка за прошлые дни не учитывается в бонусах и серии');
    }

    const streak = calculateStreak(newCompletedDates, habit.targetDays);
    updateHabit(id, { completedDates: newCompletedDates, completions, streak });
    
    // Return info about the toggle - only count as verified if fully completed today
    return { habitId: id, completed: justFullyCompleted && isToday };
  }, [habits, updateHabit]);

  // Category management
  const addCategory = useCallback((category: Omit<HabitCategory, 'id'>) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    saveCategories([...categories, newCategory]);
  }, [categories, saveCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<HabitCategory>) => {
    saveCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [categories, saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    saveCategories(categories.filter(c => c.id !== id));
  }, [categories, saveCategories]);

  // Tag management
  const addTag = useCallback((tag: Omit<HabitTag, 'id'>) => {
    const newTag = { ...tag, id: crypto.randomUUID() };
    saveTags([...tags, newTag]);
  }, [tags, saveTags]);

  const updateTag = useCallback((id: string, updates: Partial<HabitTag>) => {
    saveTags(tags.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [tags, saveTags]);

  const deleteTag = useCallback((id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  }, [tags, saveTags]);

  return {
    habits,
    categories,
    tags,
    isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    addCategory,
    updateCategory,
    deleteCategory,
    addTag,
    updateTag,
    deleteTag,
  };
}

function calculateStreak(completedDates: string[], targetDays: number[]): number {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...completedDates].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < 365; i++) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (targetDays.includes(dayOfWeek)) {
      if (sortedDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}