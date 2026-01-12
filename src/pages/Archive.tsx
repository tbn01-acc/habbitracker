import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Archive, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  CheckCircle2, Target, DollarSign, Crown, Copy, Eye, Filter, X
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, 
  addWeeks, subWeeks, addMonths, subMonths, addQuarters, subQuarters, 
  eachDayOfInterval, isSameDay
} from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type ViewMode = 'week' | 'month' | 'quarter';
type ArchiveType = 'habits' | 'tasks' | 'finance';
type StatusFilter = 'all' | 'completed' | 'incomplete';

interface DayStats {
  date: Date;
  habits: number;
  habitsTotal: number;
  tasks: number;
  tasksCompleted: number;
  income: number;
  expense: number;
}

export default function ArchivePage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { currentPlan, loading: subLoading } = useSubscription();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { transactions } = useFinance();
  
  const isRussian = language === 'ru';
  const locale = isRussian ? ru : enUS;
  const isPro = currentPlan === 'pro';

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [activeTab, setActiveTab] = useState<ArchiveType>('habits');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Get period range based on view mode
  const periodRange = useMemo(() => {
    switch (viewMode) {
      case 'week':
        return { 
          start: startOfWeek(currentDate, { weekStartsOn: 1 }), 
          end: endOfWeek(currentDate, { weekStartsOn: 1 }) 
        };
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case 'quarter':
        return { start: startOfQuarter(currentDate), end: endOfQuarter(currentDate) };
    }
  }, [viewMode, currentDate]);

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
      
      return { date, habits: habitsCount, habitsTotal, tasks: tasksCount, tasksCompleted, income, expense };
    });
  }, [daysInPeriod, habits, tasks, transactions]);

  // Navigate periods
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const fn = direction === 'next' 
      ? (viewMode === 'week' ? addWeeks : viewMode === 'month' ? addMonths : addQuarters)
      : (viewMode === 'week' ? subWeeks : viewMode === 'month' ? subMonths : subQuarters);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Archive className="w-5 h-5 text-white" />
              </div>
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

        {/* Tabs for type */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ArchiveType)} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
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

        {/* View mode selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {(['week', 'month', 'quarter'] as ViewMode[]).map(mode => (
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
                {mode === 'week' ? (isRussian ? 'Неделя' : 'Week') :
                 mode === 'month' ? (isRussian ? 'Месяц' : 'Month') :
                 (isRussian ? 'Квартал' : 'Quarter')}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')}>
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
            <div className={cn(
              "grid gap-2",
              viewMode === 'week' ? "grid-cols-7" : viewMode === 'month' ? "grid-cols-7" : "grid-cols-7"
            )}>
              {/* Day headers */}
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {isRussian ? day : day}
                </div>
              ))}
              
              {/* Day cells */}
              {dayStats.map((stat, idx) => {
                const isToday = isSameDay(stat.date, new Date());
                const hasData = activeTab === 'habits' ? stat.habits > 0 :
                               activeTab === 'tasks' ? stat.tasks > 0 :
                               (stat.income > 0 || stat.expense > 0);
                
                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    onClick={() => setSelectedDay(stat.date)}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                      isToday && "ring-2 ring-primary",
                      hasData ? "bg-primary/20 text-primary font-medium" : "bg-muted/30 text-muted-foreground",
                      selectedDay && isSameDay(stat.date, selectedDay) && "ring-2 ring-primary bg-primary/30"
                    )}
                  >
                    <span>{format(stat.date, 'd')}</span>
                    {hasData && (
                      <span className="text-[8px] mt-0.5">
                        {activeTab === 'habits' && stat.habits}
                        {activeTab === 'tasks' && stat.tasks}
                        {activeTab === 'finance' && (stat.income > 0 ? '+' : '') + (stat.income - stat.expense)}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
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
                {activeTab === 'habits' && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-habit" />
                      {isRussian ? 'Выполненные привычки' : 'Completed Habits'}
                    </h4>
                    {selectedDayItems.habits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRussian ? 'Нет данных' : 'No data'}</p>
                    ) : (
                      selectedDayItems.habits.map(h => (
                        <Card key={h.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailItem(h)}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{h.icon}</span>
                              <span className="font-medium">{h.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {activeTab === 'tasks' && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-task" />
                      {isRussian ? 'Задачи' : 'Tasks'}
                    </h4>
                    {selectedDayItems.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRussian ? 'Нет данных' : 'No data'}</p>
                    ) : (
                      selectedDayItems.tasks.map(t => (
                        <Card key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailItem(t)}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{t.icon}</span>
                              <span className={cn("font-medium", t.completed && "line-through text-muted-foreground")}>
                                {t.name}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {activeTab === 'finance' && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-finance" />
                      {isRussian ? 'Операции' : 'Transactions'}
                    </h4>
                    {selectedDayItems.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRussian ? 'Нет данных' : 'No data'}</p>
                    ) : (
                      selectedDayItems.transactions.map(t => (
                        <Card key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailItem(t)}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="font-medium">{t.name}</span>
                            <span className={cn(
                              "font-medium",
                              t.type === 'income' ? "text-green-500" : "text-red-500"
                            )}>
                              {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₽
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