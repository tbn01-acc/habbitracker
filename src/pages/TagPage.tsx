import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Tag, Target, CheckSquare, Wallet, Clock, DollarSign, Calendar, BarChart3, TrendingUp, Settings2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { useUserTags } from '@/hooks/useUserTags';
import { useTagGoals } from '@/hooks/useTagGoals';
import { useHabits, getTodayString } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useTranslation } from '@/contexts/LanguageContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HabitCard } from '@/components/HabitCard';
import { TaskCard } from '@/components/TaskCard';
import { TransactionCard } from '@/components/TransactionCard';
import { PeriodSelector } from '@/components/PeriodSelector';
import { TagGoalDialog } from '@/components/TagGoalDialog';
import { TagGoalHistory } from '@/components/TagGoalHistory';
import { useTagGoalNotifications } from '@/hooks/useTagGoalNotifications';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend
} from 'recharts';

export default function TagPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { tags, loading: tagsLoading } = useUserTags();
  const { goals, getGoalForTag, upsertGoal } = useTagGoals();
  const { habits, toggleHabitCompletion } = useHabits();
  const { tasks, toggleTaskCompletion } = useTasks();
  const { transactions, toggleTransactionCompletion } = useFinance();
  const timeTracker = useTimeTracker();
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'tasks' | 'finance' | 'calendar' | 'history'>('overview');
  const [period, setPeriod] = useState<'7' | '14' | '30'>('30');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // Initialize goal notifications
  useTagGoalNotifications();

  const tag = useMemo(() => tags.find(t => t.id === tagId), [tags, tagId]);
  const today = getTodayString();
  const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;

  // Filter items by tag
  const tagHabits = useMemo(() => 
    habits.filter(h => h.tagIds?.includes(tagId || '')),
    [habits, tagId]
  );

  const tagTasks = useMemo(() => 
    tasks.filter(t => t.tagIds?.includes(tagId || '')),
    [tasks, tagId]
  );

  const tagTransactions = useMemo(() => 
    transactions.filter(t => t.tagIds?.includes(tagId || '')),
    [transactions, tagId]
  );

  // Time entries for tag tasks
  const tagTimeEntries = useMemo(() => {
    const taskIds = new Set(tagTasks.map(t => t.id));
    return timeTracker.entries.filter(e => e.taskId && taskIds.has(e.taskId));
  }, [tagTasks, timeTracker.entries]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const periodDays = parseInt(period);
    const startDate = subDays(new Date(), periodDays - 1);
    const endDate = new Date();

    // Total expense
    const totalExpense = tagTransactions
      .filter(t => t.type === 'expense' && t.completed)
      .reduce((sum, t) => sum + t.amount, 0);

    // Total income
    const totalIncome = tagTransactions
      .filter(t => t.type === 'income' && t.completed)
      .reduce((sum, t) => sum + t.amount, 0);

    // Total time spent (in minutes)
    const totalTimeMinutes = tagTimeEntries.reduce((sum, e) => sum + e.duration, 0);
    const totalTimeHours = Math.round(totalTimeMinutes / 60 * 10) / 10;

    // Completed tasks
    const completedTasks = tagTasks.filter(t => t.completed).length;

    // Habit completion rate
    const habitCompletions = tagHabits.reduce((sum, h) => sum + h.completedDates.length, 0);
    const habitTargetDays = tagHabits.reduce((sum, h) => sum + periodDays, 0);
    const habitCompletionRate = habitTargetDays > 0 ? Math.round((habitCompletions / habitTargetDays) * 100) : 0;

    // Cost per hour (expense / time)
    const costPerHour = totalTimeHours > 0 ? Math.round(totalExpense / totalTimeHours) : 0;

    // ROI (income - expense) / time
    const netValue = totalIncome - totalExpense;
    const valuePerHour = totalTimeHours > 0 ? Math.round(netValue / totalTimeHours) : 0;

    return {
      totalExpense,
      totalIncome,
      totalTimeHours,
      totalTimeMinutes,
      completedTasks,
      totalTasks: tagTasks.length,
      habitCompletionRate,
      costPerHour,
      valuePerHour,
      netValue
    };
  }, [tagTransactions, tagTimeEntries, tagTasks, tagHabits, period]);

  // Trend data for charts
  const trendData = useMemo(() => {
    const periodDays = parseInt(period);
    const days = Array.from({ length: periodDays }, (_, i) => {
      const date = subDays(new Date(), periodDays - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayExpense = tagTransactions
        .filter(t => t.date === dateStr && t.type === 'expense' && t.completed)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayIncome = tagTransactions
        .filter(t => t.date === dateStr && t.type === 'income' && t.completed)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayTime = tagTimeEntries
        .filter(e => format(new Date(e.startTime), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, e) => sum + e.duration, 0);

      const dayHabitsCompleted = tagHabits.filter(h => h.completedDates.includes(dateStr)).length;
      const dayTasksCompleted = tagTasks.filter(t => t.completed && t.dueDate === dateStr).length;

      return {
        date: format(date, 'd MMM', { locale }),
        expense: dayExpense,
        income: dayIncome,
        time: Math.round(dayTime / 60 * 10) / 10,
        habits: dayHabitsCompleted,
        tasks: dayTasksCompleted,
        efficiency: dayTime > 0 ? Math.round((dayHabitsCompleted + dayTasksCompleted) / (dayTime / 60) * 10) / 10 : 0
      };
    });

    return days;
  }, [tagTransactions, tagTimeEntries, tagHabits, tagTasks, period, locale]);

  // Calendar data
  const calendarData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const habitsCompleted = tagHabits.filter(h => h.completedDates.includes(dateStr)).length;
      const tasksCompleted = tagTasks.filter(t => t.completed && t.dueDate === dateStr).length;
      const expense = tagTransactions
        .filter(t => t.date === dateStr && t.type === 'expense' && t.completed)
        .reduce((sum, t) => sum + t.amount, 0);

      const total = habitsCompleted + tasksCompleted;
      const intensity = Math.min(total / 5, 1); // Max intensity at 5 completions

      return {
        date: day,
        dateStr,
        habitsCompleted,
        tasksCompleted,
        expense,
        total,
        intensity
      };
    });
  }, [tagHabits, tagTasks, tagTransactions]);

  const COLORS = ['hsl(var(--habit))', 'hsl(var(--task))', 'hsl(var(--finance))'];

  // Show loading while tags are loading OR if we have a tagId but haven't found the tag yet
  // This prevents flashing "not found" when tags are still being fetched
  if (tagsLoading || (tagId && tags.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">{t('tagNotFound')}</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            {t('backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  const isRu = language === 'ru';
  const tagGoal = tagId ? getGoalForTag(tagId) : undefined;

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!tagGoal) return null;
    
    const now = new Date();
    const periodStart = tagGoal.period === 'weekly' 
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);
    const periodEnd = tagGoal.period === 'weekly'
      ? endOfWeek(now, { weekStartsOn: 1 })
      : endOfMonth(now);
    
    // Calculate period expense
    const periodExpense = tagTransactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && t.completed && date >= periodStart && date <= periodEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate period time
    const periodTime = tagTimeEntries
      .filter(e => {
        const date = new Date(e.startTime);
        return date >= periodStart && date <= periodEnd;
      })
      .reduce((sum, e) => sum + e.duration, 0);
    
    const budgetPercent = tagGoal.budget_goal ? Math.round((periodExpense / tagGoal.budget_goal) * 100) : 0;
    const timePercent = tagGoal.time_goal_minutes ? Math.round((periodTime / tagGoal.time_goal_minutes) * 100) : 0;
    
    return {
      periodExpense,
      periodTimeMinutes: periodTime,
      budgetPercent: Math.min(budgetPercent, 150),
      timePercent: Math.min(timePercent, 150),
      budgetExceeded: tagGoal.budget_goal ? periodExpense > tagGoal.budget_goal : false,
      timeExceeded: tagGoal.time_goal_minutes ? periodTime > tagGoal.time_goal_minutes : false,
    };
  }, [tagGoal, tagTransactions, tagTimeEntries]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${tag.color}20` }}
            >
              <Tag className="w-5 h-5" style={{ color: tag.color }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{tag.name}</h1>
              <p className="text-sm text-muted-foreground">
                {tagHabits.length} {t('habits').toLowerCase()} • {tagTasks.length} {t('tasks').toLowerCase()} • {tagTransactions.length} {t('transactions').toLowerCase()}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setGoalDialogOpen(true)}
            className="shrink-0"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Goals Progress */}
        {tagGoal && goalProgress && (
          <Card className="p-4 mb-6 border-2" style={{ borderColor: tag.color }}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: tag.color }} />
              <span className="font-medium">{isRu ? 'Цели' : 'Goals'} ({tagGoal.period === 'weekly' ? (isRu ? 'неделя' : 'week') : (isRu ? 'месяц' : 'month')})</span>
            </div>
            <div className="space-y-4">
              {tagGoal.budget_goal && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {isRu ? 'Бюджет' : 'Budget'}
                    </span>
                    <span className={goalProgress.budgetExceeded ? 'text-destructive font-medium' : ''}>
                      {goalProgress.periodExpense.toLocaleString()} / {tagGoal.budget_goal.toLocaleString()} ₽
                    </span>
                  </div>
                  <Progress 
                    value={goalProgress.budgetPercent} 
                    className={`h-2 ${goalProgress.budgetExceeded ? '[&>div]:bg-destructive' : ''}`}
                  />
                </div>
              )}
              {tagGoal.time_goal_minutes && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isRu ? 'Время' : 'Time'}
                    </span>
                    <span className={goalProgress.timeExceeded ? 'text-habit font-medium' : ''}>
                      {Math.round(goalProgress.periodTimeMinutes / 60 * 10) / 10} / {Math.round(tagGoal.time_goal_minutes / 60)} {t('hours')}
                    </span>
                  </div>
                  <Progress 
                    value={goalProgress.timePercent} 
                    className={`h-2 ${goalProgress.timeExceeded ? '[&>div]:bg-habit' : ''}`}
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Period Selector */}
        <div className="mb-6">
          <PeriodSelector value={period} onValueChange={setPeriod} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview" className="text-xs px-1">
              <BarChart3 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="habits" className="text-xs px-1">
              <Target className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs px-1">
              <CheckSquare className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="finance" className="text-xs px-1">
              <Wallet className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs px-1">
              <Calendar className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-1">
              <TrendingUp className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  {t('timeTracker')}
                </div>
                <p className="text-2xl font-bold">{analytics.totalTimeHours} {t('hours')}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  {t('expense')}
                </div>
                <p className="text-2xl font-bold text-destructive">-{analytics.totalExpense.toLocaleString()} ₽</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  {t('costPerHour')}
                </div>
                <p className="text-2xl font-bold">{analytics.costPerHour.toLocaleString()} ₽/{t('hour')}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <CheckSquare className="w-4 h-4" />
                  {t('completionRate')}
                </div>
                <p className="text-2xl font-bold">{analytics.habitCompletionRate}%</p>
              </Card>
            </div>

            {/* Combined Metrics */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">{t('combinedMetrics')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('netValue')}</span>
                  <span className={`font-semibold ${analytics.netValue >= 0 ? 'text-habit' : 'text-destructive'}`}>
                    {analytics.netValue >= 0 ? '+' : ''}{analytics.netValue.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('valuePerHour')}</span>
                  <span className={`font-semibold ${analytics.valuePerHour >= 0 ? 'text-habit' : 'text-destructive'}`}>
                    {analytics.valuePerHour >= 0 ? '+' : ''}{analytics.valuePerHour.toLocaleString()} ₽/{t('hour')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('tasksCompleted')}</span>
                  <span className="font-semibold">{analytics.completedTasks}/{analytics.totalTasks}</span>
                </div>
              </div>
            </Card>

            {/* Expense Trend Chart */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">{t('expenseTrend')}</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                      name={t('expense')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="hsl(var(--habit))" 
                      strokeWidth={2}
                      dot={false}
                      name={t('income')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Activity Trend Chart */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">{t('activityTrend')}</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="habits" fill="hsl(var(--habit))" name={t('habits')} stackId="a" />
                    <Bar dataKey="tasks" fill="hsl(var(--task))" name={t('tasks')} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tagHabits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('noHabitsToShow')}
                </div>
              ) : (
                tagHabits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    index={index}
                    onToggle={(date) => toggleHabitCompletion(habit.id, date)}
                    onEdit={() => navigate('/habits')}
                    onDelete={() => {}}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tagTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('noTasksForDay')}
                </div>
              ) : (
                tagTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onToggle={() => toggleTaskCompletion(task.id)}
                    onEdit={() => navigate('/tasks')}
                    onDelete={() => {}}
                    activeTimer={timeTracker.activeTimer}
                    elapsedTime={timeTracker.elapsedTime}
                    onStartTimer={timeTracker.startTimer}
                    onStopTimer={timeTracker.stopTimer}
                    formatDuration={timeTracker.formatDuration}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-3">
            {/* Summary */}
            <Card className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('financeBalance')}</span>
                <span className={`text-xl font-bold ${analytics.netValue >= 0 ? 'text-habit' : 'text-destructive'}`}>
                  {analytics.netValue >= 0 ? '+' : ''}{analytics.netValue.toLocaleString()} ₽
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-habit">+{analytics.totalIncome.toLocaleString()} ₽</span>
                <span className="text-destructive">-{analytics.totalExpense.toLocaleString()} ₽</span>
              </div>
            </Card>

            <AnimatePresence mode="popLayout">
              {tagTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('noTransactionsForDay')}
                </div>
              ) : (
                tagTransactions.map((transaction, index) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    index={index}
                    onToggle={() => toggleTransactionCompletion(transaction.id)}
                    onEdit={() => navigate('/finance')}
                    onDelete={() => {}}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">{format(new Date(), 'LLLL yyyy', { locale })}</h3>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {/* Padding for first day */}
                {Array.from({ length: calendarData[0]?.date.getDay() || 0 }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}

                {/* Calendar days */}
                {calendarData.map(day => {
                  const isToday = day.dateStr === today;
                  return (
                    <div
                      key={day.dateStr}
                      className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                        ${isToday ? 'ring-2 ring-primary' : ''}
                      `}
                      style={{
                        backgroundColor: day.total > 0 
                          ? `${tag.color}${Math.round(day.intensity * 60 + 20).toString(16)}`
                          : undefined
                      }}
                    >
                      <span className={day.total > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {format(day.date, 'd')}
                      </span>
                      {day.total > 0 && (
                        <span className="text-[8px] opacity-70">{day.total}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {tagId && <TagGoalHistory tagId={tagId} tagColor={tag.color} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Dialog */}
      {tag && (
        <TagGoalDialog
          open={goalDialogOpen}
          onClose={() => setGoalDialogOpen(false)}
          onSave={upsertGoal}
          tag={tag}
          existingGoal={tagGoal}
        />
      )}
    </div>
  );
}
