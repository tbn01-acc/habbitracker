import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, CheckSquare, Clock, DollarSign, TrendingUp, 
  AlertTriangle, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalWithStats } from '@/types/goal';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface GoalsOverviewProgressProps {
  goals: GoalWithStats[];
  isRussian: boolean;
}

export function GoalsOverviewProgress({ goals, isRussian }: GoalsOverviewProgressProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);

  // Fetch all tasks and habits for active goals
  useEffect(() => {
    const fetchData = async () => {
      const goalIds = goals.filter(g => g.status === 'active').map(g => g.id);
      if (goalIds.length === 0) return;

      const [tasksRes, habitsRes] = await Promise.all([
        supabase.from('tasks').select('*').in('goal_id', goalIds).is('archived_at', null),
        supabase.from('habits').select('*').in('goal_id', goalIds).is('archived_at', null),
      ]);

      setTasks(tasksRes.data || []);
      setHabits(habitsRes.data || []);
    };

    fetchData();
  }, [goals]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length === 0) return 0;
    
    const totalTasks = activeGoals.reduce((sum, g) => sum + g.tasks_count, 0);
    const completedTasks = activeGoals.reduce((sum, g) => sum + g.tasks_completed, 0);
    
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [goals]);

  // Total resources
  const totalResources = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    return {
      spent: activeGoals.reduce((sum, g) => sum + (g.total_spent || 0), 0),
      budget: activeGoals.reduce((sum, g) => sum + (g.budget_goal || 0), 0),
      timeMinutes: activeGoals.reduce((sum, g) => sum + (g.total_time_minutes || 0), 0),
      timeGoal: activeGoals.reduce((sum, g) => sum + (g.time_goal_minutes || 0), 0),
    };
  }, [goals]);

  // Upcoming tasks
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

  // Active habits
  const activeHabits = useMemo(() => habits.slice(0, 5), [habits]);

  // Health status per goal
  const goalHealthStatuses = useMemo(() => {
    return goals
      .filter(g => g.status === 'active')
      .map(g => {
        let status: 'green' | 'yellow' | 'red' = 'green';
        
        if (g.target_date) {
          const daysRemaining = differenceInDays(parseISO(g.target_date), new Date());
          const tasksRemaining = g.tasks_count - g.tasks_completed;
          
          if (daysRemaining < 0) status = 'red';
          else if (tasksRemaining > 0) {
            const tasksPerDay = tasksRemaining / Math.max(daysRemaining, 1);
            if (tasksPerDay > 3) status = 'red';
            else if (tasksPerDay > 1.5) status = 'yellow';
          }
        }
        
        return { ...g, health: status };
      });
  }, [goals]);

  const healthColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

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
                <Badge variant="secondary">
                  {goals.filter(g => g.status === 'active').length} {isRussian ? 'целей' : 'goals'}
                </Badge>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resources Summary */}
      <div className="grid grid-cols-2 gap-3">
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
                {totalResources.spent.toLocaleString()}₽
              </p>
              {totalResources.budget > 0 && (
                <>
                  <Progress 
                    value={Math.min((totalResources.spent / totalResources.budget) * 100, 100)} 
                    className="h-1.5 mt-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRussian ? 'из' : 'of'} {totalResources.budget.toLocaleString()}₽
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                {Math.round(totalResources.timeMinutes / 60)}{isRussian ? 'ч' : 'h'}
              </p>
              {totalResources.timeGoal > 0 && (
                <>
                  <Progress 
                    value={Math.min((totalResources.timeMinutes / totalResources.timeGoal) * 100, 100)} 
                    className="h-1.5 mt-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRussian ? 'из' : 'of'} {Math.round(totalResources.timeGoal / 60)}{isRussian ? 'ч' : 'h'}
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
              {isRussian ? 'Ближайшие шаги' : 'Upcoming Steps'}
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
                        {format(parseISO(task.due_date), 'd MMM', { locale: isRussian ? ru : enUS })}
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

      {/* Goal Health Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {isRussian ? 'Здоровье целей' : 'Goals Health'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goalHealthStatuses.map((goal) => (
                <div 
                  key={goal.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg border-l-4 bg-muted/30 ${
                    goal.health === 'green' ? 'border-l-green-500' :
                    goal.health === 'yellow' ? 'border-l-yellow-500' : 'border-l-red-500'
                  }`}
                >
                  <span className="text-lg">{goal.icon}</span>
                  <span className="text-sm flex-1 truncate">{goal.name}</span>
                  <Badge className={healthColors[goal.health]} variant="secondary">
                    {goal.health === 'green' 
                      ? (isRussian ? 'В норме' : 'On Track')
                      : goal.health === 'yellow'
                      ? (isRussian ? 'Внимание' : 'At Risk')
                      : (isRussian ? 'Критично' : 'Critical')
                    }
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
