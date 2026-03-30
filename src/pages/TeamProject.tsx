import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, CheckCircle2, Clock, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { DEMO_DATA } from '@/lib/demo/testData';

export default function TeamProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';

  // Find project across all workspaces
  let project: any = null;
  let workspace: any = null;
  for (const ws of DEMO_DATA.workspaces) {
    const found = ws.projects.find(p => p.id === projectId);
    if (found) { project = found; workspace = ws; break; }
  }

  // Get tasks associated with this project (demo — distribute tasks by project)
  const allTasks = DEMO_DATA.tasks;
  const allProjects = DEMO_DATA.workspaces.flatMap(w => w.projects as any[]);
  const projectIndex = allProjects.findIndex((p: any) => p.id === projectId);
  const tasksPerProject = Math.ceil(allTasks.length / allProjects.length);
  const projectTasks = allTasks.slice(projectIndex * tasksPerProject, (projectIndex + 1) * tasksPerProject);

  if (!project) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{isRu ? 'Проект не найден' : 'Project not found'}</p>
          <Button onClick={() => navigate('/team')} className="mt-4">{isRu ? 'Назад' : 'Back'}</Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    backlog: { label: isRu ? 'Бэклог' : 'Backlog', color: 'text-muted-foreground' },
    in_progress: { label: isRu ? 'В работе' : 'In Progress', color: 'text-blue-500' },
    review: { label: isRu ? 'Ревью' : 'Review', color: 'text-amber-500' },
    done: { label: isRu ? 'Готово' : 'Done', color: 'text-green-500' },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => workspace ? navigate(`/team/workspace/${workspace.id}`) : navigate('/team')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{project.name}</h1>
            {workspace && (
              <p className="text-xs text-muted-foreground">{workspace.icon} {workspace.name}</p>
            )}
          </div>
          <Badge variant={project.status === 'completed' ? 'default' : project.status === 'paused' ? 'secondary' : 'outline'}>
            {project.status === 'active' ? (isRu ? 'Активен' : 'Active') : project.status === 'completed' ? (isRu ? 'Завершён' : 'Done') : (isRu ? 'Пауза' : 'Paused')}
          </Badge>
        </div>

        {/* Progress */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{isRu ? 'Прогресс' : 'Progress'}</span>
              <span className="text-sm font-bold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2 mb-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{project.completedTasks}/{project.tasksCount} {isRu ? 'задач' : 'tasks'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Clock className="w-4 h-4 text-blue-500" />, label: isRu ? 'В работе' : 'Active', value: projectTasks.filter(t => t.status === 'in_progress').length },
            { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, label: isRu ? 'Готово' : 'Done', value: projectTasks.filter(t => t.status === 'done').length },
            { icon: <Pause className="w-4 h-4 text-muted-foreground" />, label: isRu ? 'Бэклог' : 'Backlog', value: projectTasks.filter(t => t.status === 'backlog').length },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{isRu ? 'Задачи' : 'Tasks'}</h2>
          {projectTasks.map((task, i) => {
            const sc = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.backlog;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  {task.user && <p className="text-[10px] text-muted-foreground">{task.user}</p>}
                </div>
                <Badge variant="outline" className="text-[10px]">{task.sp} SP</Badge>
                <span className={`text-[10px] font-medium ${sc.color}`}>{sc.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
