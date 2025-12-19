import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/contexts/LanguageContext';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, startOfDay, parseISO, subMonths, subYears } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_DAYS: Record<Period, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

export function ProductivityStats() {
  const { t } = useTranslation();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const [period, setPeriod] = useState<Period>('week');

  const periodDays = PERIOD_DAYS[period];

  const getDateRange = (days: number, offset: number = 0) => {
    const today = startOfDay(new Date());
    const startDay = subDays(today, days - 1 + offset * days);
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(startDay, -i);
      return format(date, 'yyyy-MM-dd');
    });
  };

  const calculateStats = (dateRange: string[]) => {
    return dateRange.map(date => {
      const habitsCompleted = habits.filter(h => h.completedDates.includes(date)).length;
      const habitsTotal = habits.filter(h => {
        const dayOfWeek = new Date(date).getDay();
        return h.targetDays.includes(dayOfWeek);
      }).length;

      const tasksCompleted = tasks.filter(t => 
        t.completed && t.dueDate.split('T')[0] === date
      ).length;
      const tasksTotal = tasks.filter(t => t.dueDate.split('T')[0] === date).length;

      const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;
      const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

      const weights = [
        habitsTotal > 0 ? 1 : 0,
        tasksTotal > 0 ? 1 : 0,
      ];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const productivity = totalWeight > 0
        ? (habitScore * weights[0] + taskScore * weights[1]) / totalWeight
        : 0;

      return {
        date,
        displayDate: format(new Date(date), 'dd.MM'),
        habits: habitsCompleted,
        habitsTotal,
        tasks: tasksCompleted,
        tasksTotal,
        productivity: Math.round(productivity),
      };
    });
  };

  const dateRange = useMemo(() => getDateRange(periodDays, 0), [periodDays]);
  const previousDateRange = useMemo(() => getDateRange(periodDays, 1), [periodDays]);

  const dailyStats = useMemo(() => calculateStats(dateRange), [dateRange, habits, tasks]);
  const previousStats = useMemo(() => calculateStats(previousDateRange), [previousDateRange, habits, tasks]);

  // Summary stats
  const getSummary = (stats: typeof dailyStats) => {
    const totalHabits = stats.reduce((sum, d) => sum + d.habits, 0);
    const totalHabitsTarget = stats.reduce((sum, d) => sum + d.habitsTotal, 0);
    const totalTasks = stats.reduce((sum, d) => sum + d.tasks, 0);
    const totalTasksTarget = stats.reduce((sum, d) => sum + d.tasksTotal, 0);
    const avgProductivity = stats.length > 0 
      ? Math.round(stats.reduce((sum, d) => sum + d.productivity, 0) / stats.length) 
      : 0;

    return {
      habits: { completed: totalHabits, total: totalHabitsTarget },
      tasks: { completed: totalTasks, total: totalTasksTarget },
      productivity: avgProductivity,
    };
  };

  const summary = useMemo(() => getSummary(dailyStats), [dailyStats]);
  const previousSummary = useMemo(() => getSummary(previousStats), [previousStats]);

  // Growth calculation
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const growth = {
    habits: calculateGrowth(summary.habits.completed, previousSummary.habits.completed),
    tasks: calculateGrowth(summary.tasks.completed, previousSummary.tasks.completed),
    productivity: summary.productivity - previousSummary.productivity,
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-0.5 text-xs text-green-500">
          <TrendingUp className="w-3 h-3" />+{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-0.5 text-xs text-red-500">
          <TrendingDown className="w-3 h-3" />{value}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />0%
      </span>
    );
  };

  const pieData = [
    { name: t('habits'), value: summary.habits.completed, color: 'hsl(var(--habit))' },
    { name: t('tasks'), value: summary.tasks.completed, color: 'hsl(var(--task))' },
  ];

  const chartConfig = {
    habits: { label: t('habits'), color: 'hsl(var(--habit))' },
    tasks: { label: t('tasks'), color: 'hsl(var(--task))' },
    productivity: { label: t('productivity'), color: 'hsl(var(--primary))' },
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: t('week') },
    { key: 'month', label: t('month') },
    { key: 'quarter', label: t('quarter') },
    { key: 'year', label: t('year') },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards with Growth */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-habit/10 border border-habit/20"
        >
          <div className="flex justify-between items-start">
            <div className="text-2xl font-bold text-habit">{summary.habits.completed}</div>
            <GrowthIndicator value={growth.habits} />
          </div>
          <div className="text-xs text-muted-foreground">{t('habits')}</div>
          <div className="text-xs text-habit/70">{summary.habits.total} {t('planned')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-task/10 border border-task/20"
        >
          <div className="flex justify-between items-start">
            <div className="text-2xl font-bold text-task">{summary.tasks.completed}</div>
            <GrowthIndicator value={growth.tasks} />
          </div>
          <div className="text-xs text-muted-foreground">{t('tasks')}</div>
          <div className="text-xs text-task/70">{summary.tasks.total} {t('planned')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="flex justify-between items-start">
            <div className="text-2xl font-bold text-primary">{summary.productivity}%</div>
            <GrowthIndicator value={growth.productivity} />
          </div>
          <div className="text-xs text-muted-foreground">{t('productivity')}</div>
          <div className="text-xs text-primary/70">{t('average')}</div>
        </motion.div>
      </div>

      {/* Productivity Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-card border border-border"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('productivityTrend')}</h3>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
              <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="productivity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </motion.div>

      {/* Activity Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-card border border-border"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('activityByDay')}</h3>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyStats}>
              <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="habits" fill="hsl(var(--habit))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="tasks" fill="hsl(var(--task))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-habit" />
            <span className="text-xs text-muted-foreground">{t('habits')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-task" />
            <span className="text-xs text-muted-foreground">{t('tasks')}</span>
          </div>
        </div>
      </motion.div>

      {/* Distribution Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-card border border-border"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('activityDistribution')}</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
