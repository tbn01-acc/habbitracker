import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore, startOfDay, parseISO } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { FinanceTransaction, getCategoryById } from '@/types/finance';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface FinanceMonthCalendarProps {
  transactions: FinanceTransaction[];
  onToggle?: (id: string) => void;
}

export function FinanceMonthCalendar({ transactions, onToggle }: FinanceMonthCalendarProps) {
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

  // Get transactions for a specific day
  const getTransactionsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return transactions.filter(t => t.date === dateStr);
  };

  // Get day stats
  const getDayStats = (date: Date) => {
    const dayTransactions = getTransactionsForDay(date);
    const completedTransactions = dayTransactions.filter(t => t.completed);
    const income = completedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = completedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, hasData: income > 0 || expense > 0, transactions: dayTransactions };
  };

  // Get selected day transactions
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return getTransactionsForDay(selectedDay);
  }, [selectedDay, transactions]);

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
          const { income, expense, balance, hasData } = getDayStats(date);
          const isToday = isSameDay(date, new Date());
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
                isToday && "ring-2 ring-finance",
                isSelected && "ring-2 ring-finance bg-finance/30",
                hasData 
                  ? balance >= 0 
                    ? "bg-green-500/20 text-green-600 font-bold"
                    : "bg-red-500/20 text-red-600 font-bold" 
                  : isFuture 
                  ? "bg-muted/20 text-muted-foreground/50"
                  : "bg-muted/30 text-muted-foreground",
                isBeforeRegistration && "opacity-30 cursor-not-allowed"
              )}
            >
              <span className={hasData ? "font-bold" : ""}>{format(date, 'd')}</span>
              {hasData && (
                <span className="text-[6px] mt-0.5">
                  {balance >= 0 ? '+' : ''}{(balance / 1000).toFixed(0)}k
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected day transactions */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {format(selectedDay, 'd MMMM yyyy', { locale })}
            </h3>
            {selectedDayTransactions.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500">
                  +{selectedDayTransactions.filter(t => t.type === 'income' && t.completed).reduce((s, t) => s + t.amount, 0).toLocaleString()} ₽
                </span>
                <span className="text-red-500">
                  -{selectedDayTransactions.filter(t => t.type === 'expense' && t.completed).reduce((s, t) => s + t.amount, 0).toLocaleString()} ₽
                </span>
              </div>
            )}
          </div>
          
          {selectedDayTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRussian ? 'Нет операций на этот день' : 'No transactions for this day'}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayTransactions.map((transaction) => {
                const category = getCategoryById(transaction.category);
                const isIncome = transaction.type === 'income';
                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "p-3 rounded-lg border border-border",
                      transaction.completed ? "bg-muted/50 opacity-70" : "bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {onToggle && (
                        <Checkbox
                          checked={transaction.completed}
                          onCheckedChange={() => onToggle(transaction.id)}
                          className="border-finance data-[state=checked]:bg-finance"
                        />
                      )}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{category?.icon || '📦'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            transaction.completed && "line-through text-muted-foreground"
                          )}>
                            {transaction.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category?.name || transaction.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isIncome ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={cn(
                          "text-sm font-bold",
                          isIncome ? "text-green-500" : "text-red-500"
                        )}>
                          {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {transactions.length === 0 && !selectedDay && (
        <div className="text-center py-8 text-muted-foreground">
          {t('startFinance')}
        </div>
      )}
    </motion.div>
  );
}
