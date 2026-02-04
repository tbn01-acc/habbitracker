import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationData {
  type?: string;
  itemId?: string;
  itemType?: string;
  goalId?: string;
  [key: string]: any;
}

interface ScheduledNotification {
  title: string;
  body: string;
  delay: number;
  tag?: string;
  data?: NotificationData;
  requireInteraction?: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Get service worker registration
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push-уведомления не поддерживаются вашим браузером');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Push-уведомления включены');
        return true;
      } else if (result === 'denied') {
        toast.error('Вы запретили push-уведомления. Измените настройки в браузере.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Не удалось запросить разрешение');
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions & { data?: NotificationData }) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      // Use service worker for notifications if available
      if (registration) {
        registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });
      } else if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            ...options,
          });
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/pwa-192x192.png',
          ...options,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission, registration]);

  // Schedule a notification for later via Service Worker
  const scheduleNotification = useCallback((notification: ScheduledNotification) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          data: notification
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, [isSupported, permission]);

  // Send deadline reminder via Service Worker
  const sendDeadlineReminder = useCallback((data: {
    id: string;
    title: string;
    body: string;
    type: 'task' | 'goal' | 'habit';
    urgency: 'overdue' | 'today' | 'tomorrow' | 'upcoming';
  }) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'DEADLINE_REMINDER',
          data
        });
      } else {
        // Fallback - show notification directly
        const urgencyIcons: Record<string, string> = {
          overdue: '🚨',
          today: '⚠️',
          tomorrow: '📅',
          upcoming: '📋'
        };
        
        showNotification(`${urgencyIcons[data.urgency] || '📋'} ${data.title}`, {
          body: data.body,
          tag: `deadline-${data.id}`,
          data: { type: data.type, itemId: data.id },
          requireInteraction: data.urgency === 'overdue',
        });
      }
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
    }
  }, [isSupported, permission, showNotification]);

  const saveToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          push_token: token,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      setIsSubscribed(true);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, [user]);

  // Listen for messages from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      
      if (type === 'COMPLETE_ITEM') {
        // Dispatch event for the app to handle
        window.dispatchEvent(new CustomEvent('sw-complete-item', { detail: data }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    sendDeadlineReminder,
    saveToken,
  };
}
