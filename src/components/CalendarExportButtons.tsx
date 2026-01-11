import { Download, Calendar, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { useState } from 'react';

interface CalendarExportButtonsProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportICS: () => void;
  onSyncGoogle?: () => Promise<void>;
  accentColor?: string;
  type: 'habits' | 'tasks';
}

export function CalendarExportButtons({ 
  onExportCSV, 
  onExportPDF, 
  onExportICS,
  onSyncGoogle,
  accentColor,
  type
}: CalendarExportButtonsProps) {
  const { t, language } = useTranslation();
  const { isProActive } = useSubscription();
  const { isConnected, connectGoogleCalendar, loading: googleLoading } = useGoogleCalendar();
  const [syncing, setSyncing] = useState(false);
  const isRussian = language === 'ru';

  const handleGoogleSync = async () => {
    if (!isProActive) {
      toast.error(isRussian ? 'Доступно только для PRO' : 'PRO only feature');
      return;
    }

    if (!isConnected) {
      await connectGoogleCalendar();
      return;
    }

    if (onSyncGoogle) {
      setSyncing(true);
      try {
        await onSyncGoogle();
        toast.success(isRussian ? 'Синхронизировано с Google Calendar' : 'Synced with Google Calendar');
      } catch (error) {
        toast.error(isRussian ? 'Ошибка синхронизации' : 'Sync failed');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleICSExport = () => {
    if (!isProActive) {
      toast.error(isRussian ? 'Доступно только для PRO' : 'PRO only feature');
      return;
    }
    onExportICS();
    toast.success(isRussian ? 'Экспортировано в .ics' : 'Exported to .ics');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          style={accentColor ? { color: accentColor } : undefined}
        >
          <Download className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          {t('exportToCsv')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          {t('exportToPdf')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleICSExport} className="cursor-pointer">
          <Calendar className="w-4 h-4 mr-2" />
          {isRussian ? 'Экспорт в .ics (Apple)' : 'Export to .ics (Apple)'}
          {!isProActive && <span className="ml-auto text-xs text-amber-500">PRO</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleGoogleSync} className="cursor-pointer" disabled={syncing || googleLoading}>
          {syncing || googleLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
          )}
          {isConnected 
            ? (isRussian ? 'Синхронизировать с Google' : 'Sync with Google')
            : (isRussian ? 'Подключить Google Calendar' : 'Connect Google Calendar')
          }
          {!isProActive && <span className="ml-auto text-xs text-amber-500">PRO</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
