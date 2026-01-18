import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MoreVertical, Flame, Timer, CalendarClock } from 'lucide-react';
import { Habit } from '@/types/habit';
import { ProgressRing } from './ProgressRing';
import { getTodayString, getWeekDates, getCompletedReps, isFullyCompleted, getCompletionPercent } from '@/hooks/useHabits';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { TranslationKey } from '@/i18n/translations';
import { triggerCompletionCelebration } from '@/utils/celebrations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { HabitDetailDialog } from './HabitDetailDialog';
import { PostponeDialog } from './PostponeDialog';
import { useNavigate } from 'react-router-dom';

interface HabitCardProps {
  habit: Habit;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPostpone?: (habitId: string, days: number) => void;
  onArchive?: (habitId: string) => void;
  index: number;
  onTagClick?: (tagId: string) => void;
}

const WEEKDAY_KEYS: TranslationKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function HabitCard({ habit, onToggle, onEdit, onDelete, onPostpone, onArchive, index, onTagClick }: HabitCardProps) {
  const today = getTodayString();
  const weekDates = getWeekDates();
  const { t } = useTranslation();
  const { tags: userTags } = useUserTags();
  const { start: startPomodoro, isRunning, currentHabitId } = usePomodoro();
  const navigate = useNavigate();
  const [detailOpen, setDetailOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  
  const isCurrentHabitRunning = isRunning && currentHabitId === habit.id;
  
  // Repetitions tracking
  const targetReps = habit.targetRepsPerDay || 1;
  const todayReps = getCompletedReps(habit, today);
  const isCompletedToday = isFullyCompleted(habit, today);
  const todayPercent = getCompletionPercent(habit, today);
  
  // Calculate week progress considering repetitions
  const weekProgress = weekDates.reduce((sum, date) => {
    const dayOfWeek = new Date(date).getDay();
    if (!habit.targetDays.includes(dayOfWeek)) return sum;
    return sum + getCompletionPercent(habit, date) / 100;
  }, 0);
  
  const weekTarget = weekDates.filter(date => {
    const dayOfWeek = new Date(date).getDay();
    return habit.targetDays.includes(dayOfWeek);
  }).length;
  
  const progressPercent = weekTarget > 0 ? (weekProgress / weekTarget) * 100 : 0;

  const habitTags = userTags.filter(tag => habit.tagIds?.includes(tag.id));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-card rounded-2xl p-4 shadow-card relative overflow-hidden cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        {/* Background glow when completed */}
        {isCompletedToday && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 opacity-10"
            style={{ background: habit.color }}
          />
        )}
        
        <div className="relative flex items-center gap-4">
          {/* Completion button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggle(today);
            }}
            className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isCompletedToday 
                ? 'text-primary-foreground' 
                : todayReps > 0
                  ? 'text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
            style={isCompletedToday 
              ? { background: habit.color } 
              : todayReps > 0 
                ? { background: `${habit.color}80` } // Semi-transparent for partial
                : undefined
            }
          >
            {isCompletedToday ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-7 h-7" />
              </motion.div>
            ) : todayReps > 0 ? (
              <span className="text-sm font-bold">{todayReps}/{targetReps}</span>
            ) : (
              <span className="text-2xl">{habit.icon}</span>
            )}
          </motion.button>

          {/* Habit info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{habit.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {habit.streak > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  <Flame className="w-3 h-3" />
                  {habit.streak}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {weekProgress}/{weekTarget} {t('thisWeek')}
              </span>
            </div>
            {/* Tags */}
            {habitTags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {habitTags.slice(0, 2).map(tag => (
                  <button
                    key={tag.id}
                    onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.id); }}
                    className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-muted-foreground">{tag.name}</span>
                  </button>
                ))}
                {habitTags.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{habitTags.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Pomodoro button */}
          <Button
            variant={isCurrentHabitRunning ? "default" : "outline"}
            size="icon"
            className="h-10 w-10"
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrentHabitRunning) {
                navigate('/services');
              } else {
                startPomodoro(undefined, undefined, habit.id);
                navigate('/services');
              }
            }}
          >
            <Timer className={`w-4 h-4 ${isCurrentHabitRunning ? 'animate-pulse' : ''}`} />
          </Button>

          {/* Progress ring */}
          <ProgressRing progress={progressPercent} size={48} strokeWidth={4} color={habit.color}>
            <span className="text-xs font-semibold text-foreground">
              {Math.round(progressPercent)}%
            </span>
          </ProgressRing>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                {t('edit')}
              </DropdownMenuItem>
              {onPostpone && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPostponeOpen(true); }}>
                  <CalendarClock className="w-4 h-4 mr-2" />
                  {t('postpone') || 'Перенести'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Week progress dots */}
        <div className="flex justify-between mt-4 px-1" onClick={(e) => e.stopPropagation()}>
          {weekDates.map((date) => {
            const dayOfWeek = new Date(date).getDay();
            const isTarget = habit.targetDays.includes(dayOfWeek);
            const dateReps = getCompletedReps(habit, date);
            const isFullComplete = isFullyCompleted(habit, date);
            const isPartial = dateReps > 0 && !isFullComplete;
            const isToday = date === today;
            
            return (
              <button
                key={date}
                onClick={() => onToggle(date)}
                disabled={!isTarget}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  isFullComplete
                    ? 'text-primary-foreground'
                    : isPartial
                      ? 'text-primary-foreground'
                      : isTarget
                        ? isToday
                          ? 'bg-secondary text-foreground ring-2 ring-primary/50'
                          : 'bg-secondary text-muted-foreground hover:bg-muted'
                        : 'text-muted-foreground/30'
                }`}
                style={isFullComplete 
                  ? { background: habit.color } 
                  : isPartial 
                    ? { background: `${habit.color}60` }
                    : undefined
                }
              >
                {t(WEEKDAY_KEYS[dayOfWeek])}
              </button>
            );
          })}
        </div>
      </motion.div>

      <HabitDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        habit={habit}
        onEdit={onEdit}
        onDelete={onDelete}
        onTagClick={onTagClick}
      />

      {onPostpone && onArchive && (
        <PostponeDialog
          open={postponeOpen}
          onOpenChange={setPostponeOpen}
          currentPostponeCount={habit.postponeCount || 0}
          onPostpone={(days) => onPostpone(habit.id, days)}
          onArchive={() => onArchive(habit.id)}
          onDelete={onDelete}
          itemName={habit.name}
          itemType="habit"
        />
      )}
    </>
  );
}
