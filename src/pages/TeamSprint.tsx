import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Target, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { DEMO_DATA } from '@/lib/demo/testData';
import { DemoBurndownChart } from '@/components/team/DemoBurndownChart';

export default function TeamSprint() {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const { team, activeSprint, sprintTasks } = useTeam();

  // Use real sprint if available, else demo
  const isDemo = !activeSprint || sprintId === DEMO_DATA.sprint.id;
  const demoSprint = DEMO_DATA.sprint;
  const sprint = isDemo ? demoSprint : activeSprint;
  const tasks = isDemo ? DEMO_DATA.tasks : sprintTasks as any[];
  const demoMembers = isDemo ? DEMO_DATA.members : [];

  if (!sprint) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <Zap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{isRu ? 'Спринт не найден' : 'Sprint not found'}</p>
          <Button onClick={() => navigate('/team')} className="mt-4">{isRu ? 'Назад' : 'Back'}</Button>
        </div>
      </div>
    );
  }

  const totalSP = isDemo ? demoSprint.totalSP : (tasks as any[]).reduce((s: number, t: any) => s + (t.story_points || t.sp || 0), 0);
  const completedSP = isDemo ? demoSprint.completedSP : (tasks as any[]).filter((t: any) => t.status === 'done').reduce((s: number, t: any) => s + (t.story_points || t.sp || 0), 0);
  const progress = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;
  const sprintDates = isDemo ? { start: demoSprint.startDate, end: demoSprint.endDate } : { start: (sprint as any)?.start_date, end: (sprint as any)?.end_date };

  const statusCounts = {
    backlog: (tasks as any[]).filter(t => t.status === 'backlog').length,
    in_progress: (tasks as any[]).filter(t => t.status === 'in_progress').length,
    review: (tasks as any[]).filter(t => t.status === 'review').length,
    done: (tasks as any[]).filter(t => t.status === 'done').length,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/team')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold">{sprint.title}</h1>
            </div>
            {sprint.goal && <p className="text-xs text-muted-foreground mt-0.5">{sprint.goal}</p>}
          </div>
        </div>

        {/* Progress */}
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{isRu ? 'Story Points' : 'Story Points'}</span>
              <Badge variant="outline">{completedSP}/{totalSP} SP</Badge>
            </div>
            <Progress value={progress} className="h-2.5 mb-3" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>📅 {sprintDates.start} — {sprintDates.end}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: isRu ? 'Бэклог' : 'Backlog', value: statusCounts.backlog, icon: <AlertCircle className="w-4 h-4 text-muted-foreground" /> },
            { label: isRu ? 'В работе' : 'In Progress', value: statusCounts.in_progress, icon: <Clock className="w-4 h-4 text-blue-500" /> },
            { label: isRu ? 'Ревью' : 'Review', value: statusCounts.review, icon: <Target className="w-4 h-4 text-amber-500" /> },
            { label: isRu ? 'Готово' : 'Done', value: statusCounts.done, icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-2.5 text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Burndown */}
        {isDemo && (
          <DemoBurndownChart data={DEMO_DATA} />
        )}

        {/* Task List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{isRu ? 'Задачи спринта' : 'Sprint Tasks'}</h2>
          {(tasks as any[]).map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{task.title}</p>
                {(task.user || task.assignee_id) && (
                  <p className="text-[10px] text-muted-foreground">{task.user || task.assignee_id}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px]">{task.sp || task.story_points || 0} SP</Badge>
              <Badge
                variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}
                className="text-[10px]"
              >
                {task.status}
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* Members in sprint */}
        {isDemo && demoMembers.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{isRu ? 'Участники' : 'Participants'}</h2>
            <div className="grid grid-cols-2 gap-2">
              {demoMembers.slice(0, 6).map((m) => (
                <Card key={m.id} className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/team/member/${m.id}`)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {m.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.sp} SP</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
