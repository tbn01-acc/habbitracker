import { useState, useEffect } from 'react';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionContext as useSubscription } from '@/contexts/SubscriptionContext';
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
import { Cloud, Download, Loader2 } from 'lucide-react';

export function CloudRestoreDialog() {
  const { user } = useAuth();
  const { isProActive } = useSubscription();
  const { isLocalStorageEmpty, checkCloudData, restoreFromCloud, isSyncing } = useCloudSync();
  const [showDialog, setShowDialog] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkAndPrompt = async () => {
      // Only check once per session
      if (hasChecked || !user || !isProActive) return;
      
      setHasChecked(true);
      
      // Check if local storage is empty (new device)
      if (isLocalStorageEmpty()) {
        // Check if there's cloud data available
        const hasCloudData = await checkCloudData();
        if (hasCloudData) {
          setShowDialog(true);
        }
      }
    };

    // Small delay to ensure auth state is settled
    const timer = setTimeout(checkAndPrompt, 1000);
    return () => clearTimeout(timer);
  }, [user, isProActive, hasChecked, isLocalStorageEmpty, checkCloudData]);

  const handleRestore = async () => {
    await restoreFromCloud();
    setShowDialog(false);
  };

  const handleSkip = () => {
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">
              Восстановить данные?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Мы обнаружили ваши данные в облаке. Похоже, вы используете новое устройство.
            Хотите восстановить ваши привычки, задачи и настройки?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleSkip} disabled={isSyncing}>
            Начать с нуля
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} disabled={isSyncing} className="gap-2">
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Восстановить данные
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
