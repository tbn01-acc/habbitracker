import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format, startOfDay } from 'date-fns';
import { useTranslation } from '@/contexts/LanguageContext';

interface Task {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
}

interface Goal {
  id: string;
  name: string;
  target_date: string | null;
  status: string;
}

export function useDeadlineNotifications(tasks: Task[], goals: Goal[]) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { sendDeadlineReminder, permission } = usePushNotifications();
  const isRussian = language === 'ru';
  const lastNotificationDate = useRef<string | null>(null);

  const createNotification = useCallback(async (
    type: string,
    title: string,
    message: string,
    referenceId: string,
    referenceType: string
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('create_self_notification', {
        p_type: type,
        p_title: title,
        p_message: message,
        p_reference_id: referenceId,
        p_reference_type: referenceType,
      });
    } catch (error) {
      console.error('Error creating deadline notification:', error);
    }
  }, [user]);

  const checkDeadlines = useCallback(async () => {
    if (!user) return;

    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');

    // Only check once per day
    if (lastNotificationDate.current === todayStr) return;
    lastNotificationDate.current = todayStr;

    const urgentTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const urgentGoals: Goal[] = [];
    const upcomingGoals: Goal[] = [];

    // Check tasks
    tasks.forEach(task => {
      if (task.completed) return;
      
      const dueDate = parseISO(task.dueDate);
      const daysUntil = differenceInDays(dueDate, today);

      if (daysUntil === 0) {
        // Due today
        urgentTasks.push(task);
      } else if (daysUntil === 1) {
        // Due tomorrow
        upcomingTasks.push(task);
      } else if (daysUntil < 0 && daysUntil >= -1) {
        // Overdue by 1 day
        urgentTasks.push(task);
      }
    });

    // Check goals
    goals.forEach(goal => {
      if (goal.status !== 'active' || !goal.target_date) return;

      const targetDate = parseISO(goal.target_date);
      const daysUntil = differenceInDays(targetDate, today);

      if (daysUntil <= 3 && daysUntil >= 0) {
        // Due within 3 days
        urgentGoals.push(goal);
      } else if (daysUntil <= 7 && daysUntil > 3) {
        // Due within a week
        upcomingGoals.push(goal);
      } else if (daysUntil < 0 && daysUntil >= -3) {
        // Overdue by up to 3 days
        urgentGoals.push(goal);
      }
    });

    // Send push notifications via Service Worker if permission granted
    if (permission === 'granted') {
      // Send push notifications for urgent tasks
      urgentTasks.forEach(task => {
        const dueDate = parseISO(task.dueDate);
        const daysUntil = differenceInDays(dueDate, today);
        const urgency = daysUntil < 0 ? 'overdue' : 'today';
        
        sendDeadlineReminder({
          id: task.id,
          title: task.name,
          body: isRussian 
            ? (urgency === 'overdue' ? 'Задача просрочена!' : 'Задача на сегодня')
            : (urgency === 'overdue' ? 'Task is overdue!' : 'Task due today'),
          type: 'task',
          urgency
        });
      });

      // Send push notifications for upcoming tasks
      upcomingTasks.forEach(task => {
        sendDeadlineReminder({
          id: task.id,
          title: task.name,
          body: isRussian ? 'Задача на завтра' : 'Task due tomorrow',
          type: 'task',
          urgency: 'tomorrow'
        });
      });

      // Send push notifications for urgent goals
      urgentGoals.forEach(goal => {
        if (!goal.target_date) return;
        const targetDate = parseISO(goal.target_date);
        const daysUntil = differenceInDays(targetDate, today);
        const urgency = daysUntil < 0 ? 'overdue' : (daysUntil === 0 ? 'today' : 'upcoming');
        
        sendDeadlineReminder({
          id: goal.id,
          title: goal.name,
          body: isRussian 
            ? (urgency === 'overdue' ? 'Цель просрочена!' : `Дедлайн через ${daysUntil} дн.`)
            : (urgency === 'overdue' ? 'Goal is overdue!' : `Deadline in ${daysUntil} days`),
          type: 'goal',
          urgency
        });
      });
    }

    // Show toast notifications for urgent items
    if (urgentTasks.length > 0) {
      const title = isRussian 
        ? `⚠️ ${urgentTasks.length} задач требуют внимания!`
        : `⚠️ ${urgentTasks.length} tasks need attention!`;
      
      toast.warning(title, {
        description: urgentTasks.slice(0, 3).map(t => t.name).join(', '),
        duration: 5000,
      });

      // Create database notification for the first task
      if (urgentTasks[0]) {
        await createNotification(
          'deadline_urgent',
          isRussian ? '⚠️ Срочные задачи' : '⚠️ Urgent Tasks',
          isRussian 
            ? `${urgentTasks.length} задач сегодня или просрочены`
            : `${urgentTasks.length} tasks due today or overdue`,
          urgentTasks[0].id,
          'task'
        );
      }
    }

    if (upcomingTasks.length > 0) {
      const title = isRussian
        ? `📋 ${upcomingTasks.length} задач на завтра`
        : `📋 ${upcomingTasks.length} tasks due tomorrow`;
      
      toast.info(title, {
        description: upcomingTasks.slice(0, 3).map(t => t.name).join(', '),
        duration: 4000,
      });
    }

    if (urgentGoals.length > 0) {
      const title = isRussian
        ? `🎯 ${urgentGoals.length} целей приближаются к дедлайну!`
        : `🎯 ${urgentGoals.length} goals approaching deadline!`;
      
      toast.warning(title, {
        description: urgentGoals.map(g => g.name).join(', '),
        duration: 5000,
      });

      // Create database notification for goals
      if (urgentGoals[0]) {
        await createNotification(
          'goal_deadline',
          isRussian ? '🎯 Дедлайн цели' : '🎯 Goal Deadline',
          isRussian
            ? `Цель "${urgentGoals[0].name}" близка к дедлайну`
            : `Goal "${urgentGoals[0].name}" is approaching deadline`,
          urgentGoals[0].id,
          'goal'
        );
      }
    }

    if (upcomingGoals.length > 0) {
      const title = isRussian
        ? `🎯 ${upcomingGoals.length} целей на этой неделе`
        : `🎯 ${upcomingGoals.length} goals due this week`;
      
      toast.info(title, {
        description: upcomingGoals.map(g => g.name).join(', '),
        duration: 4000,
      });
    }
  }, [user, tasks, goals, isRussian, createNotification, permission, sendDeadlineReminder]);

  useEffect(() => {
    // Check deadlines on mount and when data changes
    const timer = setTimeout(() => {
      checkDeadlines();
    }, 2000); // Delay to avoid showing too early

    return () => clearTimeout(timer);
  }, [checkDeadlines]);

  // Also check periodically (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      lastNotificationDate.current = null; // Reset to allow re-check
      checkDeadlines();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [checkDeadlines]);

  return { checkDeadlines };
}