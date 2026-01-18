import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NotificationSettingsData {
  likes_notifications_enabled: boolean;
  comments_notifications_enabled: boolean;
  subscriptions_notifications_enabled: boolean;
  tasks_notifications_enabled: boolean;
  habits_notifications_enabled: boolean;
  goals_notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const DEFAULT_SETTINGS: NotificationSettingsData = {
  likes_notifications_enabled: true,
  comments_notifications_enabled: true,
  subscriptions_notifications_enabled: true,
  tasks_notifications_enabled: true,
  habits_notifications_enabled: true,
  goals_notifications_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '23:00',
  quiet_hours_end: '07:00',
};

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsData>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('likes_notifications_enabled, comments_notifications_enabled, subscriptions_notifications_enabled, task_notification_enabled, habit_notification_enabled, overdue_notification_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          likes_notifications_enabled: data.likes_notifications_enabled ?? true,
          comments_notifications_enabled: data.comments_notifications_enabled ?? true,
          subscriptions_notifications_enabled: data.subscriptions_notifications_enabled ?? true,
          tasks_notifications_enabled: data.task_notification_enabled ?? true,
          habits_notifications_enabled: data.habit_notification_enabled ?? true,
          goals_notifications_enabled: data.overdue_notification_enabled ?? true,
          quiet_hours_enabled: data.quiet_hours_enabled ?? false,
          quiet_hours_start: data.quiet_hours_start || '23:00',
          quiet_hours_end: data.quiet_hours_end || '07:00',
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<NotificationSettingsData>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Настройки сохранены');
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Не удалось сохранить настройки');
      return false;
    }
  }, [user, settings]);

  const isInQuietHours = useCallback(() => {
    if (!settings.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = settings.quiet_hours_start;
    const end = settings.quiet_hours_end;

    // Handle overnight quiet hours (e.g., 23:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    
    return currentTime >= start && currentTime < end;
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    isInQuietHours,
    refetch: fetchSettings,
  };
}
