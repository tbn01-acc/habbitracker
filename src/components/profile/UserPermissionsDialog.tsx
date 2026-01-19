import { useState } from 'react';
import { Bell, BarChart3, Target, Share2, FileCheck, AlertTriangle } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useSubscription } from '@/hooks/useSubscription';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPermissionsDialog({ open, onOpenChange }: UserPermissionsDialogProps) {
  const { t, language } = useTranslation();
  const { permissions, loading, updatePermission } = useUserPermissions();
  const { isProActive } = useSubscription();
  const [warningOpen, setWarningOpen] = useState(false);
  const [adsWarningOpen, setAdsWarningOpen] = useState(false);
  const [pendingPermission, setPendingPermission] = useState<{ key: string; value: boolean } | null>(null);
  const isRussian = language === 'ru';

  const permissionItems = [
    {
      key: 'data_processing_consent' as const,
      icon: FileCheck,
      title: isRussian ? 'Согласие на обработку персональных данных' : 'Data Processing Consent',
      description: isRussian ? 'Обязательно для использования приложения' : 'Required to use the application',
      critical: true,
      mandatoryForFree: false,
    },
    {
      key: 'analytics_enabled' as const,
      icon: BarChart3,
      title: t('analyticsPermission'),
      description: t('analyticsPermissionDesc'),
      critical: true,
      mandatoryForFree: false,
    },
    {
      key: 'notifications_enabled' as const,
      icon: Bell,
      title: t('notificationsPermission'),
      description: t('notificationsPermissionDesc'),
      critical: true,
      mandatoryForFree: false,
    },
    {
      key: 'personalized_ads' as const,
      icon: Target,
      title: t('personalizedAdsPermission'),
      description: isRussian 
        ? (isProActive ? 'Персонализированная реклама' : 'Обязательно для бесплатного тарифа')
        : (isProActive ? 'Personalized advertising' : 'Required for free plan'),
      critical: false,
      mandatoryForFree: !isProActive,
    },
    {
      key: 'data_sharing' as const,
      icon: Share2,
      title: t('dataSharingPermission'),
      description: t('dataSharingPermissionDesc'),
      critical: false,
      mandatoryForFree: false,
    },
  ];

  const handlePermissionChange = (key: string, value: boolean, critical: boolean, mandatoryForFree: boolean) => {
    // Show warning when trying to disable critical permissions
    if (critical && !value) {
      setPendingPermission({ key, value });
      setWarningOpen(true);
    } else if (mandatoryForFree && !value) {
      // Show special warning for FREE users trying to disable ads
      setPendingPermission({ key, value });
      setAdsWarningOpen(true);
    } else {
      updatePermission(key as any, value);
    }
  };

  const confirmDisablePermission = () => {
    // Don't actually disable - just close the dialog
    setWarningOpen(false);
    setPendingPermission(null);
  };

  const confirmDisableAds = () => {
    // Don't actually disable for FREE users
    setAdsWarningOpen(false);
    setPendingPermission(null);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userPermissions')}</DialogTitle>
            <DialogDescription>{t('userPermissionsDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {permissionItems.map((item) => (
              <Card key={item.key} className={item.critical || item.mandatoryForFree ? 'border-primary/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      item.critical || item.mandatoryForFree ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <item.icon className={`w-5 h-5 ${item.critical || item.mandatoryForFree ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          {item.critical && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">
                              {isRussian ? 'Обязательно' : 'Required'}
                            </span>
                          )}
                          {item.mandatoryForFree && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                              FREE
                            </span>
                          )}
                        </div>
                        <Switch
                          checked={item.mandatoryForFree ? true : !!permissions?.[item.key as keyof typeof permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(item.key, checked, item.critical ?? false, item.mandatoryForFree ?? false)}
                          disabled={item.mandatoryForFree}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Critical Permission Warning */}
      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isRussian ? 'Внимание!' : 'Warning!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Отключение этого разрешения делает НЕВОЗМОЖНЫМ использование приложения. Данное разрешение необходимо для корректной работы основных функций.'
                : 'Disabling this permission makes it IMPOSSIBLE to use the application. This permission is required for the core functionality to work properly.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRussian ? 'Оставить включённым' : 'Keep enabled'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisablePermission} className="bg-amber-500 hover:bg-amber-600">
              {isRussian ? 'Понятно' : 'I understand'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ads Permission Warning for FREE users */}
      <AlertDialog open={adsWarningOpen} onOpenChange={setAdsWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              {isRussian ? 'Внимание!' : 'Warning!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Для бесплатного тарифа просмотр персонализированной рекламы обязателен. Чтобы отключить рекламу, оформите подписку PRO.'
                : 'Personalized advertising is mandatory for the free plan. To disable ads, subscribe to PRO.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRussian ? 'Закрыть' : 'Close'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableAds} className="bg-gradient-to-r from-amber-500 to-orange-500">
              {isRussian ? 'Перейти к PRO' : 'Go to PRO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
