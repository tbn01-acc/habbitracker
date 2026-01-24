import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore, startOfDay, parseISO } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Task, TaskCategory } from '@/types/task';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface TaskMonthCalendarProps {
  tasks: Task[];
  categories: TaskCategory[];
  onToggleTask: (taskId: string) => void;
}

export function TaskMonthCalendar({ tasks, categories, onToggleTask }: TaskMonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
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

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(task => task.dueDate === dateStr);
  };

  // Get day stats
  const getDayStats = (date: Date) => {
    const dayTasks = getTasksForDay(date);
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    return { completed, total, tasks: dayTasks };
  };

  // Get selected day tasks
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return getTasksForDay(selectedDay);
  }, [selectedDay, tasks]);

  // Get category by id
  const getCategory = (categoryId?: string) => {
    return categories.find(c => c.id === categoryId);
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
          const { completed, total } = getDayStats(date);
          const isToday = isSameDay(date, new Date());
          const hasData = total > 0;
          const isBeforeRegistration = isBefore(date, registrationDate);
          const isFuture = isBefore(new Date(), date) && !isToday;
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          
          return (
            <motion.button
              key={date.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedDay(date)}
              disabled={isBeforeRegistration}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                isToday && "ring-2 ring-task",
                isSelected && "ring-2 ring-task bg-task/30",
                hasData 
                  ? completed === total 
                    ? "bg-task/30 text-task font-bold"
                    : "bg-task/20 text-task font-bold" 
                  : isFuture 
                  ? "bg-muted/20 text-muted-foreground/50"
                  : "bg-muted/30 text-muted-foreground",
                isBeforeRegistration && "opacity-30 cursor-not-allowed"
              )}
            >
              <span className={hasData ? "font-bold" : ""}>{format(date, 'd')}</span>
              {total > 0 && (
                <span className="text-[7px] mt-0.5">
                  {completed}/{total}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2"
        >
          <h3 className="text-sm font-medium text-foreground">
            {format(selectedDay, 'd MMMM yyyy', { locale })}
          </h3>
          
          {selectedDayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRussian ? 'Нет задач на этот день' : 'No tasks for this day'}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map((task) => {
                const category = getCategory(task.categoryId);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg border border-border",
                      task.completed ? "bg-muted/50 opacity-70" : "bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          task.completed
                            ? "bg-task border-task"
                            : "border-muted-foreground/50 hover:border-task"
                        )}
                      >
                        {task.completed && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.icon} {task.name}
                        </p>
                        {category && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {tasks.length === 0 && !selectedDay && (
        <div className="text-center py-8 text-muted-foreground">
          {t('startTasks')}
        </div>
      )}
    </motion.div>
  );
}
