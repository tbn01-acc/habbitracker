import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Workout, Exercise, ExerciseSet, WORKOUT_ICONS, WORKOUT_COLORS, FitnessCategory, FitnessTag, ExerciseCategory } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (workout: Omit<Workout, 'id' | 'createdAt'>) => void;
  workout?: Workout | null;
  categories: FitnessCategory[];
  tags: FitnessTag[];
  exerciseCategories?: ExerciseCategory[];
}

const WEEKDAYS = [
  { id: 0, short: 'Вс' },
  { id: 1, short: 'Пн' },
  { id: 2, short: 'Вт' },
  { id: 3, short: 'Ср' },
  { id: 4, short: 'Чт' },
  { id: 5, short: 'Пт' },
  { id: 6, short: 'Сб' },
];

interface ExerciseInput {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  duration?: number;
  categoryId?: string;
}

type SchedulingMode = 'weekdays' | 'dates';

export function WorkoutDialog({ open, onClose, onSave, workout, categories, tags, exerciseCategories = [] }: WorkoutDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(WORKOUT_ICONS[0]);
  const [color, setColor] = useState(WORKOUT_COLORS[0]);
  const [scheduledDays, setScheduledDays] = useState<number[]>([1, 3, 5]);
  const [scheduledDates, setScheduledDates] = useState<Date[]>([]);
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>('weekdays');
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [tagIds, setTagIds] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (workout) {
      setName(workout.name);
      setIcon(workout.icon);
      setColor(workout.color);
      setScheduledDays(workout.scheduledDays);
      setScheduledDates(workout.scheduledDates?.map(d => new Date(d)) || []);
      setSchedulingMode(workout.scheduledDates && workout.scheduledDates.length > 0 ? 'dates' : 'weekdays');
      setExercises(workout.exercises.map(e => ({ 
        id: e.id, 
        name: e.name, 
        targetSets: e.targetSets || 3, 
        targetReps: e.targetReps || 10, 
        duration: e.duration,
        categoryId: e.categoryId,
      })));
      setCategoryId(workout.categoryId);
      setTagIds(workout.tagIds || []);
    } else {
      setName('');
      setIcon(WORKOUT_ICONS[0]);
      setColor(WORKOUT_COLORS[0]);
      setScheduledDays([1, 3, 5]);
      setScheduledDates([]);
      setSchedulingMode('weekdays');
      setExercises([]);
      setCategoryId(undefined);
      setTagIds([]);
    }
    setNewExerciseName('');
  }, [workout, open]);

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    
    // Validate scheduling
    if (schedulingMode === 'weekdays' && scheduledDays.length === 0) return;
    if (schedulingMode === 'dates' && scheduledDates.length === 0) return;
    
    const exercisesWithDefaults: Exercise[] = exercises.map(e => ({
      id: e.id,
      name: e.name,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      duration: e.duration,
      categoryId: e.categoryId,
      sets: [],
      status: 'not_started' as const,
    }));
    
    onSave({ 
      name: name.trim(), 
      icon, 
      color, 
      scheduledDays: schedulingMode === 'weekdays' ? scheduledDays : [],
      scheduledDates: schedulingMode === 'dates' ? scheduledDates.map(d => format(d, 'yyyy-MM-dd')) : [],
      exercises: exercisesWithDefaults,
      categoryId,
      tagIds,
    });
    onClose();
  };

  const toggleDay = (day: number) => {
    if (scheduledDays.includes(day)) {
      setScheduledDays(scheduledDays.filter(d => d !== day));
    } else {
      setScheduledDays([...scheduledDays, day].sort());
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const exists = scheduledDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    if (exists) {
      setScheduledDates(scheduledDates.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
    } else {
      setScheduledDates([...scheduledDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    setScheduledDates(scheduledDates.filter(d => d.getTime() !== dateToRemove.getTime()));
  };

  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    setExercises([
      ...exercises,
      { id: crypto.randomUUID(), name: newExerciseName.trim(), targetSets: 3, targetReps: 10 }
    ]);
    setNewExerciseName('');
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, updates: Partial<ExerciseInput>) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const toggleTag = (tagId: string) => {
    if (tagIds.includes(tagId)) {
      setTagIds(tagIds.filter(id => id !== tagId));
    } else {
      setTagIds([...tagIds, tagId]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-24 max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {workout ? t('edit') : t('createWorkout')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Название тренировки
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Кардио"
                className="bg-background border-border"
              />
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('category')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryId(undefined)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      !categoryId
                        ? "bg-fitness text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t('uncategorized')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                        categoryId === cat.id
                          ? "text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      style={categoryId === cat.id ? { backgroundColor: cat.color } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('tagsLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                        tagIds.includes(tag.id)
                          ? "text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      style={tagIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduling Mode Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('schedulingMode')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSchedulingMode('weekdays')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                    schedulingMode === 'weekdays'
                      ? "bg-fitness text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('byWeekdays')}
                </button>
                <button
                  onClick={() => setSchedulingMode('dates')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                    schedulingMode === 'dates'
                      ? "bg-fitness text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('bySpecificDates')}
                </button>
              </div>
            </div>

            {/* Scheduled Days (weekday mode) */}
            {schedulingMode === 'weekdays' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('scheduledDays')}
                </label>
                <div className="flex gap-1">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        "flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all",
                        scheduledDays.includes(day.id)
                          ? "bg-fitness text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Dates (specific dates mode) */}
            {schedulingMode === 'dates' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('scheduledDates')}
                </label>
                
                {/* Selected dates */}
                {scheduledDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {scheduledDates.map((date) => (
                      <span
                        key={date.toISOString()}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-fitness/20 text-fitness rounded-lg text-xs font-medium"
                      >
                        {format(date, 'dd.MM.yyyy')}
                        <button
                          onClick={() => removeDate(date)}
                          className="hover:text-fitness/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {t('addDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={ru}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      modifiers={{
                        selected: scheduledDates,
                      }}
                      modifiersStyles={{
                        selected: { backgroundColor: 'hsl(262, 80%, 55%)', color: 'white' }
                      }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {scheduledDates.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">{t('noScheduledDates')}</p>
                )}
              </div>
            )}

            {/* Icon Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('icon')}
              </label>
              <div className="grid grid-cols-8 gap-2">
                {WORKOUT_ICONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                      icon === i
                        ? "bg-fitness/20 ring-2 ring-fitness"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('color')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {WORKOUT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color === c && "ring-2 ring-offset-2 ring-offset-card ring-fitness"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Exercises */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('exercises')}
              </label>
              
              {exercises.length > 0 && (
                <div className="space-y-2 mb-3">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                      <span className="flex-1 text-sm truncate">{exercise.name}</span>
                      <Input
                        type="number"
                        value={exercise.targetSets || ''}
                        onChange={(e) => updateExercise(exercise.id, { targetSets: parseInt(e.target.value) || 3 })}
                        placeholder="×"
                        className="w-12 h-8 text-xs bg-background"
                      />
                      <Input
                        type="number"
                        value={exercise.targetReps || ''}
                        onChange={(e) => updateExercise(exercise.id, { targetReps: parseInt(e.target.value) || 10 })}
                        placeholder="повт"
                        className="w-14 h-8 text-xs bg-background"
                      />
                      <button
                        onClick={() => removeExercise(exercise.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Добавить упражнение"
                  className="bg-background border-border"
                  onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                />
                <Button
                  type="button"
                  onClick={addExercise}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={
                !name.trim() || 
                exercises.length === 0 || 
                (schedulingMode === 'weekdays' && scheduledDays.length === 0) ||
                (schedulingMode === 'dates' && scheduledDates.length === 0)
              }
              className="w-full bg-fitness hover:bg-fitness/90 text-white"
            >
              {t('save')}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
