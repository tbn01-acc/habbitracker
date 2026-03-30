import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { DEMO_DATA } from '@/lib/demo/testData';

export default function TeamWorkspace() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const { team } = useTeam();

  // Try real data first, fallback to demo
  const demoWs = DEMO_DATA.workspaces.find(w => w.id === workspaceId);
  const workspace = demoWs;

  if (!workspace) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{isRu ? 'Пространство не найдено' : 'Workspace not found'}</p>
          <Button onClick={() => navigate('/team')} className="mt-4">{isRu ? 'Назад' : 'Back'}</Button>
        </div>
      </div>
    );
  }

  const totalTasks = workspace.projects.reduce((s, p) => s + p.tasksCount, 0);
  const completedTasks = workspace.projects.reduce((s, p) => s + p.completedTasks, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/team')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl">{workspace.icon}</span>
            <div>
              <h1 className="text-xl font-bold">{workspace.name}</h1>
              {workspace.description && (
                <p className="text-xs text-muted-foreground">{workspace.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{isRu ? 'Общий прогресс' : 'Overall Progress'}</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 mb-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{workspace.projects.length} {isRu ? 'проектов' : 'projects'}</span>
              <span>{completedTasks}/{totalTasks} {isRu ? 'задач' : 'tasks'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{isRu ? 'Проекты' : 'Projects'}</h2>
          {workspace.projects.map((proj, i) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/team/project/${proj.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{proj.name}</span>
                    <Badge variant={proj.status === 'completed' ? 'default' : proj.status === 'paused' ? 'secondary' : 'outline'} className="text-[10px]">
                      {proj.status === 'active' ? (isRu ? 'Активен' : 'Active') : proj.status === 'completed' ? (isRu ? 'Завершён' : 'Done') : (isRu ? 'Пауза' : 'Paused')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={proj.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{proj.completedTasks}/{proj.tasksCount}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
