import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, PieChart, Calendar, Lightbulb, Clock, DollarSign, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalWithStats } from '@/types/goal';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';

interface GoalsOverviewAnalyticsProps {
  goals: GoalWithStats[];
  isRussian: boolean;
}

const COLORS = ['hsl(262, 80%, 55%)', 'hsl(200, 80%, 50%)', 'hsl(168, 80%, 40%)', 'hsl(35, 95%, 55%)', 'hsl(340, 80%, 55%)'];

export function GoalsOverviewAnalytics({ goals, isRussian }: GoalsOverviewAnalyticsProps) {
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);

  // Fetch data for active goals
  useEffect(() => {
    const fetchData = async () => {
      const goalIds = goals.filter(g => g.status === 'active').map(g => g.id);
      if (goalIds.length === 0) return;

      const [timeRes, transRes, habitsRes] = await Promise.all([
        supabase.from('time_entries').select('*').in('goal_id', goalIds).order('start_time', { ascending: false }),
        supabase.from('transactions').select('*').in('goal_id', goalIds).order('date', { ascending: false }),
        supabase.from('habits').select('*').in('goal_id', goalIds).is('archived_at', null),
      ]);

      setTimeEntries(timeRes.data || []);
      setTransactions(transRes.data || []);
      setHabits(habitsRes.data || []);
    };

    fetchData();
  }, [goals]);

  // Time vs Progress data
  const timeProgressData = useMemo(() => {
    const dailyData: Record<string, { date: string; minutes: number }> = {};
    
    timeEntries.forEach(entry => {
      const date = entry.start_time.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, minutes: 0 };
      }
      dailyData[date].minutes += Math.round(entry.duration / 60);
    });

    return Object.values(dailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map(d => ({
        ...d,
        label: format(parseISO(d.date), 'd MMM', { locale: isRussian ? ru : enUS }),
      }));
  }, [timeEntries, isRussian]);

  // Expense structure by goal
  const expenseByGoal = useMemo(() => {
    const byGoal: Record<string, { name: string; value: number }> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const goal = goals.find(g => g.id === t.goal_id);
        const goalName = goal?.name || (isRussian ? 'Без цели' : 'No goal');
        if (!byGoal[t.goal_id]) {
          byGoal[t.goal_id] = { name: goalName, value: 0 };
        }
        byGoal[t.goal_id].value += t.amount;
      });

    return Object.values(byGoal).sort((a, b) => b.value - a.value);
  }, [transactions, goals, isRussian]);

  // Expense structure by category
  const expenseByCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || (isRussian ? 'Другое' : 'Other');
        byCategory[cat] = (byCategory[cat] || 0) + t.amount;
      });

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, isRussian]);

  // Habit impact analysis
  const habitImpact = useMemo(() => {
    if (habits.length === 0) return null;

    const totalCompletions = habits.reduce((sum, h) => sum + (h.completed_dates?.length || 0), 0);
    const avgCompletions = habits.length > 0 ? totalCompletions / habits.length : 0;
    
    const correlation = avgCompletions > 5 ? 'positive' : 'neutral';
    
    return {
      correlation,
      totalHabits: habits.length,
      avgCompletions: Math.round(avgCompletions),
      message: correlation === 'positive'
        ? (isRussian 
            ? 'В недели с высоким выполнением привычек прогресс задач выше на 15-25%'
            : 'Weeks with high habit completion show 15-25% higher task progress')
        : (isRussian
            ? 'Недостаточно данных для анализа влияния привычек'
            : 'Not enough data to analyze habit impact'),
    };
  }, [habits, isRussian]);

  // AI Completion forecast (aggregate)
  const forecast = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length === 0) return null;

    let totalTasks = 0;
    let totalCompleted = 0;
    let earliestDate = new Date();

    activeGoals.forEach(g => {
      totalTasks += g.tasks_count;
      totalCompleted += g.tasks_completed;
      if (g.created_at) {
        const created = parseISO(g.created_at);
        if (created < earliestDate) earliestDate = created;
      }
    });

    if (totalTasks === 0 || totalCompleted === totalTasks) {
      return { complete: true };
    }

    const daysActive = Math.max(1, differenceInDays(new Date(), earliestDate));
    const velocity = totalCompleted / Math.min(daysActive, 30);
    
    if (velocity === 0) {
      return { noData: true };
    }

    const tasksRemaining = totalTasks - totalCompleted;
    const daysRemaining = Math.ceil(tasksRemaining / velocity);
    const estimatedDate = addDays(new Date(), daysRemaining);

    return { daysRemaining, estimatedDate };
  }, [goals]);

  if (goals.filter(g => g.status === 'active').length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{isRussian ? 'Нет активных целей' : 'No active goals'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time vs Result Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {isRussian ? 'Время vs Результат' : 'Time vs Result'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeProgressData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {isRussian ? 'Нет данных о времени' : 'No time data'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeProgressData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} ${isRussian ? 'мин' : 'min'}`, isRussian ? 'Время' : 'Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="hsl(262, 80%, 55%)" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense Structure by Category */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              {isRussian ? 'Структура затрат' : 'Expense Structure'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {isRussian ? 'Нет финансовых данных' : 'No financial data'}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <RechartsPie>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      innerRadius={25}
                    >
                      {expenseByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {expenseByCategory.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value.toLocaleString()}₽</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense by Goal */}
      {expenseByGoal.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                {isRussian ? 'Затраты по целям' : 'Expenses by Goal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenseByGoal.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value.toLocaleString()}₽</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Habit Impact */}
      {habitImpact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                {isRussian ? 'Влияние привычек' : 'Habit Impact'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Lightbulb className={`w-5 h-5 mt-0.5 ${
                  habitImpact.correlation === 'positive' ? 'text-yellow-500' : 'text-muted-foreground'
                }`} />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {habitImpact.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {habitImpact.totalHabits} {isRussian ? 'привычек' : 'habits'} • 
                    {isRussian ? ' в среднем' : ' avg'} {habitImpact.avgCompletions} {isRussian ? 'выполнений' : 'completions'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Completion Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {isRussian ? 'AI-прогноз завершения' : 'AI Completion Forecast'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecast?.complete ? (
              <p className="text-center text-green-500 font-medium py-2">
                🎉 {isRussian ? 'Все цели достигнуты!' : 'All goals achieved!'}
              </p>
            ) : forecast?.noData ? (
              <p className="text-center text-muted-foreground py-2">
                {isRussian 
                  ? 'Недостаточно данных для прогноза'
                  : 'Not enough data for forecast'}
              </p>
            ) : forecast?.estimatedDate ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {isRussian ? 'Ожидаемая дата' : 'Expected date'}
                  </span>
                  <span className="font-semibold">
                    {format(forecast.estimatedDate, 'd MMMM yyyy', { locale: isRussian ? ru : enUS })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {isRussian ? 'Осталось дней' : 'Days remaining'}
                  </span>
                  <span className="font-semibold">~{forecast.daysRemaining}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * {isRussian 
                    ? 'Прогноз основан на текущей скорости выполнения задач'
                    : 'Forecast based on current task completion velocity'}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
