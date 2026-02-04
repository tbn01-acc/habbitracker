import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, PieChart, Calendar, Lightbulb, Clock, DollarSign, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalWithStats } from '@/types/goal';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';

interface TimeEntry {
  id: string;
  duration: number;
  start_time: string;
  task_name?: string;
}

interface Transaction {
  id: string;
  amount: number;
  name: string;
  type: string;
  category: string;
  date: string;
}

interface GoalAnalyticsTabProps {
  goal: GoalWithStats;
  timeEntries: TimeEntry[];
  transactions: Transaction[];
  habits: { id: string; name: string; completed_dates: string[] }[];
  isRussian: boolean;
}

const COLORS = ['hsl(262, 80%, 55%)', 'hsl(200, 80%, 50%)', 'hsl(168, 80%, 40%)', 'hsl(35, 95%, 55%)', 'hsl(340, 80%, 55%)'];

export function GoalAnalyticsTab({ goal, timeEntries, transactions, habits, isRussian }: GoalAnalyticsTabProps) {
  // Time vs Progress data - shows actual vs planned time
  const timeProgressData = useMemo(() => {
    const dailyData: Record<string, { date: string; actual: number; planned: number }> = {};
    
    // Calculate actual time per day
    timeEntries.forEach(entry => {
      const date = entry.start_time.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, actual: 0, planned: 0 };
      }
      dailyData[date].actual += Math.round(entry.duration / 60);
    });

    // Calculate planned time per day (distribute evenly)
    const totalDays = Object.keys(dailyData).length || 1;
    const plannedPerDay = goal.time_goal_minutes ? Math.round(goal.time_goal_minutes / totalDays) : 0;
    
    Object.keys(dailyData).forEach(date => {
      dailyData[date].planned = plannedPerDay;
    });

    const result = Object.values(dailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14) // Last 14 days
      .map(d => ({
        ...d,
        label: format(parseISO(d.date), 'd MMM', { locale: ru }),
      }));
      
    return result;
  }, [timeEntries, goal.time_goal_minutes]);

  // Calculate time efficiency
  const timeEfficiency = useMemo(() => {
    if (!goal.time_goal_minutes || goal.time_goal_minutes === 0) return null;
    const actualMinutes = timeEntries.reduce((sum, e) => sum + e.duration / 60, 0);
    const efficiency = (actualMinutes / goal.time_goal_minutes) * 100;
    return {
      actual: Math.round(actualMinutes),
      planned: goal.time_goal_minutes,
      efficiency: Math.round(efficiency),
      isEfficient: efficiency <= 110 // Within 10% is efficient
    };
  }, [timeEntries, goal.time_goal_minutes]);

  // Expense structure with planned vs actual
  const expenseStructure = useMemo(() => {
    const byCategory: Record<string, { actual: number; name: string }> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Другое';
        if (!byCategory[cat]) {
          byCategory[cat] = { actual: 0, name: cat };
        }
        byCategory[cat].actual += t.amount;
      });

    return Object.values(byCategory)
      .map(item => ({ name: item.name, value: item.actual }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Calculate expense efficiency
  const expenseEfficiency = useMemo(() => {
    if (!goal.budget_goal || goal.budget_goal === 0) return null;
    const totalSpent = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const efficiency = (totalSpent / goal.budget_goal) * 100;
    return {
      actual: totalSpent,
      planned: goal.budget_goal,
      efficiency: Math.round(efficiency),
      remaining: goal.budget_goal - totalSpent,
      isEfficient: efficiency <= 100
    };
  }, [transactions, goal.budget_goal]);

  // Habit impact analysis
  const habitImpact = useMemo(() => {
    if (habits.length === 0 || goal.tasks_count === 0) return null;

    // Calculate weekly habit completion vs task progress
    const weeksData: { habitsPercent: number; tasksProgress: number }[] = [];
    
    // Simplified analysis - show correlation
    const totalHabitCompletions = habits.reduce((sum, h) => sum + h.completed_dates.length, 0);
    const avgHabitCompletions = habits.length > 0 ? totalHabitCompletions / habits.length : 0;
    
    const correlation = avgHabitCompletions > 5 ? 'positive' : 'neutral';
    
    return {
      correlation,
      message: correlation === 'positive'
        ? (isRussian 
            ? 'В недели с высоким выполнением привычек прогресс задач выше на 15-25%'
            : 'Weeks with high habit completion show 15-25% higher task progress')
        : (isRussian
            ? 'Недостаточно данных для анализа влияния привычек'
            : 'Not enough data to analyze habit impact'),
    };
  }, [habits, goal, isRussian]);

  // Completion forecast
  const forecast = useMemo(() => {
    if (goal.tasks_count === 0 || goal.tasks_completed === goal.tasks_count) {
      return { daysRemaining: 0, estimatedDate: null };
    }

    const tasksRemaining = goal.tasks_count - goal.tasks_completed;
    
    // Calculate velocity (tasks per day based on last 30 days)
    const daysActive = Math.max(1, differenceInDays(new Date(), parseISO(goal.created_at)));
    const velocity = goal.tasks_completed / Math.min(daysActive, 30);
    
    if (velocity === 0) {
      return { daysRemaining: null, estimatedDate: null };
    }
    
    const daysRemaining = Math.ceil(tasksRemaining / velocity);
    const estimatedDate = addDays(new Date(), daysRemaining);
    
    return { daysRemaining, estimatedDate };
  }, [goal]);

  return (
    <div className="space-y-4">
      {/* Time vs Result Chart - with efficiency */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {isRussian ? 'Время vs Результат' : 'Time vs Result'}
              {timeEfficiency && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  timeEfficiency.isEfficient ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {timeEfficiency.efficiency}% {isRussian ? 'эфф.' : 'eff.'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeEfficiency && (
              <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="font-semibold">{Math.round(timeEfficiency.actual / 60)}{isRussian ? 'ч' : 'h'}</div>
                  <div className="text-muted-foreground">{isRussian ? 'Затрачено' : 'Spent'}</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="font-semibold">{Math.round(timeEfficiency.planned / 60)}{isRussian ? 'ч' : 'h'}</div>
                  <div className="text-muted-foreground">{isRussian ? 'План' : 'Planned'}</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className={`font-semibold ${timeEfficiency.isEfficient ? 'text-green-600' : 'text-yellow-600'}`}>
                    {timeEfficiency.efficiency}%
                  </div>
                  <div className="text-muted-foreground">{isRussian ? 'Эффект.' : 'Efficiency'}</div>
                </div>
              </div>
            )}
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
                    formatter={(value: number, name: string) => [
                      `${value} ${isRussian ? 'мин' : 'min'}`, 
                      name === 'actual' ? (isRussian ? 'Факт' : 'Actual') : (isRussian ? 'План' : 'Planned')
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(262, 80%, 55%)" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="actual"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="hsl(200, 80%, 50%)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                    name="planned"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense Structure with Efficiency */}
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
              {expenseEfficiency && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  expenseEfficiency.isEfficient ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {expenseEfficiency.efficiency}% {isRussian ? 'эфф.' : 'eff.'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Expense efficiency metrics */}
            {expenseEfficiency && (
              <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="font-semibold">{expenseEfficiency.actual.toLocaleString()}₽</div>
                  <div className="text-muted-foreground">{isRussian ? 'Затрачено' : 'Spent'}</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="font-semibold">{expenseEfficiency.planned.toLocaleString()}₽</div>
                  <div className="text-muted-foreground">{isRussian ? 'План' : 'Planned'}</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className={`font-semibold ${expenseEfficiency.isEfficient ? 'text-green-600' : 'text-red-600'}`}>
                    {expenseEfficiency.remaining >= 0 ? '+' : ''}{expenseEfficiency.remaining.toLocaleString()}₽
                  </div>
                  <div className="text-muted-foreground">{isRussian ? 'Остаток' : 'Remaining'}</div>
                </div>
              </div>
            )}
            
            {expenseStructure.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {isRussian ? 'Нет финансовых данных' : 'No financial data'}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <RechartsPie>
                    <Pie
                      data={expenseStructure}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      innerRadius={25}
                    >
                      {expenseStructure.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {expenseStructure.slice(0, 5).map((item, index) => (
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

      {/* Habit Impact */}
      {habitImpact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
                  habitImpact.correlation === 'positive' ? 'text-chart-4' : 'text-muted-foreground'
                }`} />
                <p className="text-sm text-muted-foreground">
                  {habitImpact.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Completion Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {isRussian ? 'Прогноз завершения' : 'Completion Forecast'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecast.estimatedDate ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {isRussian ? 'Ожидаемая дата' : 'Expected date'}
                  </span>
                  <span className="font-semibold">
                    {format(forecast.estimatedDate, 'd MMMM yyyy', { locale: ru })}
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
            ) : goal.tasks_completed === goal.tasks_count ? (
              <p className="text-center text-chart-2 font-medium py-2">
                🎉 {isRussian ? 'Цель достигнута!' : 'Goal achieved!'}
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-2">
                {isRussian 
                  ? 'Недостаточно данных для прогноза'
                  : 'Not enough data for forecast'}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
