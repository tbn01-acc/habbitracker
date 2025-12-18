import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Workout, WorkoutCompletion, FitnessCategory, ExerciseCategory, FitnessTag, ExerciseLog, ExerciseSet, ExerciseStatus,
  DEFAULT_FITNESS_CATEGORIES, DEFAULT_EXERCISE_CATEGORIES, DEFAULT_FITNESS_TAGS 
} from '@/types/fitness';
import { WorkoutTemplate } from '@/components/WorkoutTemplates';

const WORKOUTS_KEY = 'habitflow_workouts';
const COMPLETIONS_KEY = 'habitflow_workout_completions';
const CATEGORIES_KEY = 'habitflow_fitness_categories';
const EXERCISE_CATEGORIES_KEY = 'habitflow_exercise_categories';
const TAGS_KEY = 'habitflow_fitness_tags';
const EXERCISE_LOGS_KEY = 'habitflow_exercise_logs';
const TEMPLATES_KEY = 'habitflow_workout_templates';

export function useFitness() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [categories, setCategories] = useState<FitnessCategory[]>([]);
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([]);
  const [tags, setTags] = useState<FitnessTag[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedWorkouts = localStorage.getItem(WORKOUTS_KEY);
    const storedCompletions = localStorage.getItem(COMPLETIONS_KEY);
    
    if (storedWorkouts) {
      try {
        const parsed = JSON.parse(storedWorkouts);
        // Migrate old workouts
        const migrated = parsed.map((w: any) => ({
          ...w,
          tagIds: w.tagIds || [],
          exercises: (w.exercises || []).map((e: any) => ({
            ...e,
            sets: e.sets && Array.isArray(e.sets) ? e.sets : [],
            targetSets: e.targetSets || e.sets || 3,
            targetReps: e.targetReps || e.reps || 10,
            status: e.status || 'not_started',
          })),
        }));
        setWorkouts(migrated);
      } catch (e) {
        console.error('Failed to parse workouts:', e);
      }
    }
    
    if (storedCompletions) {
      try {
        const parsed = JSON.parse(storedCompletions);
        const migrated = parsed.map((c: any) => ({
          ...c,
          exerciseSets: c.exerciseSets || {},
        }));
        setCompletions(migrated);
      } catch (e) {
        console.error('Failed to parse completions:', e);
      }
    }
    
    // Load categories
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        setCategories(DEFAULT_FITNESS_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_FITNESS_CATEGORIES);
    }
    
    // Load exercise categories
    const storedExerciseCategories = localStorage.getItem(EXERCISE_CATEGORIES_KEY);
    if (storedExerciseCategories) {
      try {
        setExerciseCategories(JSON.parse(storedExerciseCategories));
      } catch (e) {
        setExerciseCategories(DEFAULT_EXERCISE_CATEGORIES);
      }
    } else {
      setExerciseCategories(DEFAULT_EXERCISE_CATEGORIES);
    }
    
    // Load tags
    const storedTags = localStorage.getItem(TAGS_KEY);
    if (storedTags) {
      try {
        setTags(JSON.parse(storedTags));
      } catch (e) {
        setTags(DEFAULT_FITNESS_TAGS);
      }
    } else {
      setTags(DEFAULT_FITNESS_TAGS);
    }

    // Load exercise logs
    const storedLogs = localStorage.getItem(EXERCISE_LOGS_KEY);
    if (storedLogs) {
      try {
        setExerciseLogs(JSON.parse(storedLogs));
      } catch (e) {
        setExerciseLogs([]);
      }
    }

    // Load templates
    const storedTemplates = localStorage.getItem(TEMPLATES_KEY);
    if (storedTemplates) {
      try {
        setTemplates(JSON.parse(storedTemplates));
      } catch (e) {
        setTemplates([]);
      }
    }
    
    setIsLoading(false);
  }, []);

  const saveWorkouts = useCallback((newWorkouts: Workout[]) => {
    setWorkouts(newWorkouts);
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(newWorkouts));
  }, []);

  const saveCompletions = useCallback((newCompletions: WorkoutCompletion[]) => {
    setCompletions(newCompletions);
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(newCompletions));
  }, []);

  const saveCategories = useCallback((newCategories: FitnessCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
  }, []);

  const saveExerciseCategories = useCallback((newCategories: ExerciseCategory[]) => {
    setExerciseCategories(newCategories);
    localStorage.setItem(EXERCISE_CATEGORIES_KEY, JSON.stringify(newCategories));
  }, []);

  const saveTags = useCallback((newTags: FitnessTag[]) => {
    setTags(newTags);
    localStorage.setItem(TAGS_KEY, JSON.stringify(newTags));
  }, []);

  const saveExerciseLogs = useCallback((newLogs: ExerciseLog[]) => {
    setExerciseLogs(newLogs);
    localStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(newLogs));
  }, []);

  const saveTemplates = useCallback((newTemplates: WorkoutTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates));
  }, []);

  const addWorkout = useCallback((workout: Omit<Workout, 'id' | 'createdAt'>) => {
    const newWorkout: Workout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      tagIds: workout.tagIds || [],
    };
    saveWorkouts([...workouts, newWorkout]);
    return newWorkout;
  }, [workouts, saveWorkouts]);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    const newWorkouts = workouts.map(w => 
      w.id === id ? { ...w, ...updates } : w
    );
    saveWorkouts(newWorkouts);
  }, [workouts, saveWorkouts]);

  const deleteWorkout = useCallback((id: string) => {
    saveWorkouts(workouts.filter(w => w.id !== id));
  }, [workouts, saveWorkouts]);

  const logExerciseSet = useCallback((
    workoutId: string, 
    exerciseId: string, 
    date: string,
    setData: ExerciseSet
  ) => {
    const workout = workouts.find(w => w.id === workoutId);
    const exercise = workout?.exercises.find(e => e.id === exerciseId);
    if (!workout || !exercise) return;

    // Update completion
    const existingCompletion = completions.find(
      c => c.workoutId === workoutId && c.date === date
    );

    if (existingCompletion) {
      const exerciseSets = existingCompletion.exerciseSets || {};
      const currentSets = exerciseSets[exerciseId] || [];
      const setIndex = currentSets.findIndex(s => s.setNumber === setData.setNumber);
      
      let newSets: ExerciseSet[];
      if (setIndex >= 0) {
        newSets = currentSets.map((s, i) => i === setIndex ? setData : s);
      } else {
        newSets = [...currentSets, setData].sort((a, b) => a.setNumber - b.setNumber);
      }

      const newCompletions = completions.map(c =>
        c.workoutId === workoutId && c.date === date
          ? { 
              ...c, 
              exerciseSets: { ...exerciseSets, [exerciseId]: newSets },
              completedExercises: setData.completed && newSets.length >= exercise.targetSets
                ? [...new Set([...c.completedExercises, exerciseId])]
                : c.completedExercises
            }
          : c
      );
      saveCompletions(newCompletions);
    } else {
      const newCompletion: WorkoutCompletion = {
        workoutId,
        date,
        completedExercises: [],
        exerciseSets: { [exerciseId]: [setData] },
      };
      saveCompletions([...completions, newCompletion]);
    }

    // Log the exercise
    const existingLog = exerciseLogs.find(
      l => l.exerciseId === exerciseId && l.workoutId === workoutId && l.date === date
    );

    if (existingLog) {
      const setIndex = existingLog.sets.findIndex(s => s.setNumber === setData.setNumber);
      let newSets: ExerciseSet[];
      if (setIndex >= 0) {
        newSets = existingLog.sets.map((s, i) => i === setIndex ? setData : s);
      } else {
        newSets = [...existingLog.sets, setData].sort((a, b) => a.setNumber - b.setNumber);
      }
      
      const allCompleted = newSets.length >= exercise.targetSets && newSets.every(s => s.completed);
      const someCompleted = newSets.some(s => s.completed);
      
      const newLogs = exerciseLogs.map(l =>
        l.id === existingLog.id
          ? { 
              ...l, 
              sets: newSets,
              status: (allCompleted ? 'completed' : someCompleted ? 'in_progress' : 'not_started') as ExerciseStatus
            }
          : l
      );
      saveExerciseLogs(newLogs);
    } else {
      const newLog: ExerciseLog = {
        id: crypto.randomUUID(),
        exerciseId,
        exerciseName: exercise.name,
        workoutId,
        workoutName: workout.name,
        date,
        sets: [setData],
        status: setData.completed ? 'in_progress' : 'not_started',
        categoryId: exercise.categoryId,
      };
      saveExerciseLogs([...exerciseLogs, newLog]);
    }
  }, [workouts, completions, exerciseLogs, saveCompletions, saveExerciseLogs]);

  const toggleExerciseCompletion = useCallback((workoutId: string, exerciseId: string, date: string) => {
    const existingCompletion = completions.find(
      c => c.workoutId === workoutId && c.date === date
    );

    if (existingCompletion) {
      const isCompleted = existingCompletion.completedExercises.includes(exerciseId);
      const newCompletedExercises = isCompleted
        ? existingCompletion.completedExercises.filter(id => id !== exerciseId)
        : [...existingCompletion.completedExercises, exerciseId];

      const newCompletions = completions.map(c =>
        c.workoutId === workoutId && c.date === date
          ? { ...c, completedExercises: newCompletedExercises }
          : c
      );
      saveCompletions(newCompletions);
    } else {
      const newCompletion: WorkoutCompletion = {
        workoutId,
        date,
        completedExercises: [exerciseId],
        exerciseSets: {},
      };
      saveCompletions([...completions, newCompletion]);
    }
  }, [completions, saveCompletions]);

  // Category management
  const addCategory = useCallback((category: Omit<FitnessCategory, 'id'>) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    saveCategories([...categories, newCategory]);
  }, [categories, saveCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<FitnessCategory>) => {
    saveCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [categories, saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    saveCategories(categories.filter(c => c.id !== id));
  }, [categories, saveCategories]);

  // Exercise Category management
  const addExerciseCategory = useCallback((category: Omit<ExerciseCategory, 'id'>) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    saveExerciseCategories([...exerciseCategories, newCategory]);
  }, [exerciseCategories, saveExerciseCategories]);

  const updateExerciseCategory = useCallback((id: string, updates: Partial<ExerciseCategory>) => {
    saveExerciseCategories(exerciseCategories.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [exerciseCategories, saveExerciseCategories]);

  const deleteExerciseCategory = useCallback((id: string) => {
    saveExerciseCategories(exerciseCategories.filter(c => c.id !== id));
  }, [exerciseCategories, saveExerciseCategories]);

  // Tag management
  const addTag = useCallback((tag: Omit<FitnessTag, 'id'>) => {
    const newTag = { ...tag, id: crypto.randomUUID() };
    saveTags([...tags, newTag]);
  }, [tags, saveTags]);

  const updateTag = useCallback((id: string, updates: Partial<FitnessTag>) => {
    saveTags(tags.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [tags, saveTags]);

  const deleteTag = useCallback((id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  }, [tags, saveTags]);

  const getTodayWorkouts = useCallback(() => {
    const today = new Date().getDay();
    const todayStr = new Date().toISOString().split('T')[0];
    return workouts.filter(w => {
      // Check if scheduled by weekday
      if (w.scheduledDays.includes(today)) return true;
      // Check if scheduled by specific date
      if (w.scheduledDates && w.scheduledDates.includes(todayStr)) return true;
      return false;
    });
  }, [workouts]);

  const getTodayExercises = useCallback(() => {
    const todayWorkouts = getTodayWorkouts();
    const today = new Date().toISOString().split('T')[0];
    
    return todayWorkouts.flatMap(workout => 
      workout.exercises.map(exercise => {
        const completion = completions.find(
          c => c.workoutId === workout.id && c.date === today
        );
        return {
          ...exercise,
          workoutId: workout.id,
          workoutName: workout.name,
          completed: completion?.completedExercises.includes(exercise.id) || false,
          performedSets: completion?.exerciseSets?.[exercise.id] || [],
        };
      })
    );
  }, [getTodayWorkouts, completions]);

  const isExerciseCompleted = useCallback((workoutId: string, exerciseId: string, date: string) => {
    const completion = completions.find(
      c => c.workoutId === workoutId && c.date === date
    );
    return completion?.completedExercises.includes(exerciseId) || false;
  }, [completions]);

  const getExerciseSets = useCallback((workoutId: string, exerciseId: string, date: string) => {
    const completion = completions.find(
      c => c.workoutId === workoutId && c.date === date
    );
    return completion?.exerciseSets?.[exerciseId] || [];
  }, [completions]);

  // Analytics
  const getAnalytics = useCallback((period: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const logsInPeriod = exerciseLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });

    // Group by date
    const byDate: Record<string, ExerciseLog[]> = {};
    logsInPeriod.forEach(log => {
      if (!byDate[log.date]) byDate[log.date] = [];
      byDate[log.date].push(log);
    });

    // Group by category
    const byCategory: Record<string, number> = {};
    logsInPeriod.forEach(log => {
      const catId = log.categoryId || 'uncategorized';
      byCategory[catId] = (byCategory[catId] || 0) + log.sets.filter(s => s.completed).length;
    });

    // Group by status
    const byStatus: Record<ExerciseStatus, number> = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
    };
    logsInPeriod.forEach(log => {
      byStatus[log.status]++;
    });

    // Daily stats
    const dailyStats: { date: string; exercises: number; sets: number; totalWeight: number }[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = byDate[dateStr] || [];
      const completedSets = dayLogs.flatMap(l => l.sets.filter(s => s.completed));
      dailyStats.push({
        date: dateStr,
        exercises: dayLogs.filter(l => l.status === 'completed').length,
        sets: completedSets.length,
        totalWeight: completedSets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0),
      });
    }

    return {
      totalExercises: logsInPeriod.length,
      completedExercises: logsInPeriod.filter(l => l.status === 'completed').length,
      totalSets: logsInPeriod.flatMap(l => l.sets).filter(s => s.completed).length,
      byDate,
      byCategory,
      byStatus,
      dailyStats,
    };
  }, [exerciseLogs]);

  // Template management
  const addTemplate = useCallback((template: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  }, [templates, saveTemplates]);

  const createWorkoutFromTemplate = useCallback((template: WorkoutTemplate) => {
    return addWorkout({
      ...template.workout,
      exercises: template.workout.exercises.map(e => ({
        ...e,
        id: crypto.randomUUID(),
        sets: [],
        status: 'not_started' as const,
      })),
    });
  }, [addWorkout]);

  return {
    workouts,
    completions,
    categories,
    exerciseCategories,
    tags,
    exerciseLogs,
    templates,
    isLoading,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    toggleExerciseCompletion,
    logExerciseSet,
    addCategory,
    updateCategory,
    deleteCategory,
    addExerciseCategory,
    updateExerciseCategory,
    deleteExerciseCategory,
    addTag,
    updateTag,
    deleteTag,
    addTemplate,
    deleteTemplate,
    createWorkoutFromTemplate,
    getTodayWorkouts,
    getTodayExercises,
    isExerciseCompleted,
    getExerciseSets,
    getAnalytics,
  };
}
