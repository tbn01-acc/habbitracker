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

interface CloudSyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  autoSyncEnabled: boolean;
}

// Check if user has PRO subscription directly
async function checkProStatus(userId: string): Promise<boolean> {
  try {
    // Check roles first
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (roleData?.role === 'admin' || roleData?.role === 'moderator' || roleData?.role === 'team') {
      return true;
    }
    
    // Check subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
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
  });
  const [isProActive, setIsProActive] = useState(false);
  const syncTimeoutRef = useRef<TimerId | null>(null);
  const lastSyncedDataRef = useRef<string>('');
  const proCheckedRef = useRef(false);

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

  // Save settings to cloud
  const saveSettingsToCloud = useCallback(async () => {
    if (!user || !isProActive) return;

    const settings = getLocalSettings();
    
    try {
      const { error } = await supabase
        .from('cloud_user_settings')
        .upsert({
          user_id: user.id,
          widget_settings: settings.widget_settings,
          theme_settings: settings.theme_settings,
          celebration_settings: settings.celebration_settings,
          notification_settings: settings.notification_settings,
          general_settings: settings.general_settings,
          dashboard_layout: settings.dashboard_layout,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings to cloud:', error);
    }
  }, [user, isProActive, getLocalSettings]);

  // Save data to cloud
  const saveDataToCloud = useCallback(async () => {
    if (!user || !isProActive) return;

    const data = getLocalData();
    const dataHash = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (dataHash === lastSyncedDataRef.current) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cloud_user_data')
        .upsert({
          user_id: user.id,
          habits: data.habits,
          tasks: data.tasks,
          transactions: data.transactions,
          time_entries: data.time_entries,
          notes: data.notes,
          checklists: data.checklists,
          counters: data.counters,
          pomodoro_sessions: data.pomodoro_sessions,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      lastSyncedDataRef.current = dataHash;
    } catch (error) {
      console.error('Error saving data to cloud:', error);
    }
  }, [user, isProActive, getLocalData]);

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

  // Debounced auto-sync
  const debouncedSync = useCallback(() => {
    if (!user || !isProActive || !state.autoSyncEnabled) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      saveDataToCloud();
      saveSettingsToCloud();
    }, 5000); // 5 second debounce
  }, [user, isProActive, state.autoSyncEnabled, saveDataToCloud, saveSettingsToCloud]);

  // Listen for storage changes
  useEffect(() => {
    if (!user || !isProActive) return;

    const handleStorageChange = (e: StorageEvent) => {
      const watchedKeys = [
        HABITS_KEY, TASKS_KEY, FINANCE_KEY, TIME_ENTRIES_KEY,
        NOTES_KEY, CHECKLISTS_KEY, COUNTERS_KEY, POMODORO_KEY,
        WIDGET_SETTINGS_KEY, THEME_SETTINGS_KEY, CELEBRATION_SETTINGS_KEY,
        NOTIFICATION_SETTINGS_KEY, GENERAL_SETTINGS_KEY, DASHBOARD_LAYOUT_KEY,
        ...ADDITIONAL_SETTINGS_KEYS,
      ];

      if (e.key && watchedKeys.includes(e.key)) {
        debouncedSync();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, isProActive, debouncedSync]);

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
    syncAll,
    saveDataToCloud,
    saveSettingsToCloud,
    loadDataFromCloud,
    loadSettingsFromCloud,
    restoreFromCloud,
    checkCloudData,
    isLocalStorageEmpty,
    triggerSync: debouncedSync,
  };
}
