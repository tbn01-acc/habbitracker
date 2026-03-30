import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, ChevronRight, Layers, Target, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string;
  projectsCount: number;
  progress: number;
}

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'paused';
  sprintsCount: number;
  tasksCount: number;
  progress: number;
}

interface Props {
  teamId: string;
  isOwner: boolean;
}

export function TeamWorkspaces({ teamId, isOwner }: Props) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<'workspace' | 'project'>('workspace');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Demo data for display
  const [workspaces] = useState<Workspace[]>([]);
  const [projects] = useState<Project[]>([]);

  const handleCreate = () => {
    if (!name.trim()) return;
    toast.success(isRu ? `${createType === 'workspace' ? 'Пространство' : 'Проект'} создан!` : `${createType === 'workspace' ? 'Workspace' : 'Project'} created!`);
    setCreateOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      {isOwner && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setCreateType('workspace'); setCreateOpen(true); }}
            className="flex-1"
          >
            <FolderKanban className="w-4 h-4 mr-1" />
            {isRu ? 'Пространство' : 'Workspace'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setCreateType('project'); setCreateOpen(true); }}
            className="flex-1"
          >
            <Layers className="w-4 h-4 mr-1" />
            {isRu ? 'Проект' : 'Project'}
          </Button>
        </div>
      )}

      {/* Workspaces list */}
      {workspaces.length > 0 ? (
        <div className="space-y-3">
          {workspaces.map((ws, i) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="cursor-pointer hover:border-primary/30 transition-all">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                    {ws.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ws.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ws.projectsCount} {isRu ? 'проектов' : 'projects'}</span>
                    </div>
                    <Progress value={ws.progress} className="h-1 mt-1" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              {isRu
                ? 'Создайте пространство для организации проектов'
                : 'Create a workspace to organize projects'}
            </p>
            {isOwner && (
              <Button size="sm" onClick={() => { setCreateType('workspace'); setCreateOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />
                {isRu ? 'Создать пространство' : 'Create Workspace'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {createType === 'workspace'
                ? (isRu ? 'Новое пространство' : 'New Workspace')
                : (isRu ? 'Новый проект' : 'New Project')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{isRu ? 'Название' : 'Name'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Описание' : 'Description'}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!name.trim()}>
              {isRu ? 'Создать' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
