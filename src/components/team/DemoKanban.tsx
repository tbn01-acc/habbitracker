import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DemoData, DemoTask } from '@/lib/demo/testData';

const COLUMNS = [
  { key: 'backlog', label: 'Бэклог', color: 'hsl(var(--muted-foreground))' },
  { key: 'in_progress', label: 'В работе', color: 'hsl(var(--primary))' },
  { key: 'review', label: 'Проверка', color: 'hsl(45, 90%, 50%)' },
  { key: 'done', label: 'Готово', color: 'hsl(145, 70%, 45%)' },
] as const;

interface DemoKanbanProps {
  data: DemoData;
  onUpdateStatus: (taskId: string, newStatus: string) => void;
  isReadOnly?: boolean;
}

export function DemoKanban({ data, onUpdateStatus, isReadOnly }: DemoKanbanProps) {
  const [filterUser, setFilterUser] = useState<string>('all');

  const filtered = filterUser === 'all'
    ? data.tasks
    : filterUser === 'unassigned'
    ? data.tasks.filter(t => !t.user)
    : data.tasks.filter(t => t.user === filterUser);

  const uniqueUsers = [...new Set(data.tasks.map(t => t.user).filter(Boolean))] as string[];

  const handleMove = (taskId: string, currentStatus: string, direction: 'forward' | 'back') => {
    const colIdx = COLUMNS.findIndex(c => c.key === currentStatus);
    const newIdx = direction === 'forward' ? colIdx + 1 : colIdx - 1;
    if (newIdx >= 0 && newIdx < COLUMNS.length) {
      onUpdateStatus(taskId, COLUMNS[newIdx].key);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Все участники" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="unassigned">Без исполнителя</SelectItem>
            {uniqueUsers.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {filtered.length} из {data.tasks.length} задач
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter(t => t.status === col.key);
          const colSP = colTasks.reduce((sum, t) => sum + t.sp, 0);
          return (
            <div key={col.key} className="min-w-[260px] max-w-[300px] flex-shrink-0 snap-start">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-medium">{col.label}</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{colTasks.length}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{colSP} SP</span>
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
                      <Card className="border-border/50 bg-card/90 backdrop-blur hover:border-primary/30 transition-colors">
                        <CardContent className="p-3">
                          <p className="text-xs font-medium leading-tight mb-1.5">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                                <Zap className="w-3 h-3" />
                                {task.sp} SP
                              </div>
                              {task.user && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                  {task.user}
                                </span>
                              )}
                            </div>
                            {!isReadOnly && (
                              <div className="flex gap-0.5">
                                {col.key !== 'backlog' && (
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(task.id, col.key, 'back')}>
                                    <span className="text-[10px]">←</span>
                                  </Button>
                                )}
                                {col.key !== 'done' && (
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(task.id, col.key, 'forward')}>
                                    <span className="text-[10px]">→</span>
                                  </Button>
                                )}
                              </div>
                            )}
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
    </div>
  );
}
