export interface HabitCategory {
  id: string;
  name: string;
  color: string;
}

export interface HabitTag {
  id: string;
  name: string;
  color: string;
}

export type HabitPeriodType = 'none' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface HabitPeriod {
  type: HabitPeriodType;
  startDate?: string;
  endDate?: string;
}

export interface HabitCompletion {
  date: string;
  reps: number; // Number of repetitions completed on this date
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays: number[];
  completedDates: string[];
  completions?: HabitCompletion[]; // Detailed completion tracking for multi-rep habits
  targetRepsPerDay?: number; // Number of repetitions required per day (default 1)
  createdAt: string;
  streak: number;
  categoryId?: string;
  tagIds: string[];
  goalId?: string;
  sphereId?: number;
  period?: HabitPeriod;
  archivedAt?: string;
  postponeCount?: number;
  postponedUntil?: string;
}

export interface HabitCompletionEvent {
  habitId: string;
  date: string;
  completed: boolean;
}

export const HABIT_ICONS = [
  '💪', '🏃', '📚', '💧', '🧘', '🎯', '✍️', '🍎', 
  '💤', '🎨', '🎵', '💻', '🌱', '🧹', '💊', '🚶'
];

export const HABIT_COLORS = [
  'hsl(168, 80%, 40%)', // teal (primary)
  'hsl(35, 95%, 55%)',  // orange (accent)
  'hsl(262, 80%, 55%)', // purple
  'hsl(340, 80%, 55%)', // pink
  'hsl(200, 80%, 50%)', // blue
  'hsl(145, 70%, 45%)', // green
  'hsl(45, 90%, 50%)',  // yellow
  'hsl(0, 70%, 55%)',   // red
];

export const WEEKDAYS = [
  { id: 0, short: 'Вс', full: 'Воскресенье' },
  { id: 1, short: 'Пн', full: 'Понедельник' },
  { id: 2, short: 'Вт', full: 'Вторник' },
  { id: 3, short: 'Ср', full: 'Среда' },
  { id: 4, short: 'Чт', full: 'Четверг' },
  { id: 5, short: 'Пт', full: 'Пятница' },
  { id: 6, short: 'Сб', full: 'Суббота' },
];

export const DEFAULT_HABIT_CATEGORIES: HabitCategory[] = [
  { id: 'health', name: 'Здоровье', color: 'hsl(145, 70%, 45%)' },
  { id: 'learning', name: 'Обучение', color: 'hsl(200, 80%, 50%)' },
  { id: 'productivity', name: 'Продуктивность', color: 'hsl(35, 95%, 55%)' },
  { id: 'mindfulness', name: 'Осознанность', color: 'hsl(262, 80%, 55%)' },
];

export const DEFAULT_HABIT_TAGS: HabitTag[] = [
  { id: 'morning', name: 'Утро', color: 'hsl(45, 90%, 50%)' },
  { id: 'evening', name: 'Вечер', color: 'hsl(262, 80%, 55%)' },
  { id: 'quick', name: 'Быстро', color: 'hsl(168, 80%, 40%)' },
];
