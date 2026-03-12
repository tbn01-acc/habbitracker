import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnalyticsSettings {
  yandex_metrika_id: string;
  yandex_webmaster_verification: string;
}

const DEFAULT_ANALYTICS: AnalyticsSettings = {
  yandex_metrika_id: '',
  yandex_webmaster_verification: '',
};

const SETTING_KEY = 'analytics_codes';

export function useAnalyticsSettings() {
  const [settings, setSettings] = useState<AnalyticsSettings>(DEFAULT_ANALYTICS);
  const [localSettings, setLocalSettings] = useState<AnalyticsSettings>(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', SETTING_KEY)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching analytics settings:', error);
        }
        return;
      }

      if (data?.setting_value) {
        const value = data.setting_value as unknown as AnalyticsSettings;
        const parsed: AnalyticsSettings = {
          yandex_metrika_id: value.yandex_metrika_id ?? '',
          yandex_webmaster_verification: value.yandex_webmaster_verification ?? '',
        };
        setSettings(parsed);
        setLocalSettings(parsed);
      }
    } catch (error) {
      console.error('Error fetching analytics settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateLocal = (updates: Partial<AnalyticsSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  const save = async () => {
    setSaving(true);
    try {
      // Try update first, then upsert
      const payload = {
        setting_key: SETTING_KEY,
        setting_value: JSON.parse(JSON.stringify(localSettings)),
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', SETTING_KEY)
        .single();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('app_settings')
          .update({ setting_value: payload.setting_value, updated_at: payload.updated_at })
          .eq('setting_key', SETTING_KEY));
      } else {
        ({ error } = await supabase.from('app_settings').insert(payload));
      }

      if (error) throw error;

      setSettings(localSettings);
      toast.success('Настройки аналитики сохранены');
      return true;
    } catch (error) {
      console.error('Error saving analytics settings:', error);
      toast.error('Ошибка сохранения');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setLocalSettings(settings);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  return {
    settings,
    localSettings,
    loading,
    saving,
    hasChanges,
    updateLocal,
    save,
    reset,
    refetch: fetchSettings,
  };
}
