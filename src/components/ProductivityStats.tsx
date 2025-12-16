import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/contexts/LanguageContext';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFitness } from '@/hooks/useFitness';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';

type Period = '7' | '30';

export function ProductivityStats() {
  const { t } = useTranslation();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { workouts, completions } = useFitness();
  const [period, setPeriod] = useState<Period>('7');

  const periodDays = parseInt(period);

  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: periodDays }, (_, i) => {
      const date = subDays(today, periodDays - 1 - i);
      return format(date, 'yyyy-MM-dd');
    });
  }, [periodDays]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    return dateRange.map(date => {
      // Habits completed on this date
      const habitsCompleted = habits.filter(h => h.completedDates.includes(date)).length;
      const habitsTotal = habits.filter(h => {
        const dayOfWeek = new Date(date).getDay();
        return h.targetDays.includes(dayOfWeek);
      }).length;

      // Tasks completed on this date
      const tasksCompleted = tasks.filter(t => 
        t.completed && t.dueDate.split('T')[0] === date
      ).length;
      const tasksTotal = tasks.filter(t => t.dueDate.split('T')[0] === date).length;

      // Exercises completed on this date
      const dayOfWeek = new Date(date).getDay();
      const todayWorkouts = workouts.filter(w => w.scheduledDays.includes(dayOfWeek));
      const totalExercises = todayWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
      const completedExercises = todayWorkouts.reduce((sum, w) => {
        const completion = completions.find(c => c.workoutId === w.id && c.date === date);
        return sum + (completion?.completedExercises.length || 0);
      }, 0);

      // Calculate productivity score (0-100)
      const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;
      const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
      const exerciseScore = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

      // Weighted average
      const weights = [
        habitsTotal > 0 ? 1 : 0,
        tasksTotal > 0 ? 1 : 0,
        totalExercises > 0 ? 1 : 0,
      ];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const productivity = totalWeight > 0
        ? (habitScore * weights[0] + taskScore * weights[1] + exerciseScore * weights[2]) / totalWeight
        : 0;

      return {
        date,
        displayDate: format(new Date(date), 'dd.MM'),
        habits: habitsCompleted,
        habitsTotal,
        tasks: tasksCompleted,
        tasksTotal,
        exercises: completedExercises,
        exercisesTotal: totalExercises,
        productivity: Math.round(productivity),
      };
    });
  }, [dateRange, habits, tasks, workouts, completions]);

  // Summary stats
  const summary = useMemo(() => {
    const totalHabits = dailyStats.reduce((sum, d) => sum + d.habits, 0);
    const totalHabitsTarget = dailyStats.reduce((sum, d) => sum + d.habitsTotal, 0);
    const totalTasks = dailyStats.reduce((sum, d) => sum + d.tasks, 0);
    const totalTasksTarget = dailyStats.reduce((sum, d) => sum + d.tasksTotal, 0);
    const totalExercises = dailyStats.reduce((sum, d) => sum + d.exercises, 0);
    const totalExercisesTarget = dailyStats.reduce((sum, d) => sum + d.exercisesTotal, 0);
    const avgProductivity = Math.round(dailyStats.reduce((sum, d) => sum + d.productivity, 0) / dailyStats.length);

    return {
      habits: { completed: totalHabits, total: totalHabitsTarget },
      tasks: { completed: totalTasks, total: totalTasksTarget },
      exercises: { completed: totalExercises, total: totalExercisesTarget },
      productivity: avgProductivity,
    };
  }, [dailyStats]);

  const pieData = [
    { name: t('habits'), value: summary.habits.completed, color: 'hsl(var(--habit))' },
    { name: t('tasks'), value: summary.tasks.completed, color: 'hsl(var(--task))' },
    { name: t('fitness'), value: summary.exercises.completed, color: 'hsl(var(--fitness))' },
  ];

  const chartConfig = {
    habits: { label: t('habits'), color: 'hsl(var(--habit))' },
    tasks: { label: t('tasks'), color: 'hsl(var(--task))' },
    exercises: { label: t('fitness'), color: 'hsl(var(--fitness))' },
    productivity: { label: t('productivity'), color: 'hsl(var(--primary))' },
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod('7')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === '7'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t('week')}
        </button>
        <button
          onClick={() => setPeriod('30')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === '30'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t('month')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-habit/10 border border-habit/20"
        >
          <div className="text-2xl font-bold text-habit">{summary.habits.completed}</div>
          <div className="text-xs text-muted-foreground">{t('habits')}</div>
          <div className="text-xs text-habit/70">{summary.habits.total} {t('planned')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-task/10 border border-task/20"
        >
          <div className="text-2xl font-bold text-task">{summary.tasks.completed}</div>
          <div className="text-xs text-muted-foreground">{t('tasks')}</div>
          <div className="text-xs text-task/70">{summary.tasks.total} {t('planned')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-fitness/10 border border-fitness/20"
        >
          <div className="text-2xl font-bold text-fitness">{summary.exercises.completed}</div>
          <div className="text-xs text-muted-foreground">{t('exercises')}</div>
          <div className="text-xs text-fitness/70">{summary.exercises.total} {t('planned')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="text-2xl font-bold text-primary">{summary.productivity}%</div>
          <div className="text-xs text-muted-foreground">{t('productivity')}</div>
          <div className="text-xs text-primary/70">{t('average')}</div>
        </motion.div>
      </div>

      {/* Productivity Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
        transition={{ delay: 0.5 }}
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
              <Bar dataKey="exercises" fill="hsl(var(--fitness))" radius={[2, 2, 0, 0]} />
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
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-fitness" />
            <span className="text-xs text-muted-foreground">{t('fitness')}</span>
          </div>
        </div>
      </motion.div>

      {/* Distribution Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
