export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays: number[];
  completedDates: string[];
  createdAt: string;
  streak: number;
}

export interface HabitCompletion {
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
