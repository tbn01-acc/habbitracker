import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Storage keys
const HABITS_KEY = 'habitflow_habits';
const TASKS_KEY = 'habitflow_tasks';
const FINANCE_KEY = 'habitflow_finance';
const TIME_ENTRIES_KEY = 'habitflow_time_entries';
const NOTES_KEY = 'habitflow_notes';
const CHECKLISTS_KEY = 'habitflow_checklists';
const COUNTERS_KEY = 'habitflow_counters';
const POMODORO_KEY = 'habitflow_pomodoro_sessions';
const REFLECTIONS_KEY = 'topfocus_reflections';

// Settings keys
const WIDGET_SETTINGS_KEY = 'habitflow_widget_settings';
const THEME_SETTINGS_KEY = 'habitflow_theme_settings';
const CELEBRATION_SETTINGS_KEY = 'habitflow_celebration_settings';
const NOTIFICATION_SETTINGS_KEY = 'habitflow_notification_settings';
const GENERAL_SETTINGS_KEY = 'habitflow_general_settings';
const DASHBOARD_LAYOUT_KEY = 'habitflow_dashboard_layout';

// Additional settings keys
const ADDITIONAL_SETTINGS_KEYS = [
  'habitflow_first_day_of_week',
  'habitflow_language',
  'habitflow_date_format',
  'habitflow_time_format',
  'habitflow_currency',
  'habitflow_auto_archive',
  'celebration_settings',
  'widget_settings',
  'theme',
  'cachingEnabled',
];

// Offline mutation queue (survives reloads / network loss)
const MUTATION_QUEUE_KEY = 'topfocus_sync_queue';
const SYNC_DEBOUNCE_MS = 5000;
const MAX_QUEUE_SIZE = 200;

type MutationScope = 'data' | 'settings';

interface SyncMutation {
  id: string;
  scope: MutationScope;
  payload: Record<string, unknown>;
  queuedAt: number;
}

function readQueue(): SyncMutation[] {
  try {
    const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncMutation[]) {
  try {
    localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch (e) {
    console.error('Failed to persist sync queue:', e);
  }
}

/**
 * Enqueue a mutation, collapsing it with any pending mutation of the same
 * scope — the latest snapshot per scope always wins, so network instability
 * can never produce duplicate or out-of-order writes.
 */
function enqueueMutation(scope: MutationScope, payload: Record<string, unknown>) {
  const queue = readQueue().filter(m => m.scope !== scope);
  queue.push({
    id: crypto.randomUUID(),
    scope,
    payload,
    queuedAt: Date.now(),
  });
  writeQueue(queue);
}

interface CloudSyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  autoSyncEnabled: boolean;
  pendingMutations: number;
}


// Check if user has PRO subscription directly
async function checkProStatus(userId: string): Promise<boolean> {
  try {
    // Check roles first
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (roleData?.role === 'admin' || roleData?.role === 'moderator' || roleData?.role === 'team') {
      return true;
    }
    
    // Check subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!subData || subData.plan !== 'pro') return false;
    if (!subData.expires_at) return true; // Lifetime
    
    const expiresAt = new Date(subData.expires_at);
    expiresAt.setDate(expiresAt.getDate() + (subData.bonus_days || 0));
    
    return expiresAt > new Date();
  } catch {
    return false;
  }
}

export function useCloudSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<CloudSyncState>({
    isSyncing: false,
    lastSyncTime: null,
    autoSyncEnabled: true,
    pendingMutations: 0,
  });
  const [isProActive, setIsProActive] = useState(false);
  const syncTimeoutRef = useRef<TimerId | null>(null);
  const lastSyncedDataRef = useRef<string>('');
  const proCheckedRef = useRef(false);
  // Guards against concurrent flushes (race conditions / duplicate writes)
  const flushingRef = useRef(false);


  // Check PRO status on mount and user change
  useEffect(() => {
    if (!user) {
      setIsProActive(false);
      proCheckedRef.current = false;
      return;
    }

    if (proCheckedRef.current) return;

    checkProStatus(user.id).then((isPro) => {
      setIsProActive(isPro);
      proCheckedRef.current = true;
    });
  }, [user]);

  // Get all local data
  const getLocalData = useCallback(() => {
    return {
      habits: JSON.parse(localStorage.getItem(HABITS_KEY) || '[]'),
      tasks: JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'),
      transactions: JSON.parse(localStorage.getItem(FINANCE_KEY) || '[]'),
      time_entries: JSON.parse(localStorage.getItem(TIME_ENTRIES_KEY) || '[]'),
      notes: JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'),
      checklists: JSON.parse(localStorage.getItem(CHECKLISTS_KEY) || '[]'),
      counters: JSON.parse(localStorage.getItem(COUNTERS_KEY) || '[]'),
      pomodoro_sessions: JSON.parse(localStorage.getItem(POMODORO_KEY) || '[]'),
      reflections: JSON.parse(localStorage.getItem(REFLECTIONS_KEY) || '[]'),
    };
  }, []);

  // Get all local settings
  const getLocalSettings = useCallback(() => {
    const settings: Record<string, any> = {
      widget_settings: JSON.parse(localStorage.getItem(WIDGET_SETTINGS_KEY) || 'null'),
      theme_settings: JSON.parse(localStorage.getItem(THEME_SETTINGS_KEY) || 'null'),
      celebration_settings: JSON.parse(localStorage.getItem(CELEBRATION_SETTINGS_KEY) || 'null'),
      notification_settings: JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || 'null'),
      general_settings: JSON.parse(localStorage.getItem(GENERAL_SETTINGS_KEY) || 'null'),
      dashboard_layout: JSON.parse(localStorage.getItem(DASHBOARD_LAYOUT_KEY) || 'null'),
    };

    // Include additional settings in general_settings
    const additionalSettings: Record<string, any> = {};
    ADDITIONAL_SETTINGS_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          additionalSettings[key] = JSON.parse(value);
        } catch {
          additionalSettings[key] = value;
        }
      }
    });

    if (Object.keys(additionalSettings).length > 0) {
      settings.general_settings = {
        ...(settings.general_settings || {}),
        ...additionalSettings
      };
    }

    return settings;
  }, []);

  /**
   * Flush the persisted mutation queue through a single transactional RPC.
   * Guarded so only one flush can be in flight at a time; on failure the
   * queue is left intact and retried on the next tick (offline-safe).
   */
  const flushQueue = useCallback(async (): Promise<boolean> => {
    if (!user || !isProActive) return false;
    if (flushingRef.current) return false;

    const queue = readQueue();
    if (queue.length === 0) return true;

    flushingRef.current = true;
    try {
      const { error } = await supabase.rpc('batch_sync_mutations', {
        p_mutations: queue.map(m => ({ scope: m.scope, payload: m.payload })) as any,
      });

      if (error) throw error;

      // Drop only the mutations we just sent; anything queued meanwhile stays.
      const sentIds = new Set(queue.map(m => m.id));
      const remaining = readQueue().filter(m => !sentIds.has(m.id));
      writeQueue(remaining);
      setState(prev => ({ ...prev, pendingMutations: remaining.length }));

      const dataMutation = [...queue].reverse().find(m => m.scope === 'data');
      if (dataMutation) {
        lastSyncedDataRef.current = JSON.stringify(dataMutation.payload);
      }
      return true;
    } catch (error) {
      console.error('Batch sync failed, keeping mutations queued:', error);
      setState(prev => ({ ...prev, pendingMutations: readQueue().length }));
      return false;
    } finally {
      flushingRef.current = false;
    }
  }, [user, isProActive]);

  // Queue settings snapshot, then flush
  const saveSettingsToCloud = useCallback(async () => {
    if (!user || !isProActive) return;

    const settings = getLocalSettings();
    enqueueMutation('settings', {
      widget_settings: settings.widget_settings,
      theme_settings: settings.theme_settings,
      celebration_settings: settings.celebration_settings,
      notification_settings: settings.notification_settings,
      general_settings: settings.general_settings,
      dashboard_layout: settings.dashboard_layout,
    });
    setState(prev => ({ ...prev, pendingMutations: readQueue().length }));

    await flushQueue();
  }, [user, isProActive, getLocalSettings, flushQueue]);

  // Queue data snapshot, then flush
  const saveDataToCloud = useCallback(async () => {
    if (!user || !isProActive) return;

    const data = getLocalData();
    const dataHash = JSON.stringify(data);

    // Skip if data hasn't changed and nothing is pending
    if (dataHash === lastSyncedDataRef.current && readQueue().length === 0) {
      return;
    }

    enqueueMutation('data', data);
    setState(prev => ({ ...prev, pendingMutations: readQueue().length }));

    await flushQueue();
  }, [user, isProActive, getLocalData, flushQueue]);


  // Load settings from cloud
  const loadSettingsFromCloud = useCallback(async () => {
    if (!user || !isProActive) return false;

    try {
      const { data, error } = await supabase
        .from('cloud_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        if (data.widget_settings) localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(data.widget_settings));
        if (data.theme_settings) localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(data.theme_settings));
        if (data.celebration_settings) localStorage.setItem(CELEBRATION_SETTINGS_KEY, JSON.stringify(data.celebration_settings));
        if (data.notification_settings) localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(data.notification_settings));
        if (data.dashboard_layout) localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(data.dashboard_layout));
        
        // Restore additional settings from general_settings
        if (data.general_settings && typeof data.general_settings === 'object') {
          const generalSettings = data.general_settings as Record<string, any>;
          localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(generalSettings));
          
          // Also restore individual settings
          ADDITIONAL_SETTINGS_KEYS.forEach(key => {
            if (generalSettings[key] !== undefined) {
              if (typeof generalSettings[key] === 'string') {
                localStorage.setItem(key, generalSettings[key]);
              } else {
                localStorage.setItem(key, JSON.stringify(generalSettings[key]));
              }
            }
          });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading settings from cloud:', error);
      return false;
    }
  }, [user, isProActive]);

  // Load data from cloud
  const loadDataFromCloud = useCallback(async (): Promise<{ loaded: boolean; hasData: boolean }> => {
    if (!user || !isProActive) return { loaded: false, hasData: false };

    try {
      const { data, error } = await supabase
        .from('cloud_user_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const hasAnyData = 
          (data.habits && Array.isArray(data.habits) && data.habits.length > 0) ||
          (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) ||
          (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0);

        if (data.habits && Array.isArray(data.habits) && data.habits.length > 0) {
          localStorage.setItem(HABITS_KEY, JSON.stringify(data.habits));
        }
        if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
          localStorage.setItem(TASKS_KEY, JSON.stringify(data.tasks));
        }
        if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
          localStorage.setItem(FINANCE_KEY, JSON.stringify(data.transactions));
        }
        if (data.time_entries && Array.isArray(data.time_entries) && data.time_entries.length > 0) {
          localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(data.time_entries));
        }
        if (data.notes && Array.isArray(data.notes) && data.notes.length > 0) {
          localStorage.setItem(NOTES_KEY, JSON.stringify(data.notes));
        }
        if (data.checklists && Array.isArray(data.checklists) && data.checklists.length > 0) {
          localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(data.checklists));
        }
        if (data.counters && Array.isArray(data.counters) && data.counters.length > 0) {
          localStorage.setItem(COUNTERS_KEY, JSON.stringify(data.counters));
        }
        if (data.pomodoro_sessions && Array.isArray(data.pomodoro_sessions) && data.pomodoro_sessions.length > 0) {
          localStorage.setItem(POMODORO_KEY, JSON.stringify(data.pomodoro_sessions));
        }
        if ((data as any).reflections && Array.isArray((data as any).reflections) && (data as any).reflections.length > 0) {
          // Merge cloud reflections with local — keep most recent per (date,userId)
          try {
            const localRaw = localStorage.getItem(REFLECTIONS_KEY);
            const local = localRaw ? JSON.parse(localRaw) : [];
            const map = new Map<string, any>();
            [...((data as any).reflections as any[]), ...local].forEach((r) => {
              const key = `${r.userId || 'guest'}::${r.date}`;
              const existing = map.get(key);
              if (!existing || new Date(r.createdAt || 0).getTime() > new Date(existing.createdAt || 0).getTime()) {
                map.set(key, r);
              }
            });
            localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(Array.from(map.values())));
          } catch {
            localStorage.setItem(REFLECTIONS_KEY, JSON.stringify((data as any).reflections));
          }
        }
        
        lastSyncedDataRef.current = JSON.stringify(getLocalData());
        return { loaded: true, hasData: hasAnyData };
      }
      return { loaded: true, hasData: false };
    } catch (error) {
      console.error('Error loading data from cloud:', error);
      return { loaded: false, hasData: false };
    }
  }, [user, isProActive, getLocalData]);

  // Check if local storage is empty (new device)
  const isLocalStorageEmpty = useCallback(() => {
    const habits = localStorage.getItem(HABITS_KEY);
    const tasks = localStorage.getItem(TASKS_KEY);
    const transactions = localStorage.getItem(FINANCE_KEY);
    
    const hasNoData = 
      (!habits || habits === '[]') &&
      (!tasks || tasks === '[]') &&
      (!transactions || transactions === '[]');
      
    return hasNoData;
  }, []);

  // Restore from cloud (for new devices)
  const restoreFromCloud = useCallback(async (): Promise<boolean> => {
    if (!user || !isProActive) return false;

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      const settingsLoaded = await loadSettingsFromCloud();
      const { loaded, hasData } = await loadDataFromCloud();
      
      if (loaded && hasData) {
        toast({
          title: '☁️ Данные восстановлены',
          description: 'Ваши данные загружены из облака',
        });
        
        // Trigger page reload to pick up restored data
        window.location.reload();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: '⚠️ Ошибка восстановления',
        description: 'Не удалось загрузить данные из облака',
        variant: 'destructive',
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [user, isProActive, loadSettingsFromCloud, loadDataFromCloud, toast]);

  // Check for cloud data on new device
  const checkCloudData = useCallback(async (): Promise<boolean> => {
    if (!user || !isProActive) return false;

    try {
      const { data, error } = await supabase
        .from('cloud_user_data')
        .select('updated_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking cloud data:', error);
      return false;
    }
  }, [user, isProActive]);

  // Full sync
  const syncAll = useCallback(async (showToast = true) => {
    if (!user || !isProActive || state.isSyncing) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      // First load from cloud (to get any changes from other devices)
      await Promise.all([
        loadSettingsFromCloud(),
        loadDataFromCloud(),
      ]);

      // Then save local changes to cloud
      await Promise.all([
        saveSettingsToCloud(),
        saveDataToCloud(),
      ]);

      const syncTime = new Date().toISOString();
      setState(prev => ({ ...prev, lastSyncTime: syncTime }));

      if (showToast) {
        toast({
          title: '☁️ Синхронизировано',
          description: 'Данные сохранены в облако',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (showToast) {
        toast({
          title: '⚠️ Ошибка синхронизации',
          description: 'Не удалось синхронизировать данные',
          variant: 'destructive',
        });
      }
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [user, isProActive, state.isSyncing, loadSettingsFromCloud, loadDataFromCloud, saveSettingsToCloud, saveDataToCloud, toast]);

  /**
   * Debounced enqueue: coalesces bursts of local changes into a single
   * queued snapshot per scope, flushed once after the quiet period.
   */
  const debouncedSync = useCallback(() => {
    if (!user || !isProActive || !state.autoSyncEnabled) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      // Queue both scopes, then flush them in one transactional batch.
      const data = getLocalData();
      const settings = getLocalSettings();

      enqueueMutation('data', data);
      enqueueMutation('settings', {
        widget_settings: settings.widget_settings,
        theme_settings: settings.theme_settings,
        celebration_settings: settings.celebration_settings,
        notification_settings: settings.notification_settings,
        general_settings: settings.general_settings,
        dashboard_layout: settings.dashboard_layout,
      });
      setState(prev => ({ ...prev, pendingMutations: readQueue().length }));

      void flushQueue();
    }, SYNC_DEBOUNCE_MS);
  }, [user, isProActive, state.autoSyncEnabled, getLocalData, getLocalSettings, flushQueue]);

  // Listen for storage changes
  useEffect(() => {
    if (!user || !isProActive) return;

    const handleStorageChange = (e: StorageEvent) => {
      const watchedKeys = [
        HABITS_KEY, TASKS_KEY, FINANCE_KEY, TIME_ENTRIES_KEY,
        NOTES_KEY, CHECKLISTS_KEY, COUNTERS_KEY, POMODORO_KEY,
        REFLECTIONS_KEY,
        WIDGET_SETTINGS_KEY, THEME_SETTINGS_KEY, CELEBRATION_SETTINGS_KEY,
        NOTIFICATION_SETTINGS_KEY, GENERAL_SETTINGS_KEY, DASHBOARD_LAYOUT_KEY,
        ...ADDITIONAL_SETTINGS_KEYS,
      ];

      if (e.key && watchedKeys.includes(e.key)) {
        debouncedSync();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const handleSameTabChange = () => debouncedSync();
    window.addEventListener('habitflow-data-changed', handleSameTabChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('habitflow-data-changed', handleSameTabChange as EventListener);
    };
  }, [user, isProActive, debouncedSync]);

  // Drain any mutations left over from a previous session / offline period
  useEffect(() => {
    if (!user || !isProActive) return;

    setState(prev => ({ ...prev, pendingMutations: readQueue().length }));
    void flushQueue();

    const handleOnline = () => { void flushQueue(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, isProActive, flushQueue]);

  // Initial sync on login - only once
  useEffect(() => {
    if (user && isProActive && proCheckedRef.current) {
      syncAll(false);
    }
  }, [user?.id, isProActive]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSyncing: state.isSyncing,
    lastSyncTime: state.lastSyncTime,
    autoSyncEnabled: state.autoSyncEnabled,
    pendingMutations: state.pendingMutations,
    syncAll,
    saveDataToCloud,
    saveSettingsToCloud,
    loadDataFromCloud,
    loadSettingsFromCloud,
    restoreFromCloud,
    checkCloudData,
    isLocalStorageEmpty,
    flushQueue,
    triggerSync: debouncedSync,
  };

}
