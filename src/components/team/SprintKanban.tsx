import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, User, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/contexts/LanguageContext';
import { SprintTask, TeamMember } from '@/hooks/useTeam';

interface SprintKanbanProps {
  tasks: SprintTask[];
  members: TeamMember[];
  onUpdateStatus: (taskId: string, status: string) => void;
  onAddTask: (data: {
    title: string;
    description?: string;
    story_points?: number;
    priority?: string;
    assignee_id?: string;
  }) => void;
}

const COLUMNS = [
  { key: 'backlog', labelRu: 'Бэклог', labelEn: 'Backlog', color: 'hsl(var(--muted-foreground))' },
  { key: 'in_progress', labelRu: 'В работе', labelEn: 'In Progress', color: 'hsl(var(--primary))' },
  { key: 'review', labelRu: 'Проверка', labelEn: 'Review', color: 'hsl(45, 90%, 50%)' },
  { key: 'done', labelRu: 'Готово', labelEn: 'Done', color: 'hsl(145, 70%, 45%)' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-red-500/20 text-red-400',
};

export function SprintKanban({ tasks, members, onUpdateStatus, onAddTask }: SprintKanbanProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    story_points: 1,
    priority: 'medium',
    assignee_id: '',
  });
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  const filteredTasks = filterAssignee === 'all'
    ? tasks
    : filterAssignee === 'unassigned'
    ? tasks.filter(t => !t.assignee_id)
    : tasks.filter(t => t.assignee_id === filterAssignee);

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    onAddTask({
      ...newTask,
      assignee_id: newTask.assignee_id || undefined,
    });
    setNewTask({ title: '', description: '', story_points: 1, priority: 'medium', assignee_id: '' });
    setAddDialogOpen(false);
  };

  const handleMoveTask = (taskId: string, currentStatus: string, direction: 'forward' | 'back') => {
    const colIndex = COLUMNS.findIndex(c => c.key === currentStatus);
    const newIndex = direction === 'forward' ? colIndex + 1 : colIndex - 1;
    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      onUpdateStatus(taskId, COLUMNS[newIndex].key);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder={isRu ? 'Все участники' : 'All members'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
            <SelectItem value="unassigned">{isRu ? 'Без исполнителя' : 'Unassigned'}</SelectItem>
            {members.map(m => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profile?.display_name || 'User'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setAddDialogOpen(true)} className="h-8">
          <Plus className="w-4 h-4 mr-1" />
          {isRu ? 'Задача' : 'Task'}
        </Button>
      </div>

      {/* Columns - mobile scrollable */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className="min-w-[260px] max-w-[300px] flex-shrink-0 snap-start"
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-medium">{isRu ? col.labelRu : col.labelEn}</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{colTasks.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                <AnimatePresence mode="popLayout">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="border-border/50 bg-card/90 backdrop-blur cursor-pointer hover:border-primary/30 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-xs font-medium leading-tight flex-1">{task.title}</p>
                            <Badge className={`text-[9px] h-4 px-1 ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority === 'high' ? '!' : task.priority === 'medium' ? '•' : '○'}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                                <Zap className="w-3 h-3" />
                                {task.story_points} SP
                              </div>
                              {task.assignee && (
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={task.assignee.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {(task.assignee.display_name || '?')[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            <div className="flex gap-0.5">
                              {col.key !== 'backlog' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveTask(task.id, col.key, 'back')}
                                >
                                  <span className="text-[10px]">←</span>
                                </Button>
                              )}
                              {col.key !== 'done' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveTask(task.id, col.key, 'forward')}
                                >
                                  <span className="text-[10px]">→</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Новая задача спринта' : 'New Sprint Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={isRu ? 'Название задачи' : 'Task title'}
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <Textarea
              placeholder={isRu ? 'Описание (необязательно)' : 'Description (optional)'}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Story Points</label>
                <Select
                  value={String(newTask.story_points)}
                  onValueChange={(v) => setNewTask({ ...newTask, story_points: Number(v) })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 8, 13].map(sp => (
                      <SelectItem key={sp} value={String(sp)}>{sp} SP</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isRu ? 'Приоритет' : 'Priority'}
                </label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isRu ? 'Низкий' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{isRu ? 'Средний' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{isRu ? 'Высокий' : 'High'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {isRu ? 'Исполнитель' : 'Assignee'}
              </label>
              <Select
                value={newTask.assignee_id}
                onValueChange={(v) => setNewTask({ ...newTask, assignee_id: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isRu ? 'Не назначен' : 'Unassigned'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{isRu ? 'Не назначен' : 'Unassigned'}</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.display_name || 'User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask} disabled={!newTask.title.trim()} className="w-full">
              {isRu ? 'Добавить задачу' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
