import { useState, useEffect } from 'react';
import { History, Clock, Target, CheckSquare, Wallet, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  habitsCount: number;
  tasksCount: number;
  transactionsCount: number;
}

const STORAGE_KEY = 'habitflow_sync_history';
const MAX_HISTORY_ENTRIES = 20;

export function useSyncHistory() {
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse sync history:', e);
      }
    }
  }, []);

  const addEntry = (entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: SyncHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    const newHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ENTRIES);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    
    return newEntry;
  };

  const getTotalSyncs = () => history.length;
  
  const getLastSync = () => history[0] || null;

  return {
    history,
    addEntry,
    getTotalSyncs,
    getLastSync,
  };
}

interface SyncHistoryPanelProps {
  history: SyncHistoryEntry[];
  onSync?: () => void;
  isSyncing?: boolean;
}

export function SyncHistoryPanel({ history, onSync, isSyncing }: SyncHistoryPanelProps) {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'ru' ? 'ru-RU' : language === 'es' ? 'es-ES' : 'en-US',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    );
  };

  const totalItems = history.reduce(
    (acc, entry) => ({
      habits: acc.habits + entry.habitsCount,
      tasks: acc.tasks + entry.tasksCount,
      transactions: acc.transactions + entry.transactionsCount,
    }),
    { habits: 0, tasks: 0, transactions: 0 }
  );

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-foreground">{t('syncHistory')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('totalSyncs')}: {history.length}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{t('habitsCount')}</p>
                  <p className="font-semibold text-foreground">{totalItems.habits}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <CheckSquare className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{t('tasksCount')}</p>
                  <p className="font-semibold text-foreground">{totalItems.tasks}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <Wallet className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                  <p className="text-xs text-muted-foreground">{t('transactionsCount')}</p>
                  <p className="font-semibold text-foreground">{totalItems.transactions}</p>
                </div>
              </div>

              {/* Sync button */}
              {onSync && (
                <Button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {t('syncData')}
                </Button>
              )}

              {/* History list */}
              <ScrollArea className="h-48">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('noSyncHistory')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {entry.habitsCount + entry.tasksCount + entry.transactionsCount} {t('syncedItems')}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
