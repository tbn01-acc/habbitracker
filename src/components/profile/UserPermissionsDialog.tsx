import { Bell, BarChart3, Target, Share2 } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPermissionsDialog({ open, onOpenChange }: UserPermissionsDialogProps) {
  const { t } = useTranslation();
  const { permissions, loading, updatePermission } = useUserPermissions();

  const permissionItems = [
    {
      key: 'analytics_enabled' as const,
      icon: BarChart3,
      title: t('analyticsPermission'),
      description: t('analyticsPermissionDesc'),
    },
    {
      key: 'notifications_enabled' as const,
      icon: Bell,
      title: t('notificationsPermission'),
      description: t('notificationsPermissionDesc'),
    },
    {
      key: 'personalized_ads' as const,
      icon: Target,
      title: t('personalizedAdsPermission'),
      description: t('personalizedAdsPermissionDesc'),
    },
    {
      key: 'data_sharing' as const,
      icon: Share2,
      title: t('dataSharingPermission'),
      description: t('dataSharingPermissionDesc'),
    },
  ];

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('userPermissions')}</DialogTitle>
          <DialogDescription>{t('userPermissionsDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {permissionItems.map((item) => (
            <Card key={item.key}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <Switch
                        checked={permissions?.[item.key] ?? false}
                        onCheckedChange={(checked) => updatePermission(item.key, checked)}
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
  );
}
