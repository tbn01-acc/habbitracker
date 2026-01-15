import { useState, useMemo, useRef } from 'react';
import { Zap, Target, CheckSquare, Wallet, ChevronDown, ChevronUp, Check, Archive, Trash2, ArrowRightFromLine, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { startOfDay, parseISO, isBefore, format, addDays, addWeeks } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onPostponeTask?: (id: string, newDate: string) => void;
  onArchiveTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onPostponeHabit?: (id: string, days: number) => void;
  onArchiveHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => void;
}

// Swipeable item component
function SwipeableItem({ 
  item, 
  onComplete, 
  onPostpone, 
  onArchive, 
  onDelete,
  formatDate,
  getTypeIcon,
  isRussian
}: {
  item: OverdueItem;
  onComplete: () => void;
  onPostpone?: (days: number) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  formatDate: (date: string) => string;
  getTypeIcon: (type: 'habit' | 'task' | 'transaction') => React.ReactNode;
  isRussian: boolean;
}) {
  const x = useMotionValue(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showPostponeMenu, setShowPostponeMenu] = useState(false);

  const leftActionsOpacity = useTransform(x, [0, 80], [0, 1]);
  const rightActionsOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      setSwipeDirection('right');
    } else if (info.offset.x < -threshold) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Left actions (Complete, Postpone) - shown on swipe right */}
        <motion.div 
          className="absolute inset-y-0 left-0 flex items-center gap-3 px-4"
          style={{ opacity: leftActionsOpacity }}
        >
          <button
            className="text-green-500 hover:text-green-400 transition-colors"
            onClick={onComplete}
            title={isRussian ? 'Готово' : 'Done'}
          >
            <Check className="w-5 h-5" />
          </button>
          {onPostpone && (
            <DropdownMenu open={showPostponeMenu} onOpenChange={setShowPostponeMenu}>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                  title={isRussian ? 'Отложить' : 'Postpone'}
                >
                  <ArrowRightFromLine className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => onPostpone(1)}>
                  {isRussian ? 'На 1 день' : 'For 1 day'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPostpone(3)}>
                  {isRussian ? 'На 3 дня' : 'For 3 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPostpone(7)}>
                  {isRussian ? 'На неделю' : 'For a week'}
                </DropdownMenuItem>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {isRussian ? 'Перенос не ухудшает статистику' : 'Postponing does not affect stats'}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>

        {/* Right actions (Archive, Delete) - shown on swipe left */}
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center gap-3 px-4"
          style={{ opacity: rightActionsOpacity }}
        >
          {onArchive && (
            <button
              className="text-amber-500 hover:text-amber-400 transition-colors"
              onClick={() => setShowArchiveConfirm(true)}
              title={isRussian ? 'В архив' : 'Archive'}
            >
              <Archive className="w-5 h-5" />
            </button>
          )}
          {onDelete && (
            <button
              className="text-red-500 hover:text-red-400 transition-colors"
              onClick={() => setShowDeleteConfirm(true)}
              title={isRussian ? 'Удалить' : 'Delete'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </motion.div>

        {/* Main content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="flex items-center justify-between p-3 bg-background/80 cursor-grab active:cursor-grabbing"
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
                {formatDate(item.date)}
              </p>
            </div>
          </div>
          
          {/* Actions visible when swiped - only icons */}
          <AnimatePresence>
            {swipeDirection === 'right' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-4"
              >
                <button
                  className="text-green-500 hover:text-green-400 transition-colors"
                  onClick={onComplete}
                  title={isRussian ? 'Готово' : 'Done'}
                >
                  <Check className="w-5 h-5" />
                </button>
                {onPostpone && (
                  <DropdownMenu open={showPostponeMenu} onOpenChange={setShowPostponeMenu}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                        title={isRussian ? 'Отложить' : 'Postpone'}
                      >
                        <ArrowRightFromLine className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onPostpone(1)}>
                        {isRussian ? 'На 1 день' : 'For 1 day'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPostpone(3)}>
                        {isRussian ? 'На 3 дня' : 'For 3 days'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPostpone(7)}>
                        {isRussian ? 'На неделю' : 'For a week'}
                      </DropdownMenuItem>
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {isRussian ? 'Перенос не ухудшает статистику' : 'Postponing does not affect stats'}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            )}
            {swipeDirection === 'left' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-4"
              >
                {onArchive && (
                  <button
                    className="text-amber-500 hover:text-amber-400 transition-colors"
                    onClick={() => setShowArchiveConfirm(true)}
                    title={isRussian ? 'В архив' : 'Archive'}
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="text-red-500 hover:text-red-400 transition-colors"
                    onClick={() => setShowDeleteConfirm(true)}
                    title={isRussian ? 'Удалить' : 'Delete'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {isRussian ? 'Удалить навсегда?' : 'Delete permanently?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Это действие нельзя отменить. Элемент будет удалён без возможности восстановления.'
                : 'This action cannot be undone. The item will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRussian ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
              }}
            >
              {isRussian ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRussian ? 'Переместить в архив?' : 'Move to archive?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Элемент будет перемещён в архив. Вы сможете восстановить его позже.'
                : 'The item will be moved to archive. You can restore it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRussian ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onArchive?.();
              setShowArchiveConfirm(false);
            }}>
              {isRussian ? 'В архив' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
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
  onCompleteTransaction,
  onPostponeTask,
  onArchiveTask,
  onDeleteTask,
  onPostponeHabit,
  onArchiveHabit,
  onDeleteHabit
}: OverdueWidgetProps) {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const handleComplete = (item: OverdueItem) => {
    if (item.type === 'habit' && onCompleteHabit) {
      onCompleteHabit(item.id, item.date);
    } else if (item.type === 'task' && onCompleteTask) {
      onCompleteTask(item.id);
    } else if (item.type === 'transaction' && onCompleteTransaction) {
      onCompleteTransaction(item.id);
    }
  };

  const handlePostpone = (item: OverdueItem, days: number) => {
    if (item.type === 'task' && onPostponeTask) {
      const newDate = addDays(new Date(), days).toISOString().split('T')[0];
      onPostponeTask(item.id, newDate);
    } else if (item.type === 'habit' && onPostponeHabit) {
      onPostponeHabit(item.id, days);
    }
  };

  const handleArchive = (item: OverdueItem) => {
    if (item.type === 'task' && onArchiveTask) {
      onArchiveTask(item.id);
    } else if (item.type === 'habit' && onArchiveHabit) {
      onArchiveHabit(item.id);
    }
  };

  const handleDelete = (item: OverdueItem) => {
    if (item.type === 'task' && onDeleteTask) {
      onDeleteTask(item.id);
    } else if (item.type === 'habit' && onDeleteHabit) {
      onDeleteHabit(item.id);
    }
  };

  const hasQuickEdit = onCompleteHabit || onCompleteTask || onCompleteTransaction;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="-mx-4 -mt-6 mb-4"
    >
      {/* Header bar - full width, single line, no rounded corners, pressed to header */}
      <div className="bg-amber-500/10 border-b border-amber-500/30">
        <div 
          className="flex items-center justify-between px-4 py-2 cursor-pointer"
          onClick={() => hasQuickEdit && overdueItems.length > 0 && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-amber-500">
              {isRussian ? 'Просрочено' : 'Overdue'}
            </span>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
              {total}
            </Badge>
          </div>
          
          {hasQuickEdit && overdueItems.length > 0 && (
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-amber-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-500" />
              )}
            </div>
          )}
        </div>

        {/* Expanded list with swipe actions */}
        <AnimatePresence>
          {isExpanded && hasQuickEdit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-amber-500/30 max-h-80 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {overdueItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 100, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-amber-500/20 last:border-b-0"
                    >
                      <SwipeableItem
                        item={item}
                        onComplete={() => handleComplete(item)}
                        onPostpone={item.type !== 'transaction' ? (days) => handlePostpone(item, days) : undefined}
                        onArchive={item.type !== 'transaction' ? () => handleArchive(item) : undefined}
                        onDelete={item.type !== 'transaction' ? () => handleDelete(item) : undefined}
                        formatDate={formatItemDate}
                        getTypeIcon={getTypeIcon}
                        isRussian={isRussian}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {overdueItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRussian ? 'Нет просроченных элементов' : 'No overdue items'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
