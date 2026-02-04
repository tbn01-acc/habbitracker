import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, CheckSquare, Clock, DollarSign, TrendingUp, 
  AlertTriangle, CheckCircle2, AlertCircle, Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalWithStats } from '@/types/goal';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface GoalProgressTabProps {
  goal: GoalWithStats;
  tasks: { id: string; name: string; icon?: string; completed: boolean; due_date?: string; priority?: string }[];
  habits: { id: string; name: string; icon?: string; completed_dates: string[]; streak?: number }[];
  isRussian: boolean;
}

export function GoalProgressTab({ goal, tasks, habits, isRussian }: GoalProgressTabProps) {
  const locale = isRussian ? ru : enUS;
  
  // Calculate overall progress based on actual task data
  const overallProgress = useMemo(() => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return goal.progress_percent || 0;
    const completedTasks = tasks.filter(t => t.completed).length;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [tasks, goal.progress_percent]);

  // Calculate actual counts from data
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    return { total, completed };
  }, [tasks]);

  const habitStats = useMemo(() => {
    const total = habits.length;
    const totalCompletions = habits.reduce((sum, h) => sum + (h.completed_dates?.length || 0), 0);
    return { total, totalCompletions };
  }, [habits]);

  // Calculate health status
  const healthStatus = useMemo(() => {
    if (!goal.target_date) return 'green';
    
    const targetDate = parseISO(goal.target_date);
    const daysRemaining = differenceInDays(targetDate, new Date());
    const tasksRemaining = taskStats.total - taskStats.completed;
    
    if (daysRemaining < 0) return 'red'; // Overdue
    if (tasksRemaining === 0) return 'green'; // All done
    
    const tasksPerDay = tasksRemaining / Math.max(daysRemaining, 1);
    
    if (tasksPerDay > 3) return 'red'; // Too many tasks per day
    if (tasksPerDay > 1.5) return 'yellow'; // Challenging pace
    return 'green'; // On track
  }, [goal.target_date, taskStats]);

  // Get upcoming tasks - nearest 5 active tasks
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        // Sort by priority first (high priority first)
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        // Then by due date
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  // Get active habits
  const activeHabits = useMemo(() => {
    return habits
      .sort((a, b) => (b.streak || 0) - (a.streak || 0))
      .slice(0, 5);
  }, [habits]);

  // Budget usage with efficiency
  const budgetUsage = useMemo(() => {
    if (!goal.budget_goal) return null;
    const spent = goal.total_spent || 0;
    const percent = Math.round((spent / goal.budget_goal) * 100);
    const remaining = goal.budget_goal - spent;
    const efficiency = remaining >= 0 ? Math.round((remaining / goal.budget_goal) * 100) : -Math.round((-remaining / goal.budget_goal) * 100);
    return { 
      spent, 
      goal: goal.budget_goal, 
      percent,
      remaining,
      efficiency,
      isEfficient: spent <= goal.budget_goal
    };
  }, [goal.budget_goal, goal.total_spent]);

  // Time usage with efficiency
  const timeUsage = useMemo(() => {
    if (!goal.time_goal_minutes) return null;
    const spent = goal.total_time_minutes || 0;
    const percent = Math.round((spent / goal.time_goal_minutes) * 100);
    const efficiency = Math.round((spent / goal.time_goal_minutes) * 100);
    return { 
      spent, 
      goal: goal.time_goal_minutes, 
      percent,
      efficiency,
      isEfficient: efficiency >= 80 && efficiency <= 120 // Within 20% of target
    };
  }, [goal.time_goal_minutes, goal.total_time_minutes]);

  const healthColors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const healthLabels: Record<string, string> = {
    green: isRussian ? 'В норме' : 'On Track',
    yellow: isRussian ? 'Внимание' : 'At Risk',
    red: isRussian ? 'Критично' : 'Critical',
  };

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {isRussian ? 'Общий прогресс' : 'Overall Progress'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{overallProgress}%</span>
                <Badge className={healthColors[healthStatus]} variant="secondary">
                  {healthLabels[healthStatus]}
                </Badge>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{taskStats.completed} / {taskStats.total} {isRussian ? 'задач' : 'tasks'}</span>
                {goal.target_date && (
                  <span>
                    {isRussian ? 'До' : 'Due'}: {format(parseISO(goal.target_date), 'd MMM yyyy', { locale })}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resources Summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Budget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-chart-2" />
                <span className="text-sm font-medium">{isRussian ? 'Бюджет' : 'Budget'}</span>
              </div>
              <p className="text-2xl font-bold">
                {budgetUsage ? budgetUsage.spent.toLocaleString() : (goal.total_spent?.toLocaleString() || 0)}₽
              </p>
              {budgetUsage && (
                <>
                  <Progress value={Math.min(budgetUsage.percent, 100)} className="h-1.5 mt-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{isRussian ? 'из' : 'of'} {budgetUsage.goal.toLocaleString()}₽</span>
                    <span className={budgetUsage.isEfficient ? 'text-chart-2' : 'text-destructive'}>
                      {budgetUsage.efficiency >= 0 ? '+' : ''}{budgetUsage.efficiency}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{isRussian ? 'Время' : 'Time'}</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round((goal.total_time_minutes || 0) / 60)}{isRussian ? 'ч' : 'h'}
              </p>
              {timeUsage && (
                <>
                  <Progress value={Math.min(timeUsage.percent, 100)} className="h-1.5 mt-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{isRussian ? 'из' : 'of'} {Math.round(timeUsage.goal / 60)}{isRussian ? 'ч' : 'h'}</span>
                    <span className={timeUsage.isEfficient ? 'text-chart-2' : 'text-chart-4'}>
                      {timeUsage.efficiency}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Tasks - Nearest 5 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              {isRussian ? 'Ближайшие задачи' : 'Upcoming Tasks'}
              <Badge variant="outline" className="ml-auto text-xs">{upcomingTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                {isRussian ? 'Все задачи выполнены!' : 'All tasks completed!'}
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{task.icon || '📋'}</span>
                    <span className="text-sm flex-1 truncate">{task.name}</span>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(task.due_date), 'd MMM', { locale })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Habits */}
      {activeHabits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                {isRussian ? 'Активные привычки' : 'Active Habits'}
                <Badge variant="outline" className="ml-auto text-xs">{activeHabits.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{habit.icon || '🎯'}</span>
                    <span className="text-sm flex-1 truncate">{habit.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {habit.completed_dates?.length || 0} {isRussian ? 'дней' : 'days'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Health Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className={`border-l-4 ${
          healthStatus === 'green' ? 'border-l-chart-2' :
          healthStatus === 'yellow' ? 'border-l-chart-4' : 'border-l-destructive'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {healthStatus === 'green' ? (
                <CheckCircle2 className="w-5 h-5 text-chart-2 mt-0.5" />
              ) : healthStatus === 'yellow' ? (
                <AlertCircle className="w-5 h-5 text-chart-4 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {isRussian ? 'Здоровье цели' : 'Goal Health'}: {healthLabels[healthStatus]}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {healthStatus === 'green' && (isRussian 
                    ? 'Вы идёте в хорошем темпе к достижению цели.'
                    : 'You are on track to achieve your goal.'
                  )}
                  {healthStatus === 'yellow' && (isRussian 
                    ? 'Темп выполнения задач требует внимания. Рекомендуем ускориться.'
                    : 'Task completion pace needs attention. Consider speeding up.'
                  )}
                  {healthStatus === 'red' && (isRussian 
                    ? 'Критический темп! Необходимо срочно ускориться или пересмотреть дедлайн.'
                    : 'Critical pace! Need to speed up urgently or reconsider deadline.'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
