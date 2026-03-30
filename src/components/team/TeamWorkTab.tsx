import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTeam, SprintTask } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function TeamWorkTab() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { team, activeSprint, sprintTasks } = useTeam();

  if (!team || !user) return null;

  const myTasks = sprintTasks.filter(t => t.assignee_id === user.id);
  const myCompleted = myTasks.filter(t => t.status === 'done').length;
  const myTotal = myTasks.length;
  const myProgress = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

  const totalSP = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const completedSP = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points || 0), 0);
  const sprintProgress = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Sprint progress */}
      {activeSprint ? (
        <button
          onClick={() => navigate('/team')}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-[hsl(var(--task))]/10 to-[hsl(var(--task))]/5 border border-[hsl(var(--task))]/20 text-left group hover:border-[hsl(var(--task))]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold truncate">{activeSprint.title}</span>
            </div>
            <span className="text-xs text-muted-foreground">{completedSP}/{totalSP} SP</span>
          </div>
          <Progress value={sprintProgress} className="h-1.5" />
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Нет активного спринта' : 'No active sprint'}
          </p>
        </div>
      )}

      {/* My tasks */}
      {myTasks.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {isRu ? 'Мои задачи' : 'My tasks'} ({myCompleted}/{myTotal})
            </span>
            <span className="text-xs text-primary font-medium">{myProgress}%</span>
          </div>
          {myTasks.slice(0, 4).map((task, i) => (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate('/team')}
              className="w-full flex items-center gap-2 p-2 rounded-lg bg-card/80 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              {task.status === 'done' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn(
                "text-xs truncate flex-1",
                task.status === 'done' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
              {task.story_points > 0 && (
                <span className="text-[10px] text-muted-foreground">{task.story_points}SP</span>
              )}
              <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </motion.button>
          ))}
          {myTasks.length > 4 && (
            <button
              onClick={() => navigate('/team')}
              className="text-xs text-primary hover:underline w-full text-center py-1"
            >
              {isRu ? `Ещё ${myTasks.length - 4}...` : `${myTasks.length - 4} more...`}
            </button>
          )}
        </div>
      ) : activeSprint ? (
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Нет назначенных задач' : 'No assigned tasks'}
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}
