import { useState, useEffect } from 'react';
import { Bell, BellOff, Heart, MessageCircle, UserPlus, Moon, Clock, CheckSquare, Repeat, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from '@/contexts/LanguageContext';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsDialog({ open, onOpenChange }: NotificationSettingsDialogProps) {
  const { t } = useTranslation();
  const { settings, updateSettings, isLoading } = useNotificationSettings();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings);
    onOpenChange(false);
  };

  const handleEnablePush = async () => {
    await requestPermission();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Настройки уведомлений
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Push notifications */}
          {isSupported && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Push-уведомления</h3>
              {permission === 'granted' ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Bell className="w-4 h-4" />
                  Push-уведомления включены
                </div>
              ) : permission === 'denied' ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <BellOff className="w-4 h-4" />
                  Push-уведомления заблокированы в браузере
                </div>
              ) : (
                <Button variant="outline" onClick={handleEnablePush} className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Включить push-уведомления
                </Button>
              )}
            </div>
          )}

          <Separator />

          {/* Notification types - Social */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Социальные уведомления</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="likes" className="flex items-center gap-2 cursor-pointer">
                <Heart className="w-4 h-4 text-destructive" />
                Лайки
              </Label>
              <Switch
                id="likes"
                checked={localSettings.likes_notifications_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, likes_notifications_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="comments" className="flex items-center gap-2 cursor-pointer">
                <MessageCircle className="w-4 h-4 text-primary" />
                Комментарии
              </Label>
              <Switch
                id="comments"
                checked={localSettings.comments_notifications_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, comments_notifications_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="subscriptions" className="flex items-center gap-2 cursor-pointer">
                <UserPlus className="w-4 h-4 text-accent" />
                Новые публикации подписок
              </Label>
              <Switch
                id="subscriptions"
                checked={localSettings.subscriptions_notifications_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, subscriptions_notifications_enabled: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Notification types - Productivity */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Уведомления о продуктивности</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="tasks" className="flex items-center gap-2 cursor-pointer">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                Задачи
              </Label>
              <Switch
                id="tasks"
                checked={localSettings.tasks_notifications_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, tasks_notifications_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="habits" className="flex items-center gap-2 cursor-pointer">
                <Repeat className="w-4 h-4 text-green-500" />
                Привычки
              </Label>
              <Switch
                id="habits"
                checked={localSettings.habits_notifications_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, habits_notifications_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="goals" className="flex items-center gap-2 cursor-pointer">
                <Target className="w-4 h-4 text-amber-500" />
                Цели
              </Label>
              <Switch
                id="goals"
                checked={localSettings.goals_notifications_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, goals_notifications_enabled: checked }))
                }
              />
            </div>

          </div>

          <Separator />

          {/* Quiet hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet" className="flex items-center gap-2 cursor-pointer">
                <Moon className="w-4 h-4" />
                Тихий режим
              </Label>
              <Switch
                id="quiet"
                checked={localSettings.quiet_hours_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, quiet_hours_enabled: checked }))
                }
              />
            </div>

            {localSettings.quiet_hours_enabled && (
              <div className="flex items-center gap-3 pl-6">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={localSettings.quiet_hours_start}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))
                    }
                    className="w-24"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="time"
                    value={localSettings.quiet_hours_end}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))
                    }
                    className="w-24"
                  />
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground pl-6">
              В тихом режиме уведомления не будут отображаться
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
