import { useState, useMemo } from 'react';
import { Zap, Target, CheckSquare, Wallet, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfDay, parseISO, isBefore, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OverdueItem {
  id: string;
  name: string;
  date: string;
  type: 'habit' | 'task' | 'transaction';
  amount?: number;
  transactionType?: 'income' | 'expense';
}

interface OverdueWidgetProps {
  overdueHabits: number;
  overdueTasks: number;
  overdueTransactions: number;
  // Extended props for quick edit
  habits?: Array<{
    id: string;
    name: string;
    targetDays: number[];
    completedDates: string[];
  }>;
  tasks?: Array<{
    id: string;
    name: string;
    dueDate: string;
    completed: boolean;
    status: string;
  }>;
  transactions?: Array<{
    id: string;
    name: string;
    date: string;
    completed: boolean;
    amount: number;
    type: 'income' | 'expense';
  }>;
  onCompleteHabit?: (id: string, date: string) => void;
  onCompleteTask?: (id: string) => void;
  onCompleteTransaction?: (id: string) => void;
}

export function OverdueWidget({ 
  overdueHabits, 
  overdueTasks, 
  overdueTransactions,
  habits = [],
  tasks = [],
  transactions = [],
  onCompleteHabit,
  onCompleteTask,
  onCompleteTransaction
}: OverdueWidgetProps) {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';
  const [isExpanded, setIsExpanded] = useState(false);
  const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());
  
  const total = overdueHabits + overdueTasks + overdueTransactions;
  
  // Calculate overdue items for the expanded view
  const overdueItems = useMemo(() => {
    const items: OverdueItem[] = [];
    const todayStart = startOfDay(new Date());
    
    // Overdue habits (not completed yesterday when scheduled)
    habits.forEach(h => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayDayOfWeek = yesterday.getDay();
      
      if (h.targetDays.includes(yesterdayDayOfWeek) && !h.completedDates.includes(yesterdayStr)) {
        items.push({
          id: h.id,
          name: h.name,
          date: yesterdayStr,
          type: 'habit'
        });
      }
    });

    // Overdue tasks
    tasks.forEach(t => {
      if (t.completed || t.status === 'done' || !t.dueDate) return;
      const dueDate = startOfDay(parseISO(t.dueDate));
      if (isBefore(dueDate, todayStart)) {
        items.push({
          id: t.id,
          name: t.name,
          date: t.dueDate,
          type: 'task'
        });
      }
    });

    // Overdue transactions
    transactions.forEach(t => {
      if (t.completed) return;
      const transDate = startOfDay(parseISO(t.date));
      if (isBefore(transDate, todayStart)) {
        items.push({
          id: t.id,
          name: t.name,
          date: t.date,
          type: 'transaction',
          amount: t.amount,
          transactionType: t.type
        });
      }
    });

    return items;
  }, [habits, tasks, transactions]);
  
  if (total === 0) return null;

  const handleComplete = async (item: OverdueItem) => {
    setCompletingItems(prev => new Set(prev).add(item.id));
    
    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (item.type === 'habit' && onCompleteHabit) {
      onCompleteHabit(item.id, item.date);
    } else if (item.type === 'task' && onCompleteTask) {
      onCompleteTask(item.id);
    } else if (item.type === 'transaction' && onCompleteTransaction) {
      onCompleteTransaction(item.id);
    }
    
    setCompletingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(item.id);
      return newSet;
    });
  };

  const formatItemDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'd MMM', { locale: isRussian ? ru : undefined });
  };

  const getTypeIcon = (type: 'habit' | 'task' | 'transaction') => {
    switch (type) {
      case 'habit': return <Target className="w-4 h-4 text-green-500" />;
      case 'task': return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case 'transaction': return <Wallet className="w-4 h-4 text-purple-500" />;
    }
  };

  const hasQuickEdit = onCompleteHabit || onCompleteTask || onCompleteTransaction;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {isRussian ? 'Просрочено' : 'Overdue'}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {total}
                  </Badge>
                </div>
                <div className="flex items-center gap-12 text-xs text-muted-foreground mt-1">
                  {overdueHabits > 0 && (
                    <button 
                      onClick={() => navigate('/habits')}
                      className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                    >
                      <Target className="w-6 h-6" />
                      <span className="font-medium text-sm">{overdueHabits}</span>
                    </button>
                  )}
                  {overdueTasks > 0 && (
                    <button 
                      onClick={() => navigate('/tasks')}
                      className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                    >
                      <CheckSquare className="w-6 h-6" />
                      <span className="font-medium text-sm">{overdueTasks}</span>
                    </button>
                  )}
                  {overdueTransactions > 0 && (
                    <button 
                      onClick={() => navigate('/finance')}
                      className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                    >
                      <Wallet className="w-6 h-6" />
                      <span className="font-medium text-sm">{overdueTransactions}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {hasQuickEdit && overdueItems.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Expanded quick edit list */}
          <AnimatePresence>
            {isExpanded && hasQuickEdit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-3 border-t border-amber-500/30 space-y-2 max-h-60 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {overdueItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 1, x: 0 }}
                        animate={{ 
                          opacity: completingItems.has(item.id) ? 0 : 1,
                          x: completingItems.has(item.id) ? 100 : 0,
                          scale: completingItems.has(item.id) ? 0.8 : 1
                        }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getTypeIcon(item.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.type === 'transaction' && item.amount
                                ? `${item.transactionType === 'income' ? '+' : '-'}${item.amount}₽ ${item.name}`
                                : item.name
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatItemDate(item.date)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => handleComplete(item)}
                          disabled={completingItems.has(item.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {overdueItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {isRussian ? 'Нет просроченных элементов' : 'No overdue items'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
