import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CalendarRange } from 'lucide-react';
import { Habit, HABIT_ICONS, HABIT_COLORS, HabitCategory, HabitTag, HabitPeriodType, HabitPeriod } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { TagSelector } from '@/components/TagSelector';
import { GoalSelector } from '@/components/goals/GoalSelector';
import { SphereSelector } from '@/components/spheres/SphereSelector';
import { useAuth } from '@/hooks/useAuth';
import { getPeriodDates, getPeriodLabel, PeriodType } from '@/utils/periodUtils';
import { format, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

interface HabitDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => void;
  habit?: Habit | null;
  categories: HabitCategory[];
  tags: HabitTag[];
}

const WEEKDAY_KEYS: TranslationKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const PERIOD_OPTIONS: { value: HabitPeriodType; labelRu: string; labelEn: string }[] = [
  { value: 'none', labelRu: 'Без периода', labelEn: 'No period' },
  { value: 'week', labelRu: 'Неделя', labelEn: 'Week' },
  { value: 'month', labelRu: 'Месяц', labelEn: 'Month' },
  { value: 'quarter', labelRu: 'Квартал', labelEn: 'Quarter' },
  { value: 'year', labelRu: 'Год', labelEn: 'Year' },
  { value: 'custom', labelRu: 'Свой период', labelEn: 'Custom' },
];

export function HabitDialog({ open, onClose, onSave, habit, categories, tags }: HabitDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetRepsPerDay, setTargetRepsPerDay] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [commonTagIds, setCommonTagIds] = useState<string[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [sphereId, setSphereId] = useState<number | null>(null);
  const [sphereLockedByGoal, setSphereLockedByGoal] = useState(false);
  const [periodType, setPeriodType] = useState<HabitPeriodType>('none');
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setTargetDays(habit.targetDays);
      setTargetRepsPerDay(habit.targetRepsPerDay || 1);
      setCategoryId(habit.categoryId);
      const localTagIdSet = new Set(tags.map(t => t.id));
      setTagIds((habit.tagIds || []).filter(id => localTagIdSet.has(id)));
      setCommonTagIds((habit.tagIds || []).filter(id => !localTagIdSet.has(id)));
      setGoalId(habit.goalId || null);
      setSphereId(habit.sphereId ?? null);
      setSphereLockedByGoal(!!habit.goalId);
      setPeriodType(habit.period?.type || 'none');
      if (habit.period?.startDate) setCustomStartDate(habit.period.startDate);
      if (habit.period?.endDate) setCustomEndDate(habit.period.endDate);
    } else {
      setName('');
      setIcon(HABIT_ICONS[0]);
      setColor(HABIT_COLORS[0]);
      setTargetDays([1, 2, 3, 4, 5]);
      setTargetRepsPerDay(1);
      setCategoryId(undefined);
      setTagIds([]);
      setCommonTagIds([]);
      setGoalId(null);
      setSphereId(null);
      setSphereLockedByGoal(false);
      setPeriodType('none');
      setCustomStartDate(format(new Date(), 'yyyy-MM-dd'));
      setCustomEndDate(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    }
  }, [habit, open, tags]);

  const handleSave = () => {
    if (!name.trim()) return;
    // Require sphere selection for authenticated users
    if (user && !sphereId) return;
    
    let period: HabitPeriod | undefined;
    if (periodType !== 'none') {
      if (periodType === 'custom') {
        period = { type: periodType, startDate: customStartDate, endDate: customEndDate };
      } else {
        const dates = getPeriodDates(periodType as PeriodType);
        period = { type: periodType, startDate: dates.startDate, endDate: dates.endDate };
      }
    }
    
    const allTagIds = [...tagIds, ...commonTagIds];
    onSave({
      name: name.trim(),
      icon,
      color,
      frequency: 'weekly',
      targetDays,
      targetRepsPerDay,
      categoryId,
      tagIds: allTagIds,
      period,
      goalId,
      sphereId,
    } as any);
    onClose();
  };

  const handleGoalChange = (newGoalId: string | null, goalSphereId?: number | null) => {
    setGoalId(newGoalId);
    if (newGoalId && goalSphereId !== undefined) {
      setSphereId(goalSphereId);
      setSphereLockedByGoal(true);
    } else {
      setSphereLockedByGoal(false);
    }
  };

  const toggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      setTargetDays(targetDays.filter(d => d !== day));
    } else {
      setTargetDays([...targetDays, day]);
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-20 z-50 max-h-[80vh] overflow-auto rounded-t-3xl bg-card shadow-lg"
          >
            <div className="sticky top-0 bg-card z-10 px-6 pt-4 pb-2 flex items-center justify-between border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {habit ? t('editHabit') : t('newHabit')}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('habitName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('habitNamePlaceholder')}
                  className="h-12 text-base"
                />
              </div>

              {/* Period Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" />
                  {isRussian ? 'Период действия' : 'Active Period'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPeriodType(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        periodType === opt.value
                          ? "bg-habit text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {isRussian ? opt.labelRu : opt.labelEn}
                    </button>
                  ))}
                </div>
                
                {/* Custom date inputs */}
                {periodType === 'custom' && (
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        {isRussian ? 'Начало' : 'Start'}
                      </Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        {isRussian ? 'Конец' : 'End'}
                      </Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
                
                {periodType !== 'none' && periodType !== 'custom' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRussian 
                      ? 'Привычка будет активна на каждый целевой день выбранного периода'
                      : 'Habit will be active on each target day of the selected period'}
                  </p>
                )}
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('category')}</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategoryId(undefined)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        !categoryId
                          ? "bg-habit text-white"
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

              {/* Local Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('tagsLabel')}</Label>
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

              {/* Common Tags */}
              {user && (
                <div className="space-y-2">
                  <Label>{t('commonTags')}</Label>
                  <TagSelector 
                    selectedTagIds={commonTagIds} 
                    onChange={setCommonTagIds} 
                  />
                </div>
              )}

              {/* Goal Selector */}
              {user && (
                <div className="space-y-2">
                  <GoalSelector
                    value={goalId}
                    onChange={handleGoalChange}
                    isRussian={isRussian}
                  />
                </div>
              )}

              {/* Sphere Selector - Required for authenticated users */}
              {user && (
                <div className="space-y-2">
                  <SphereSelector
                    value={sphereId}
                    onChange={setSphereId}
                    disabled={sphereLockedByGoal}
                    showWarning={!sphereId}
                    required
                  />
                  {sphereLockedByGoal && (
                    <p className="text-xs text-muted-foreground">
                      {isRussian ? 'Сфера унаследована от цели' : 'Sphere inherited from goal'}
                    </p>
                  )}
                </div>
              )}

              {/* Daily Repetitions */}
              <div className="space-y-2">
                <Label>{isRussian ? 'Повторений в день' : 'Repetitions per day'}</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetRepsPerDay(Math.max(1, targetRepsPerDay - 1))}
                    className="w-10 h-10 rounded-xl bg-secondary text-foreground font-semibold hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={targetRepsPerDay}
                    onChange={(e) => setTargetRepsPerDay(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center h-10 text-lg font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetRepsPerDay(Math.min(99, targetRepsPerDay + 1))}
                    className="w-10 h-10 rounded-xl bg-secondary text-foreground font-semibold hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {isRussian ? 'раз' : 'times'}
                  </span>
                </div>
                {targetRepsPerDay > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {isRussian 
                      ? 'Для 100% выполнения нужно выполнить все повторы за день'
                      : 'All repetitions must be completed for 100% completion'}
                  </p>
                )}
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label>{t('icon')}</Label>
                <div className="grid grid-cols-8 gap-2">
                  {HABIT_ICONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        icon === i
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-secondary hover:bg-muted'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>{t('color')}</Label>
                <div className="grid grid-cols-8 gap-2">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        color === c ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <Label>{t('targetDays')}</Label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`flex-1 h-12 rounded-xl font-medium transition-all ${
                        targetDays.includes(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t(WEEKDAY_KEYS[day])}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={!name.trim() || targetDays.length === 0 || (user && !sphereId)}
                className="w-full h-14 text-base font-semibold gradient-primary text-primary-foreground"
              >
                {habit ? t('save') : t('createHabit')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}