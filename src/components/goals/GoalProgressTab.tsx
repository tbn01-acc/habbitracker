import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, CheckSquare, Clock, DollarSign, TrendingUp, 
  AlertTriangle, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalWithStats } from '@/types/goal';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface GoalProgressTabProps {
  goal: GoalWithStats;
  tasks: { id: string; name: string; completed: boolean; due_date?: string }[];
  habits: { id: string; name: string; completed_dates: string[] }[];
  isRussian: boolean;
}

export function GoalProgressTab({ goal, tasks, habits, isRussian }: GoalProgressTabProps) {
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (goal.tasks_count === 0) return goal.progress_percent || 0;
    return Math.round((goal.tasks_completed / goal.tasks_count) * 100);
  }, [goal]);

  // Calculate health status
  const healthStatus = useMemo(() => {
    if (!goal.target_date) return 'green';
    
    const targetDate = parseISO(goal.target_date);
    const daysRemaining = differenceInDays(targetDate, new Date());
    const tasksRemaining = goal.tasks_count - goal.tasks_completed;
    
    if (daysRemaining < 0) return 'red'; // Overdue
    if (tasksRemaining === 0) return 'green'; // All done
    
    const tasksPerDay = tasksRemaining / Math.max(daysRemaining, 1);
    
    if (tasksPerDay > 3) return 'red'; // Too many tasks per day
    if (tasksPerDay > 1.5) return 'yellow'; // Challenging pace
    return 'green'; // On track
  }, [goal]);

  // Get upcoming tasks
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  // Get active habits (completed recently)
  const activeHabits = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return habits.slice(0, 5);
  }, [habits]);

  // Budget usage
  const budgetUsage = useMemo(() => {
    if (!goal.budget_goal) return null;
    const percent = Math.round((goal.total_spent / goal.budget_goal) * 100);
    return { spent: goal.total_spent, goal: goal.budget_goal, percent };
  }, [goal]);

  // Time usage
  const timeUsage = useMemo(() => {
    if (!goal.time_goal_minutes) return null;
    const percent = Math.round((goal.total_time_minutes / goal.time_goal_minutes) * 100);
    return { spent: goal.total_time_minutes, goal: goal.time_goal_minutes, percent };
  }, [goal]);

  const healthColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const healthLabels = {
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
                <span>{goal.tasks_completed} / {goal.tasks_count} {isRussian ? 'задач' : 'tasks'}</span>
                {goal.target_date && (
                  <span>
                    {isRussian ? 'До' : 'Due'}: {format(parseISO(goal.target_date), 'd MMM yyyy', { locale: ru })}
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
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">{isRussian ? 'Бюджет' : 'Budget'}</span>
              </div>
              <p className="text-2xl font-bold">
                {goal.total_spent.toLocaleString()}₽
              </p>
              {budgetUsage && (
                <>
                  <Progress value={Math.min(budgetUsage.percent, 100)} className="h-1.5 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRussian ? 'из' : 'of'} {budgetUsage.goal.toLocaleString()}₽
                  </p>
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
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{isRussian ? 'Время' : 'Time'}</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round(goal.total_time_minutes / 60)}{isRussian ? 'ч' : 'h'}
              </p>
              {timeUsage && (
                <>
                  <Progress value={Math.min(timeUsage.percent, 100)} className="h-1.5 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRussian ? 'из' : 'of'} {Math.round(timeUsage.goal / 60)}{isRussian ? 'ч' : 'h'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Tasks */}
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                {isRussian ? 'Все задачи выполнены!' : 'All tasks completed!'}
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{task.name}</span>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(task.due_date), 'd MMM', { locale: ru })}
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm flex-1 truncate">{habit.name}</span>
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
          healthStatus === 'green' ? 'border-l-green-500' :
          healthStatus === 'yellow' ? 'border-l-yellow-500' : 'border-l-red-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {healthStatus === 'green' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : healthStatus === 'yellow' ? (
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
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
