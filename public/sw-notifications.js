// Service Worker for Push Notifications
// Handles push events, notification clicks, and background sync

const CACHE_NAME = 'topfocus-notifications-v1';

// Handle push notifications from server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: data.tag || 'default',
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
      vibrate: [200, 100, 200],
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Top-Focus', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  // Route to specific page based on notification type
  if (data?.type === 'task_deadline') {
    url = '/tasks';
  } else if (data?.type === 'goal_deadline') {
    url = `/goals/${data.goalId || ''}`;
  } else if (data?.type === 'habit_reminder') {
    url = '/habits';
  } else if (data?.type === 'post' && data?.postId) {
    url = '/focus';
  } else if (data?.type === 'user' && data?.userId) {
    url = `/user/${data.userId}`;
  } else if (data?.type === 'notifications') {
    url = '/notifications';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle notification action buttons
self.addEventListener('notificationclick', (event) => {
  if (event.action) {
    const data = event.notification.data;
    
    switch (event.action) {
      case 'complete':
        // Mark task/habit as complete - send message to main app
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'COMPLETE_ITEM',
              data: { id: data.itemId, itemType: data.itemType }
            });
          });
        });
        break;
      case 'snooze':
        // Show reminder again in 30 minutes
        setTimeout(() => {
          self.registration.showNotification(event.notification.title, {
            body: event.notification.body,
            icon: '/pwa-192x192.png',
            data: data
          });
        }, 30 * 60 * 1000);
        break;
    }
  }
  event.notification.close();
});

// Handle timer messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'TIMER_COMPLETE') {
    self.registration.showNotification(data.title || 'Таймер', {
      body: data.body || 'Время вышло!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'timer',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    });
  }
  
  if (type === 'POMODORO_PHASE_CHANGE') {
    const phaseMessages = {
      work: 'Время работать! 💪',
      short_break: 'Короткий перерыв ☕',
      long_break: 'Длинный перерыв 🎉',
    };
    
    self.registration.showNotification('Pomodoro Timer', {
      body: phaseMessages[data.phase] || 'Фаза изменена',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'pomodoro',
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
  }

  if (type === 'SCHEDULE_NOTIFICATION') {
    // Schedule a notification for later
    const delay = data.delay || 0;
    setTimeout(() => {
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: data.tag || 'scheduled',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
      });
    }, delay);
  }

  if (type === 'DEADLINE_REMINDER') {
    const urgencyIcons = {
      overdue: '🚨',
      today: '⚠️',
      tomorrow: '📅',
      upcoming: '📋'
    };
    
    self.registration.showNotification(
      `${urgencyIcons[data.urgency] || '📋'} ${data.title}`, 
      {
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `deadline-${data.id}`,
        data: { type: data.type, itemId: data.id },
        requireInteraction: data.urgency === 'overdue',
        actions: [
          { action: 'complete', title: '✓ Готово' },
          { action: 'snooze', title: '⏰ Напомнить позже' }
        ]
      }
    );
  }
});

// Periodic background sync for deadline checks
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-deadlines') {
    event.waitUntil(checkDeadlines());
  }
});

async function checkDeadlines() {
  // This would typically fetch from your API
  // For now, we'll rely on the main app to trigger deadline notifications
  console.log('Background sync: checking deadlines');
}

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
