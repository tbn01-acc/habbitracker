import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore, startOfDay, parseISO } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '@/types/habit';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface HabitMonthCalendarProps {
  habits: Habit[];
  onToggle: (habitId: string, date: string) => void;
}

export function HabitMonthCalendar({ habits, onToggle }: HabitMonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { t, language } = useTranslation();
  const { profile } = useAuth();

  const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;
  const isRussian = language === 'ru';
  
  // Get first day of week from user profile (default to Monday = 1)
  const firstDayOfWeek = ((profile as any)?.first_day_of_week ?? 1) as 0 | 1;

  // Get user registration date (minimum date)
  const registrationDate = useMemo(() => {
    if (profile?.created_at) {
      return startOfDay(parseISO(profile.created_at));
    }
    return startOfDay(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
  }, [profile?.created_at]);

  // Get weekday headers based on first day of week
  const weekDays = useMemo(() => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysEs = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const localeDays = language === 'ru' ? days : language === 'es' ? daysEs : daysEn;
    
    if (firstDayOfWeek === 1) {
      return [...localeDays.slice(1), localeDays[0]];
    }
    return localeDays;
  }, [firstDayOfWeek, language]);

  // Get period range
  const periodRange = useMemo(() => {
    return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
  }, [currentDate]);

  // Get days in current month
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: periodRange.start, end: periodRange.end });
  }, [periodRange]);

  // Check if can navigate to previous period
  const canNavigatePrev = useMemo(() => {
    const prevStart = startOfMonth(subMonths(currentDate, 1));
    return !isBefore(prevStart, registrationDate);
  }, [currentDate, registrationDate]);

  // Navigate periods
  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && !canNavigatePrev) return;
    const fn = direction === 'next' ? addMonths : subMonths;
    setCurrentDate(fn(currentDate, 1));
  };

  // Get start day offset for grid
  const startDayOfWeek = useMemo(() => {
    const dayOfWeek = periodRange.start.getDay();
    if (firstDayOfWeek === 1) {
      return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    }
    return dayOfWeek;
  }, [periodRange.start, firstDayOfWeek]);

  // Get habit completions for a day
  const getHabitCompletionsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let completed = 0;
    let total = 0;
    
    habits.forEach(habit => {
      // Check if habit was active on this day
      if (habit.targetDays.includes(date.getDay())) {
        total++;
        if (habit.completedDates.includes(dateStr)) {
          completed++;
        }
      }
    });
    
    return { completed, total };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigatePeriod('prev')}
          disabled={!canNavigatePrev}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <button 
          onClick={() => setCurrentDate(new Date())}
          className="text-sm font-medium text-center hover:text-primary transition-colors capitalize"
        >
          {format(currentDate, 'LLLL yyyy', { locale })}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigatePeriod('next')}
          className="shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
        
        {/* Empty cells for offset */}
        {[...Array(startDayOfWeek)].map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Day cells */}
        {daysInMonth.map((date) => {
          const { completed, total } = getHabitCompletionsForDay(date);
          const isToday = isSameDay(date, new Date());
          const hasData = completed > 0;
          const isBeforeRegistration = isBefore(date, registrationDate);
          const isFuture = isBefore(new Date(), date) && !isToday;
          
          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                isToday && "ring-2 ring-habit",
                hasData 
                  ? "bg-habit/20 text-habit font-bold" 
                  : isFuture 
                  ? "bg-muted/20 text-muted-foreground/50"
                  : "bg-muted/30 text-muted-foreground",
                isBeforeRegistration && "opacity-30"
              )}
            >
              <span className={hasData ? "font-bold" : ""}>{format(date, 'd')}</span>
              {total > 0 && (
                <span className="text-[7px] mt-0.5">
                  {completed}/{total}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Habit list with completions */}
      <div className="space-y-2 mt-4">
        {habits.map((habit) => (
          <div key={habit.id} className="p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{habit.icon}</span>
              <span className="text-xs font-medium text-foreground truncate flex-1">
                {habit.name}
              </span>
            </div>

            {/* Mini calendar for this habit */}
            <div className="grid grid-cols-7 gap-[2px]">
              {daysInMonth.slice(0, 7).map((_, i) => (
                <div 
                  key={i}
                  className="text-center text-[7px] font-medium text-muted-foreground uppercase"
                >
                  {weekDays[i].slice(0, 2)}
                </div>
              ))}
              {[...Array(startDayOfWeek)].map((_, i) => (
                <div key={`empty-${habit.id}-${i}`} className="w-[16px] h-[16px]" />
              ))}
              {daysInMonth.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isCompleted = habit.completedDates.includes(dateStr);
                const isToday = isSameDay(date, new Date());
                const isDisabled = isBefore(date, registrationDate);
                const isFuture = isBefore(new Date(), date) && !isToday;
                const isTargetDay = habit.targetDays.includes(date.getDay());
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !isDisabled && isTargetDay && onToggle(habit.id, dateStr)}
                    disabled={isDisabled || !isTargetDay}
                    className={cn(
                      "w-[16px] h-[16px] rounded-full transition-all mx-auto border flex items-center justify-center text-[6px] font-medium",
                      "hover:scale-110 active:scale-95",
                      (isDisabled || !isTargetDay) && "opacity-30 cursor-not-allowed",
                      isCompleted
                        ? "bg-habit border-habit text-white shadow-sm"
                        : isToday && isTargetDay
                        ? "bg-habit/20 border-habit text-habit"
                        : isFuture || !isTargetDay
                        ? "bg-transparent border-muted/40 text-muted-foreground/50"
                        : "bg-muted/30 border-muted/60 text-muted-foreground hover:border-muted"
                    )}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('noHabitsToShow')}
        </div>
      )}
    </motion.div>
  );
}
