export interface FitnessCategory {
  id: string;
  name: string;
  color: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  color: string;
}

export interface FitnessTag {
  id: string;
  name: string;
  color: string;
}

export type ExerciseStatus = 'not_started' | 'in_progress' | 'completed';

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight?: number; // kg or machine setting
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  categoryId?: string;
  sets: ExerciseSet[];
  targetSets: number;
  targetReps: number;
  duration?: number; // in minutes
  status: ExerciseStatus;
  completedAt?: string;
}

export interface Workout {
  id: string;
  name: string;
  icon: string;
  color: string;
  exercises: Exercise[];
  scheduledDays: number[]; // 0-6, Sunday to Saturday
  scheduledDates?: string[]; // Specific dates in YYYY-MM-DD format
  createdAt: string;
  categoryId?: string;
  tagIds: string[];
}

export interface WorkoutCompletion {
  workoutId: string;
  date: string;
  completedExercises: string[]; // exercise IDs
  exerciseSets: Record<string, ExerciseSet[]>; // exerciseId -> sets performed
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  workoutId: string;
  workoutName: string;
  date: string;
  sets: ExerciseSet[];
  status: ExerciseStatus;
  categoryId?: string;
}

export const WORKOUT_ICONS = [
  '🏋️', '🏃', '🚴', '🧘', '🏊', '⚽', '🎾', '🥊',
  '💪', '🤸', '🧗', '🏓', '⛳', '🎿', '🛹', '🏸'
];

export const WORKOUT_COLORS = [
  'hsl(262, 80%, 55%)', // purple (primary for fitness)
  'hsl(168, 80%, 40%)', // teal
  'hsl(35, 95%, 55%)',  // orange
  'hsl(200, 80%, 50%)', // blue
  'hsl(340, 80%, 55%)', // pink
  'hsl(145, 70%, 45%)', // green
  'hsl(45, 90%, 50%)',  // yellow
  'hsl(0, 70%, 55%)',   // red
];

export const DEFAULT_FITNESS_CATEGORIES: FitnessCategory[] = [
  { id: 'strength', name: 'Силовые', color: 'hsl(262, 80%, 55%)' },
  { id: 'cardio', name: 'Кардио', color: 'hsl(0, 70%, 55%)' },
  { id: 'flexibility', name: 'Гибкость', color: 'hsl(168, 80%, 40%)' },
  { id: 'sports', name: 'Спорт', color: 'hsl(35, 95%, 55%)' },
];

export const DEFAULT_EXERCISE_CATEGORIES: ExerciseCategory[] = [
  { id: 'chest', name: 'Грудь', color: 'hsl(262, 80%, 55%)' },
  { id: 'back', name: 'Спина', color: 'hsl(200, 80%, 50%)' },
  { id: 'legs', name: 'Ноги', color: 'hsl(145, 70%, 45%)' },
  { id: 'shoulders', name: 'Плечи', color: 'hsl(35, 95%, 55%)' },
  { id: 'arms', name: 'Руки', color: 'hsl(340, 80%, 55%)' },
  { id: 'core', name: 'Пресс', color: 'hsl(0, 70%, 55%)' },
];

export const DEFAULT_FITNESS_TAGS: FitnessTag[] = [
  { id: 'beginner', name: 'Начинающий', color: 'hsl(145, 70%, 45%)' },
  { id: 'intense', name: 'Интенсив', color: 'hsl(0, 70%, 55%)' },
  { id: 'recovery', name: 'Восстановление', color: 'hsl(200, 80%, 50%)' },
];
