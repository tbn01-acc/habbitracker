import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, MoreVertical, Flame, Timer, CalendarClock, ChevronDown, ChevronUp, 
  Archive, Pencil, Trash2, Calendar, Play, Pause, Square
} from 'lucide-react';
import { Habit } from '@/types/habit';
import { ProgressRing } from './ProgressRing';
import { getTodayString, getWeekDates, getCompletedReps, isFullyCompleted, getCompletionPercent } from '@/hooks/useHabits';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { useGoals } from '@/hooks/useGoals';
import { useSpheres } from '@/hooks/useSpheres';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { useSubscription } from '@/hooks/useSubscription';
import { TranslationKey } from '@/i18n/translations';
import { triggerCompletionCelebration } from '@/utils/celebrations';
import { cn } from '@/lib/utils';
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
import { toast } from 'sonner';

interface HabitCardProps {
  habit: Habit;
  habitIndex?: number;
  totalHabitsForWeek?: number;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPostpone?: (habitId: string, days: number) => void;
  onArchive?: (habitId: string) => void;
  index: number;
  onTagClick?: (tagId: string) => void;
  totalTime?: number;
  activeTimer?: { habitId: string } | null;
  elapsedTime?: number;
  onStartTimer?: (habitId: string) => void;
  onStopTimer?: () => void;
}

const WEEKDAY_KEYS: TranslationKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function HabitCard({ 
  habit, 
  habitIndex = 1,
  totalHabitsForWeek = 1,
  onToggle, 
  onEdit, 
  onDelete, 
  onPostpone, 
  onArchive, 
  index, 
  onTagClick,
  totalTime = 0,
  activeTimer,
  elapsedTime = 0,
  onStartTimer,
  onStopTimer
}: HabitCardProps) {
  const today = getTodayString();
  const weekDates = getWeekDates();
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';
  const { tags: userTags } = useUserTags();
  const { goals } = useGoals();
  const { spheres } = useSpheres();
  const { isProActive: isPro } = useSubscription();
  const { start: startPomodoro, isRunning, currentHabitId } = usePomodoro();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const nameRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  
  const isCurrentHabitRunning = isRunning && currentHabitId === habit.id;
  const isTimerActive = activeTimer?.habitId === habit.id;
  
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
  const habitGoal = goals.find(g => g.id === (habit as any).goalId);
  const habitSphere = spheres.find(s => s.id === (habit as any).sphereId);

  // Check if name needs marquee
  useEffect(() => {
    if (nameRef.current) {
      setNeedsMarquee(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  }, [habit.name]);

  const handleStartPomodoro = () => {
    if (isRunning) {
      toast.info(isRussian ? 'Таймер уже запущен' : 'Timer already running');
      return;
    }
    startPomodoro(undefined, undefined, habit.id);
    setTimerState('running');
  };

  const handleGoogleCalendar = () => {
    if (!isPro) {
      toast.error(isRussian ? 'Доступно только для PRO' : 'PRO feature only');
      return;
    }
    const startDate = today.replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(habit.name)}&dates=${startDate}/${startDate}`;
    window.open(url, '_blank');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-card rounded-2xl shadow-card relative overflow-hidden"
        style={{ 
          borderLeftColor: habit.color, 
          borderLeftWidth: 4,
          // Week progress as background fill
          background: `linear-gradient(to right, ${habit.color}15 ${progressPercent}%, transparent ${progressPercent}%)`
        }}
      >
        {/* Row 1: Checkbox, Icon, Name, Percent, Chevron */}
        <div 
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Checkbox - only show if single rep per day */}
          {targetReps === 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isCompletedToday) {
                  triggerCompletionCelebration();
                }
                onToggle(today);
              }}
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                isCompletedToday 
                  ? 'text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-secondary border-2 border-muted-foreground/30'
              )}
              style={isCompletedToday ? { background: habit.color } : undefined}
            >
              {isCompletedToday && <Check className="w-4 h-4" />}
            </motion.button>
          )}

          {/* Icon */}
          <span className="text-lg flex-shrink-0">{habit.icon}</span>

          {/* Name */}
          <div 
            ref={nameRef}
            className={cn(
              "flex-1 min-w-0 font-medium text-foreground overflow-hidden whitespace-nowrap",
              needsMarquee && !expanded && "animate-marquee"
            )}
          >
            {habit.name}
          </div>

          {/* Week progress percent */}
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progressPercent)}%
          </span>

          {/* Chevron */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Row 2: Week X of Y, Daily reps, Menu */}
              <div className="flex items-center gap-2 px-3 pb-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-muted-foreground">
                  {isRussian ? 'Неделя:' : 'Week:'} {habitIndex} {isRussian ? 'из' : 'of'} {totalHabitsForWeek}
                </span>

                {/* Daily reps circles (if > 1) */}
                {targetReps > 1 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">
                      {isRussian ? 'День:' : 'Day:'}
                    </span>
                    {Array.from({ length: targetReps }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i < todayReps) return; // Already completed
                          onToggle(today);
                        }}
                        className={cn(
                          "w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-all",
                          i < todayReps
                            ? "text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                        style={i < todayReps ? { backgroundColor: habit.color } : undefined}
                      >
                        {i < todayReps ? <Check className="w-3 h-3" /> : i + 1}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Streak */}
                {habit.streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                    <Flame className="w-3 h-3" />
                    {habit.streak}
                  </span>
                )}

                {/* Menu */}
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('edit')}
                      </DropdownMenuItem>
                      {isPro && (
                        <DropdownMenuItem onClick={handleGoogleCalendar}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Google Calendar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => {
                        // Export ICS
                        toast.success(isRussian ? 'Файл .ics скачан' : '.ics file downloaded');
                      }}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {isRussian ? 'Скачать .ics' : 'Download .ics'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Row 3-4: Sphere, Goal, Tags */}
              <div className="flex items-center gap-1.5 px-3 pb-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {habitSphere && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: habitSphere.color + '20', color: habitSphere.color }}
                  >
                    {habitSphere.icon} {isRussian ? habitSphere.name_ru : habitSphere.name_en}
                  </span>
                )}
                {habitGoal && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: habitGoal.color + '20', color: habitGoal.color }}
                  >
                    {habitGoal.icon} {habitGoal.name}
                  </span>
                )}
                {habitTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => onTagClick?.(tag.id)}
                    className="text-xs px-2 py-0.5 rounded-full transition-colors"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              {/* Row 5: Timer, Total Time, Postpone, Archive */}
              <div className="flex items-center gap-2 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                {/* Timer dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                      isTimerActive || isCurrentHabitRunning 
                        ? "bg-habit/20 text-habit" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}>
                      {isTimerActive || isCurrentHabitRunning ? (
                        <>
                          <Timer className="w-3.5 h-3.5 animate-pulse" />
                          {formatTime(elapsedTime)}
                        </>
                      ) : (
                        <Timer className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => {
                      if (onStartTimer) {
                        onStartTimer(habit.id);
                        setTimerState('running');
                      }
                    }}>
                      <Play className="w-4 h-4 mr-2" />
                      {isRussian ? 'Секундомер' : 'Stopwatch'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleStartPomodoro}>
                      <Timer className="w-4 h-4 mr-2" />
                      {isRussian ? 'Помодоро' : 'Pomodoro'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Total time */}
                <span className="text-xs text-muted-foreground">
                  {isRussian ? 'Всего:' : 'Total:'} {formatTime(totalTime)}
                </span>

                <div className="flex-1" />

                {/* Postpone */}
                {onPostpone && (
                  <button
                    onClick={() => setPostponeOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={isRussian ? 'Отложить' : 'Postpone'}
                  >
                    <CalendarClock className="w-4 h-4" />
                  </button>
                )}

                {/* Archive */}
                {onArchive && (
                  <button
                    onClick={() => onArchive(habit.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={isRussian ? 'В архив' : 'Archive'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom progress bar for daily reps (collapsed state, if reps > 1) */}
        {targetReps > 1 && !expanded && (
          <div className="h-1 bg-muted">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${todayPercent}%`,
                backgroundColor: habit.color 
              }}
            />
          </div>
        )}
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