import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { getNotificationSettings } from '@/components/NotificationSettings';

export function useTaskReminders(tasks: Task[], updateTask: (id: string, updates: Partial<Task>) => void) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: '⚠️ Уведомления не поддерживаются',
        description: 'Ваш браузер не поддерживает push-уведомления',
        variant: 'destructive',
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, [toast]);

  // Show notification
  const showNotification = useCallback((task: Task, isAdvance: boolean = false) => {
    const title = isAdvance ? `⏰ Скоро: ${task.name}` : `🔔 ${task.name}`;
    const body = isAdvance 
      ? `Задача "${task.name}" начнется через несколько минут`
      : `Напоминание о задаче: ${task.name}`;

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `${task.id}-${isAdvance ? 'advance' : 'reminder'}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Also show in-app toast
    toast({
      title,
      description: task.name,
    });
  }, [toast]);

  // Check for due reminders
  const checkReminders = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const settings = getNotificationSettings();

    tasks.forEach(task => {
      if (!task.reminder?.enabled || !task.reminder.time || task.completed) {
        return;
      }

      const [hours, mins] = task.reminder.time.split(':').map(Number);
      const taskMinutes = hours * 60 + mins;

      // Check for advance notification
      if (settings.advanceNotification && task.dueDate === today) {
        const advanceMinutes = taskMinutes - settings.advanceMinutes;
        const advanceNotifiedKey = `advance_${today}`;
        
        if (
          currentMinutes >= advanceMinutes &&
          currentMinutes < taskMinutes &&
          task.reminder.notifiedAt !== advanceNotifiedKey
        ) {
          showNotification(task, true);
          updateTask(task.id, {
            reminder: {
              ...task.reminder,
              notifiedAt: advanceNotifiedKey,
            },
          });
        }
      }

      // Check for exact time notification
      if (
        task.dueDate === today &&
        currentMinutes >= taskMinutes &&
        task.reminder.notifiedAt !== today &&
        !task.reminder.notifiedAt?.startsWith('advance_')
      ) {
        showNotification(task, false);
        updateTask(task.id, {
          reminder: {
            ...task.reminder,
            notifiedAt: today,
          },
        });
      }
    });
  }, [tasks, showNotification, updateTask]);

  // Set up interval to check reminders
  useEffect(() => {
    // Check immediately
    checkReminders();

    // Check every minute
    intervalRef.current = setInterval(checkReminders, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkReminders]);

  return { requestPermission };
}

export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
