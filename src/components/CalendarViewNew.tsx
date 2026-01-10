import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, addDays, eachDayOfInterval, isSameDay, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, isBefore, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '@/types/habit';
import { PeriodSelector, Period } from './PeriodSelector';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface CalendarViewNewProps {
  habits: Habit[];
  onToggle: (habitId: string, date: string) => void;
  initialPeriod?: Period;
}

export function CalendarViewNew({ 
  habits, 
  onToggle, 
  initialPeriod = '7'
}: CalendarViewNewProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date());
  const { t, language } = useTranslation();
  const { profile } = useAuth();

  const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;
  
  // Get first day of week from user profile (default to Monday = 1)
  const firstDayOfWeek = ((profile as any)?.first_day_of_week ?? 1) as 0 | 1;

  // Get user registration date (minimum date)
  const registrationDate = useMemo(() => {
    if (profile?.created_at) {
      return parseISO(profile.created_at);
    }
    return subDays(new Date(), 365); // Default to 1 year ago if no registration date
  }, [profile?.created_at]);

  // Get weekday headers based on first day of week
  const weekDays = useMemo(() => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysEs = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const localeDays = language === 'ru' ? days : language === 'es' ? daysEs : daysEn;
    
    if (firstDayOfWeek === 1) {
      // Monday first
      return [...localeDays.slice(1), localeDays[0]];
    }
    return localeDays;
  }, [firstDayOfWeek, language]);

  // Calculate days to display based on period and view start date
  const { days, canGoBack, canGoForward } = useMemo(() => {
    const today = new Date();
    const periodDays = period === '30' ? 35 : parseInt(period); // Month shows ~5 weeks
    
    // Calculate the start of the viewing period
    let start = viewStartDate;
    
    // Align to week start for proper grid display
    const weekStart = startOfWeek(start, { weekStartsOn: firstDayOfWeek });
    
    let end: Date;
    if (period === '30') {
      // For month view, show the entire month
      const monthStart = startOfMonth(start);
      const monthEnd = endOfMonth(start);
      const alignedStart = startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek });
      const alignedEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek }), 6);
      
      start = alignedStart;
      end = alignedEnd;
    } else {
      // For 7/14 days, calculate from view start
      start = weekStart;
      end = addDays(weekStart, periodDays - 1);
    }

    // Don't allow going before registration date
    const canGoBackValue = !isBefore(subDays(start, 1), registrationDate);
    
    // Don't allow going too far into the future (optional: limit to 1 year ahead)
    const maxFutureDate = addDays(today, 365);
    const canGoForwardValue = isBefore(end, maxFutureDate);

    const interval = eachDayOfInterval({ start, end });
    
    return {
      days: interval,
      canGoBack: canGoBackValue,
      canGoForward: canGoForwardValue,
    };
  }, [period, viewStartDate, registrationDate, firstDayOfWeek]);

  // Navigate back/forward
  const handleNavigate = (direction: 'back' | 'forward') => {
    if (direction === 'back') {
      if (period === '7') {
        setViewStartDate(subWeeks(viewStartDate, 1));
      } else if (period === '14') {
        setViewStartDate(subWeeks(viewStartDate, 2));
      } else {
        setViewStartDate(subMonths(viewStartDate, 1));
      }
    } else {
      if (period === '7') {
        setViewStartDate(addWeeks(viewStartDate, 1));
      } else if (period === '14') {
        setViewStartDate(addWeeks(viewStartDate, 2));
      } else {
        setViewStartDate(addMonths(viewStartDate, 1));
      }
    }
  };

  // Reset to today
  const handleResetToToday = () => {
    setViewStartDate(new Date());
  };

  const getCompletionForDay = (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completedDates.includes(dateStr);
  };

  const handleToggle = (habitId: string, date: Date) => {
    // Don't allow toggling dates before registration
    if (isBefore(date, registrationDate)) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    onToggle(habitId, dateStr);
  };

  // Check if date is before registration
  const isBeforeRegistration = (date: Date) => isBefore(date, registrationDate);

  // Split days into weeks (rows of 7)
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Get period label for navigation
  const periodLabel = useMemo(() => {
    if (period === '30') {
      return format(viewStartDate, 'LLLL yyyy', { locale });
    }
    const start = days[0];
    const end = days[days.length - 1];
    if (start && end) {
      return `${format(start, 'd MMM', { locale })} - ${format(end, 'd MMM', { locale })}`;
    }
    return '';
  }, [period, viewStartDate, days, locale]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('back')}
          disabled={!canGoBack}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center justify-center gap-3">
          <button 
            onClick={handleResetToToday}
            className="text-sm font-medium text-center hover:text-primary transition-colors"
          >
            {periodLabel}
          </button>
          <PeriodSelector value={period} onValueChange={(p) => {
            setPeriod(p);
            setViewStartDate(new Date()); // Reset to today on period change
          }} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('forward')}
          disabled={!canGoForward}
          className="shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[350px]">
          {/* Habit headers on top */}
          {habits.map((habit) => (
            <div key={habit.id} className="mb-4">
              {/* Habit name header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-lg">{habit.icon}</span>
                <span className="text-sm font-medium text-foreground truncate">
                  {habit.name}
                </span>
              </div>

              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day, index) => (
                  <div 
                    key={index}
                    className="text-center text-[10px] font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid for this habit */}
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
                  {week.map((day) => {
                    const isCompleted = getCompletionForDay(habit, day);
                    const isToday = isSameDay(day, new Date());
                    const isDisabled = isBeforeRegistration(day);
                    const isFuture = isBefore(new Date(), day) && !isSameDay(new Date(), day);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => !isDisabled && handleToggle(habit.id, day)}
                        disabled={isDisabled}
                        className={cn(
                          "aspect-square rounded-md flex flex-col items-center justify-center transition-all text-xs",
                          "hover:scale-105 active:scale-95",
                          isDisabled && "opacity-30 cursor-not-allowed",
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isToday
                            ? "bg-primary/20 border-2 border-primary"
                            : isFuture
                            ? "bg-muted/50 text-muted-foreground"
                            : "bg-muted hover:bg-muted-foreground/20"
                        )}
                      >
                        <span className="font-medium">{format(day, 'd')}</span>
                        {isCompleted && <span className="text-[8px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {habits.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('noHabitsToShow')}
        </div>
      )}
    </motion.div>
  );
}
