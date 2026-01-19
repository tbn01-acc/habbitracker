import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Archive, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  CheckCircle2, Target, DollarSign, Crown, Copy, Eye, Filter, X, RotateCcw, Layers
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, 
  addMonths, subMonths, addQuarters, subQuarters, 
  eachDayOfInterval, isSameDay, eachMonthOfInterval, isBefore, startOfDay
} from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'month' | 'quarter';
type ArchiveType = 'all' | 'habits' | 'tasks' | 'finance';
type StatusFilter = 'all' | 'completed' | 'incomplete';

interface DayStats {
  date: Date;
  habits: number;
  habitsTotal: number;
  tasks: number;
  tasksCompleted: number;
  income: number;
  expense: number;
  hasAnyData: boolean;
}

export default function ArchivePage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { currentPlan, loading: subLoading } = useSubscription();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { transactions } = useFinance();
  
  const isRussian = language === 'ru';
  const locale = isRussian ? ru : enUS;
  const isPro = currentPlan === 'pro';

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeTab, setActiveTab] = useState<ArchiveType>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Get user registration date
  const registrationDate = useMemo(() => {
    if (profile?.created_at) {
      return startOfDay(new Date(profile.created_at));
    }
    return startOfDay(new Date('2024-01-01')); // fallback
  }, [profile]);

  // Check if can navigate to previous period
  const canNavigatePrev = useMemo(() => {
    const prevStart = viewMode === 'month' 
      ? startOfMonth(subMonths(currentDate, 1))
      : startOfQuarter(subQuarters(currentDate, 1));
    return !isBefore(prevStart, registrationDate);
  }, [currentDate, viewMode, registrationDate]);

  // Get period range based on view mode
  const periodRange = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case 'quarter':
        return { start: startOfQuarter(currentDate), end: endOfQuarter(currentDate) };
    }
  }, [viewMode, currentDate]);

  // For quarter view, get months in the quarter
  const monthsInQuarter = useMemo(() => {
    if (viewMode !== 'quarter') return [];
    return eachMonthOfInterval({ start: periodRange.start, end: periodRange.end });
  }, [viewMode, periodRange]);

  // Get days in current period
  const daysInPeriod = useMemo(() => {
    return eachDayOfInterval({ start: periodRange.start, end: periodRange.end });
  }, [periodRange]);

  // Calculate stats for each day
  const dayStats = useMemo((): DayStats[] => {
    return daysInPeriod.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Habits completed on this day
      const habitsCount = habits.reduce((count, h) => {
        return count + (h.completedDates.includes(dateStr) ? 1 : 0);
      }, 0);
      const habitsTotal = habits.filter(h => h.targetDays.includes(date.getDay())).length;
      
      // Tasks for this day
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      const tasksCount = dayTasks.length;
      const tasksCompleted = dayTasks.filter(t => t.completed).length;
      
      // Finance for this day
      const dayTransactions = transactions.filter(t => t.date === dateStr && t.completed);
      const income = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      const hasAnyData = habitsCount > 0 || tasksCount > 0 || income > 0 || expense > 0;
      
      return { date, habits: habitsCount, habitsTotal, tasks: tasksCount, tasksCompleted, income, expense, hasAnyData };
    });
  }, [daysInPeriod, habits, tasks, transactions]);

  // Navigate periods with registration date limit
  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && !canNavigatePrev) return;
    
    const fn = direction === 'next' 
      ? (viewMode === 'month' ? addMonths : addQuarters)
      : (viewMode === 'month' ? subMonths : subQuarters);
    setCurrentDate(fn(currentDate, 1));
  };

  // Get items for selected day with filtering
  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return { habits: [], tasks: [], transactions: [] };
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    
    let filteredHabits = habits.filter(h => {
      const isCompleted = h.completedDates.includes(dateStr);
      const isTarget = h.targetDays.includes(selectedDay.getDay());
      if (!isTarget) return false;
      if (statusFilter === 'completed') return isCompleted;
      if (statusFilter === 'incomplete') return !isCompleted;
      return true;
    });
    
    let filteredTasks = tasks.filter(t => {
      if (t.dueDate !== dateStr) return false;
      if (statusFilter === 'completed') return t.completed;
      if (statusFilter === 'incomplete') return !t.completed;
      return true;
    });
    
    let filteredTransactions = transactions.filter(t => {
      if (t.date !== dateStr) return false;
      if (statusFilter === 'completed') return t.completed;
      if (statusFilter === 'incomplete') return !t.completed;
      return true;
    });
    
    return {
      habits: filteredHabits,
      tasks: filteredTasks,
      transactions: filteredTransactions,
    };
  }, [selectedDay, habits, tasks, transactions, statusFilter]);

  // Restore archived item
  const handleRestore = async (type: 'habit' | 'task', id: string) => {
    try {
      const table = type === 'habit' ? 'habits' : 'tasks';
      const { error } = await supabase
        .from(table)
        .update({ archived_at: null })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isRussian ? 'Восстановлено!' : 'Restored!');
      // Page will refresh on next visit
    } catch (err) {
      toast.error(isRussian ? 'Ошибка восстановления' : 'Restore failed');
    }
  };

  // Render day cell content based on active tab
  const getDayCellContent = (stat: DayStats) => {
    if (activeTab === 'all') {
      if (!stat.hasAnyData) return null;
      return (
        <div className="text-[7px] flex flex-col items-center gap-0.5">
          {stat.habits > 0 && <span className="text-green-500">H:{stat.habits}</span>}
          {stat.tasks > 0 && <span className="text-blue-500">T:{stat.tasks}</span>}
          {(stat.income > 0 || stat.expense > 0) && <span className="text-amber-500">$</span>}
        </div>
      );
    }
    
    if (activeTab === 'habits' && stat.habits > 0) {
      return <span className="text-[8px] mt-0.5">{stat.habits}</span>;
    }
    if (activeTab === 'tasks' && stat.tasks > 0) {
      return <span className="text-[8px] mt-0.5">{stat.tasks}</span>;
    }
    if (activeTab === 'finance' && (stat.income > 0 || stat.expense > 0)) {
      return <span className="text-[8px] mt-0.5">{stat.income > 0 ? '+' : ''}{stat.income - stat.expense}</span>;
    }
    return null;
  };

  const hasDataForDay = (stat: DayStats) => {
    if (activeTab === 'all') return stat.hasAnyData;
    if (activeTab === 'habits') return stat.habits > 0;
    if (activeTab === 'tasks') return stat.tasks > 0;
    return stat.income > 0 || stat.expense > 0;
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  // PRO gate
  if (!isPro) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Archive className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Архив' : 'Archive'}
              </h1>
            </div>
          </div>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {isRussian ? 'Архив — PRO функция' : 'Archive — PRO Feature'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRussian 
                    ? 'Просматривайте историю привычек, задач и финансов в удобном календарном виде!'
                    : 'View your habits, tasks, and finance history in a convenient calendar view!'}
                </p>
              </div>
              <Button onClick={() => navigate('/upgrade')} className="bg-gradient-to-r from-amber-500 to-yellow-500">
                <Crown className="w-4 h-4 mr-2" />
                {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render calendar for a specific month
  const renderMonthCalendar = (monthDate: Date, daysData: DayStats[]) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1; // Monday = 0

    return (
      <div key={monthDate.toISOString()} className="mb-4">
        {viewMode === 'quarter' && (
          <h3 className="text-sm font-medium mb-2 text-center">
            {format(monthDate, 'LLLL yyyy', { locale })}
          </h3>
        )}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {isRussian ? day : day}
            </div>
          ))}
          
          {/* Empty cells for offset */}
          {[...Array(startDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
          {monthDays.map((date) => {
            const stat = daysData.find(d => isSameDay(d.date, date));
            if (!stat) return null;
            
            const isToday = isSameDay(date, new Date());
            const hasData = hasDataForDay(stat);
            const isBeforeRegistration = isBefore(date, registrationDate);
            
            return (
              <motion.button
                key={date.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                disabled={isBeforeRegistration}
                onClick={() => setSelectedDay(date)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                  isToday && "ring-2 ring-primary",
                  hasData 
                    ? "bg-primary/20 text-primary font-bold" 
                    : "bg-muted/30 text-muted-foreground",
                  selectedDay && isSameDay(date, selectedDay) && "ring-2 ring-primary bg-primary/30",
                  isBeforeRegistration && "opacity-30 cursor-not-allowed"
                )}
              >
                <span className={hasData ? "font-bold" : ""}>{format(date, 'd')}</span>
                {getDayCellContent(stat)}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {isRussian ? 'Архив' : 'Archive'}
            </h1>
          </div>
        </div>

        {/* Tabs for type - now includes "All" */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ArchiveType)} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              {isRussian ? 'Все' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="habits" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              {isRussian ? 'Привычки' : 'Habits'}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {isRussian ? 'Задачи' : 'Tasks'}
            </TabsTrigger>
            <TabsTrigger value="finance" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              {isRussian ? 'Финансы' : 'Finance'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Status filter */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">
            {isRussian ? 'Статус:' : 'Status:'}
          </span>
          {(['all', 'completed', 'incomplete'] as StatusFilter[]).map(filter => (
            <Badge
              key={filter}
              variant={statusFilter === filter ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all",
                statusFilter === filter && "bg-primary text-primary-foreground"
              )}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? (isRussian ? 'Все' : 'All') :
               filter === 'completed' ? (isRussian ? 'Выполнено' : 'Completed') :
               (isRussian ? 'Не выполнено' : 'Incomplete')}
            </Badge>
          ))}
          {statusFilter !== 'all' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={() => setStatusFilter('all')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* View mode selector - removed Week */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {(['month', 'quarter'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === mode 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === 'month' ? (isRussian ? 'Месяц' : 'Month') : (isRussian ? 'Квартал' : 'Quarter')}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigatePeriod('prev')}
              disabled={!canNavigatePrev}
              className={!canNavigatePrev ? 'opacity-30' : ''}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(periodRange.start, 'd MMM', { locale })} - {format(periodRange.end, 'd MMM', { locale })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {viewMode === 'quarter' ? (
              // Quarter view - split into months
              <div className="space-y-6">
                {monthsInQuarter.map(monthDate => {
                  const monthStart = startOfMonth(monthDate);
                  const monthEnd = endOfMonth(monthDate);
                  const monthDaysData = dayStats.filter(d => 
                    d.date >= monthStart && d.date <= monthEnd
                  );
                  return renderMonthCalendar(monthDate, monthDaysData);
                })}
              </div>
            ) : (
              // Month view
              renderMonthCalendar(currentDate, dayStats)
            )}
          </CardContent>
        </Card>

        {/* Selected Day Dialog */}
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {selectedDay && format(selectedDay, 'd MMMM yyyy', { locale })}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDay && (
              <div className="space-y-4">
                {/* Habits section - show if all or habits tab */}
                {(activeTab === 'all' || activeTab === 'habits') && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      {isRussian ? 'Привычки' : 'Habits'}
                    </h4>
                    {selectedDayItems.habits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRussian ? 'Нет данных' : 'No data'}</p>
                    ) : (
                      selectedDayItems.habits.map(h => (
                        <Card key={h.id} className="cursor-pointer hover:bg-muted/50">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{h.icon}</span>
                              <span className="font-medium">{h.name}</span>
                              {h.archivedAt && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {isRussian ? 'В архиве' : 'Archived'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {h.archivedAt && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleRestore('habit', h.id)}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {/* Tasks section - show if all or tasks tab */}
                {(activeTab === 'all' || activeTab === 'tasks') && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      {isRussian ? 'Задачи' : 'Tasks'}
                    </h4>
                    {selectedDayItems.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRussian ? 'Нет данных' : 'No data'}</p>
                    ) : (
                      selectedDayItems.tasks.map(t => (
                        <Card key={t.id} className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          t.completed && "opacity-60"
                        )}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "w-3 h-3 rounded-full",
                                t.priority === 'high' ? 'bg-red-500' :
                                t.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                              )} />
                              <span className={cn("font-medium", t.completed && "line-through")}>
                                {t.name}
                              </span>
                              {t.archivedAt && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {isRussian ? 'В архиве' : 'Archived'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {t.archivedAt && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleRestore('task', t.id)}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {/* Finance section - show if all or finance tab */}
                {(activeTab === 'all' || activeTab === 'finance') && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-500" />
                      {isRussian ? 'Финансы' : 'Finance'}
                    </h4>
                    {selectedDayItems.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRussian ? 'Нет данных' : 'No data'}</p>
                    ) : (
                      selectedDayItems.transactions.map(tr => (
                        <Card key={tr.id} className="cursor-pointer hover:bg-muted/50">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="font-medium">{tr.name}</span>
                            <span className={tr.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                              {tr.type === 'income' ? '+' : '-'}{tr.amount.toLocaleString()} ₽
                            </span>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
