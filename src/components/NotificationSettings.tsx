import { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const NOTIFICATION_SETTINGS_KEY = 'habitflow_notification_settings';

export interface NotificationSettingsData {
  advanceNotification: boolean;
  advanceMinutes: number;
}

const DEFAULT_SETTINGS: NotificationSettingsData = {
  advanceNotification: false,
  advanceMinutes: 30,
};

export function getNotificationSettings(): NotificationSettingsData {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load notification settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettingsData) {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

export function NotificationSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettingsData>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getNotificationSettings());
  }, []);

  const updateSettings = (updates: Partial<NotificationSettingsData>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const advanceOptions = [
    { value: 5, label: t('minutes5') },
    { value: 15, label: t('minutes15') },
    { value: 30, label: t('minutes30') },
    { value: 60, label: t('hour1') },
    { value: 120, label: t('hours2') },
    { value: 1440, label: t('day1') },
  ];

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">{t('notificationSettings')}</h3>
      </div>

      <div className="space-y-4">
        {/* Advance notification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t('advanceNotification')}</span>
          </div>
          <Switch
            checked={settings.advanceNotification}
            onCheckedChange={(checked) => updateSettings({ advanceNotification: checked })}
          />
        </div>

        {/* Time selection */}
        {settings.advanceNotification && (
          <div className="flex flex-wrap gap-2">
            {advanceOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => updateSettings({ advanceMinutes: option.value })}
                className={cn(
                  "text-xs",
                  settings.advanceMinutes === option.value && "bg-primary text-primary-foreground"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
