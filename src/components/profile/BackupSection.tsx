import { useRef, useState } from 'react';
import { Download, Upload, Loader2, ChevronDown, ChevronUp, History, RefreshCw, HardDrive, Cloud } from 'lucide-react';
import { useLocalBackup } from '@/hooks/useLocalBackup';
import { useSubscription } from '@/hooks/useSubscription';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SyncHistoryPanel, useSyncHistory } from '@/components/SyncHistory';
import { toast } from 'sonner';

export function BackupSection() {
  const { language } = useTranslation();
  const { createBackup, handleFileSelect, isCreating, isRestoring } = useLocalBackup();
  const { isProActive } = useSubscription();
  const { 
    isSyncing, 
    lastSyncTime, 
    syncAll, 
    saveDataToCloud, 
    restoreFromCloud 
  } = useCloudSync();
  const { history, addEntry } = useSyncHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRussian = language === 'ru';
  const isPro = isProActive;

  const [cloudSyncOpen, setCloudSyncOpen] = useState(true);
  const [localBackupOpen, setLocalBackupOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const formatLastSync = () => {
    if (!lastSyncTime) return isRussian ? 'Никогда' : 'Never';
    const date = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return isRussian ? 'Только что' : 'Just now';
    if (diffMins < 60) return isRussian ? `${diffMins} мин. назад` : `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isRussian ? `${diffHours} ч. назад` : `${diffHours}h ago`;
    
    return date.toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const handleSaveToCloud = async () => {
    await saveDataToCloud();
    addEntry({
      habitsCount: JSON.parse(localStorage.getItem('habitflow_habits') || '[]').length,
      tasksCount: JSON.parse(localStorage.getItem('habitflow_tasks') || '[]').length,
      transactionsCount: JSON.parse(localStorage.getItem('habitflow_finance') || '[]').length,
    });
    toast.success(isRussian ? 'Данные сохранены в облако' : 'Data saved to cloud');
  };

  const handleRestoreFromCloud = async () => {
    const success = await restoreFromCloud();
    if (!success) {
      toast.error(isRussian ? 'Не удалось восстановить данные' : 'Failed to restore data');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <HardDrive className="w-8 h-8 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {isRussian ? 'Резервное копирование' : 'Backup'}
        </h2>
      </div>

      {/* Cloud Sync Section (PRO only) */}
      <Card className={!isPro ? 'opacity-60' : ''}>
        <Collapsible open={cloudSyncOpen} onOpenChange={setCloudSyncOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Cloud className="w-6 h-6 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {isRussian ? 'Облачная синхронизация' : 'Cloud Sync'}
                    </h3>
                    {!isPro && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPro 
                      ? (isRussian ? 'Синхронизация между устройствами' : 'Sync across devices')
                      : (isRussian ? 'Доступно только для PRO' : 'Available for PRO only')}
                  </p>
                </div>
              </div>
              {cloudSyncOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4 space-y-4">
              {isPro ? (
                <>
                  {/* Last sync time */}
                  <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground">
                      {isRussian ? 'Последняя синхронизация:' : 'Last sync:'}
                    </span>
                    <span className="text-foreground font-medium">
                      {formatLastSync()}
                    </span>
                  </div>

                  {/* Save to cloud */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {isRussian ? 'Сохранение данных' : 'Save Data'}
                    </h4>
                    <Button 
                      onClick={handleSaveToCloud} 
                      disabled={isSyncing}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isRussian ? 'Сохранить в облако' : 'Save to Cloud'}
                    </Button>
                  </div>

                  {/* Restore from cloud */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {isRussian ? 'Восстановление данных' : 'Restore Data'}
                    </h4>
                    <Button 
                      onClick={handleRestoreFromCloud} 
                      disabled={isSyncing}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isRussian ? 'Восстановить из облака' : 'Restore from Cloud'}
                    </Button>
                  </div>

                  {/* Sync History */}
                  <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5" />
                          <span>{isRussian ? 'История синхронизации' : 'Sync History'}</span>
                        </div>
                        {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <SyncHistoryPanel 
                        history={history} 
                        onSync={() => syncAll(true)}
                        isSyncing={isSyncing}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {isRussian 
                      ? 'Облачная синхронизация доступна только для PRO-пользователей'
                      : 'Cloud sync is only available for PRO users'}
                  </p>
                  <Button variant="outline" disabled>
                    {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Local Backup Section */}
      <Card>
        <Collapsible open={localBackupOpen} onOpenChange={setLocalBackupOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <HardDrive className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">
                    {isRussian ? 'Локальный бэкап' : 'Local Backup'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRussian ? 'Сохранить данные на устройство' : 'Save data to device'}
                  </p>
                </div>
              </div>
              {localBackupOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={createBackup}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isRussian ? 'Создать' : 'Create'}
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isRussian ? 'Восстановить' : 'Restore'}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
