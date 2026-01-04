import { CheckSquare, Repeat, Wallet } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { FinanceTransaction } from '@/types/finance';
import { UserTag } from '@/hooks/useUserTags';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TagItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: UserTag | null | undefined;
  tasks: Task[];
  habits: Habit[];
  transactions: FinanceTransaction[];
}

export function TagItemsDialog({ open, onOpenChange, tag, tasks, habits, transactions }: TagItemsDialogProps) {
  const { t } = useTranslation();

  if (!tag) return null;

  const hasItems = tasks.length > 0 || habits.length > 0 || transactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {t('itemsWithTag')}: {tag.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {!hasItems ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noTagsFound')}
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {/* Tasks */}
              {tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-task" />
                    <span className="font-medium text-sm">{t('tasksLabel')} ({tasks.length})</span>
                  </div>
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <Card key={task.id} className="bg-task/5 border-task/20">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{task.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.dueDate}
                              </p>
                            </div>
                            <Badge variant={task.completed ? 'secondary' : 'outline'} className="text-xs">
                              {task.status === 'done' ? t('statusDone') : task.status === 'in_progress' ? t('statusInProgress') : t('statusNotStarted')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Habits */}
              {habits.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="w-4 h-4 text-habit" />
                    <span className="font-medium text-sm">{t('habitsLabel')} ({habits.length})</span>
                  </div>
                  <div className="space-y-2">
                    {habits.map(habit => (
                      <Card key={habit.id} className="bg-habit/5 border-habit/20">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{habit.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{habit.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t('streak')}: {habit.streak} {t('days')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              {transactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-finance" />
                    <span className="font-medium text-sm">{t('operationsLabel')} ({transactions.length})</span>
                  </div>
                  <div className="space-y-2">
                    {transactions.map(tr => (
                      <Card key={tr.id} className="bg-finance/5 border-finance/20">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{tr.name}</p>
                              <p className="text-xs text-muted-foreground">{tr.date}</p>
                            </div>
                            <span className={`font-semibold ${tr.type === 'income' ? 'text-habit' : 'text-destructive'}`}>
                              {tr.type === 'income' ? '+' : '-'}{tr.amount.toLocaleString()} ₽
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
