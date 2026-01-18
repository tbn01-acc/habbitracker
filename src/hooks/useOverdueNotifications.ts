import { useEffect, useRef, useMemo } from 'react';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { FinanceTransaction } from '@/types/finance';
import { toast } from 'sonner';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';

const NOTIFICATION_KEY = 'overdueNotifiedToday';

interface OverdueNotificationData {
  tasks?: Task[];
  habits?: Habit[];
  transactions?: FinanceTransaction[];
}

// Create stable keys to prevent re-renders
function createStableKey(items: { id: string; completed?: boolean; status?: string }[]): string {
  return items.map(i => `${i.id}:${i.completed}:${i.status || ''}`).join('|');
}

export function useOverdueNotifications(data: OverdueNotificationData) {
  const hasNotifiedRef = useRef(false);
  const { tasks = [], habits = [], transactions = [] } = data;
  
  // Create stable keys to avoid infinite loops
  const tasksKey = useMemo(() => createStableKey(tasks), [tasks]);
  const habitsKey = useMemo(() => createStableKey(habits.map(h => ({ id: h.id, completed: h.completedDates.length > 0 }))), [habits]);
  const transactionsKey = useMemo(() => createStableKey(transactions), [transactions]);

  useEffect(() => {
    if (hasNotifiedRef.current) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastNotified = localStorage.getItem(NOTIFICATION_KEY);
    
    if (lastNotified === todayStr) {
      hasNotifiedRef.current = true;
      return;
    }

    const today = startOfDay(new Date());
    const todayDayOfWeek = new Date().getDay();

    // Find overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed || task.status === 'done') return false;
      const dueDate = startOfDay(parseISO(task.dueDate));
      return isBefore(dueDate, today);
    });

    // Find habits not completed today that should be
    const overdueHabits = habits.filter(habit => {
      if (!habit.targetDays.includes(todayDayOfWeek)) return false;
      const completedToday = habit.completedDates.some(
        date => format(new Date(date), 'yyyy-MM-dd') === todayStr
      );
      return !completedToday;
    });

    // Find overdue transactions (planned but not completed)
    const overdueTransactions = transactions.filter(tx => {
      if (tx.completed) return false;
      const txDate = startOfDay(parseISO(tx.date));
      return isBefore(txDate, today);
    });

    const totalOverdue = overdueTasks.length + overdueHabits.length + overdueTransactions.length;

    if (totalOverdue > 0) {
      setTimeout(() => {
        // Overdue tasks notification
        if (overdueTasks.length > 0) {
          toast.warning(
            `⚡ ${overdueTasks.length} просроченных ${getTaskWord(overdueTasks.length)}`,
            {
              description: 'Не забудьте выполнить или перенести.',
              duration: 5000,
              action: {
                label: 'Показать',
                onClick: () => {
                  window.location.href = '/tasks';
                },
              },
            }
          );
        }

        // Overdue habits notification
        if (overdueHabits.length > 0) {
          setTimeout(() => {
            toast.warning(
              `🔥 ${overdueHabits.length} ${getHabitWord(overdueHabits.length)} на сегодня`,
              {
                description: 'Не забудьте выполнить привычки.',
                duration: 5000,
                action: {
                  label: 'Показать',
                  onClick: () => {
                    window.location.href = '/habits';
                  },
                },
              }
            );
          }, 800);
        }

        // Overdue transactions notification
        if (overdueTransactions.length > 0) {
          setTimeout(() => {
            toast.warning(
              `💰 ${overdueTransactions.length} просроченных ${getTransactionWord(overdueTransactions.length)}`,
              {
                description: 'Запланированные операции ожидают выполнения.',
                duration: 5000,
                action: {
                  label: 'Показать',
                  onClick: () => {
                    window.location.href = '/finance';
                  },
                },
              }
            );
          }, 1600);
        }
      }, 1500);

      localStorage.setItem(NOTIFICATION_KEY, todayStr);
    }

    hasNotifiedRef.current = true;
  }, [tasksKey, habitsKey, transactionsKey, tasks, habits, transactions]);
}

function getTaskWord(count: number): string {
  if (count === 1) return 'задача';
  if (count >= 2 && count <= 4) return 'задачи';
  return 'задач';
}

function getHabitWord(count: number): string {
  if (count === 1) return 'привычка';
  if (count >= 2 && count <= 4) return 'привычки';
  return 'привычек';
}

function getTransactionWord(count: number): string {
  if (count === 1) return 'операция';
  if (count >= 2 && count <= 4) return 'операции';
  return 'операций';
}
