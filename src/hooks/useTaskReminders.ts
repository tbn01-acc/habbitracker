import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

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
  const showNotification = useCallback((task: Task) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(`🔔 ${task.name}`, {
        body: `Напоминание о задаче: ${task.name}`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: task.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Also show in-app toast
    toast({
      title: `🔔 Напоминание`,
      description: task.name,
    });
  }, [toast]);

  // Check for due reminders
  const checkReminders = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    tasks.forEach(task => {
      if (
        task.reminder?.enabled &&
        task.reminder.time &&
        !task.completed &&
        task.dueDate === today &&
        task.reminder.time <= currentTime &&
        task.reminder.notifiedAt !== today
      ) {
        showNotification(task);
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
