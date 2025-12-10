import { useState, useEffect, useCallback } from 'react';
import { Habit } from '@/types/habit';

const STORAGE_KEY = 'habitflow_habits';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHabits(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse habits:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveHabits = useCallback((newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHabits));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      streak: 0,
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

  const toggleHabitCompletion = useCallback((id: string, date: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(date);
    let newCompletedDates: string[];
    
    if (isCompleted) {
      newCompletedDates = habit.completedDates.filter(d => d !== date);
    } else {
      newCompletedDates = [...habit.completedDates, date];
    }

    // Calculate streak
    const streak = calculateStreak(newCompletedDates, habit.targetDays);

    updateHabit(id, { completedDates: newCompletedDates, streak });
  }, [habits, updateHabit]);

  return {
    habits,
    isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
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
