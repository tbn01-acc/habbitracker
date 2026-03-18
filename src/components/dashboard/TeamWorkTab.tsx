import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Zap, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';

export function TeamWorkTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team, activeSprint, sprintTasks, loading } = useTeam();

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
        Загрузка...
      </div>
    );
  }

  if (!team || !activeSprint) {
    return (
      <Card className="team-gradient-bg border-0">
        <CardContent className="p-6 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Нет активного спринта
          </p>
          <Button size="sm" onClick={() => navigate('/team')} variant="outline">
            <Users className="w-4 h-4 mr-1.5" />
            Перейти в команду
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalSP = activeSprint.total_sp_planned || 1;
  const completedSP = activeSprint.total_sp_completed || 0;
  const sprintProgress = Math.round((completedSP / totalSP) * 100);

  // User's tasks in this sprint
  const myTasks = sprintTasks.filter(t => t.assignee_id === user?.id);
  const myCompleted = myTasks.filter(t => t.status === 'done').length;
  const myTotal = myTasks.length;
  const myProgress = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Sprint Progress */}
      <Card className="team-gradient-bg border border-[hsl(var(--team-border))]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md team-accent-bg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white dark:text-[#1E1E1E]" />
              </div>
              <div>
                <p className="text-xs font-semibold team-accent-text">{activeSprint.title}</p>
                <p className="text-[10px] text-muted-foreground">{team.name}</p>
              </div>
            </div>
            <span className="text-xs font-bold team-amber-text">{completedSP}/{totalSP} SP</span>
          </div>
          <Progress value={sprintProgress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-1">
            Прогресс спринта: {sprintProgress}%
          </p>
        </CardContent>
      </Card>

      {/* My Tasks */}
      <Card className="border border-[hsl(var(--team-border))]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold">Мои задачи ({myCompleted}/{myTotal})</p>
            <span className="text-[10px] text-muted-foreground">{myProgress}%</span>
          </div>
          <Progress value={myProgress} className="h-1 mb-2" />

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {myTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Нет назначенных задач</p>
            ) : (
              myTasks.slice(0, 5).map((task, i) => (
                <motion.button
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate('/team')}
                  className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs truncate flex-1">{task.title}</span>
                  <span className="text-[10px] text-muted-foreground">{task.story_points} SP</span>
                </motion.button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Go to Team */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-xs"
        onClick={() => navigate('/team')}
      >
        Открыть командный интерфейс
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
