import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface YookassaSettings {
  mode: 'test' | 'live';
  test_shop_id: string;
  live_shop_id: string;
  // secret keys are NOT stored in app_settings (kept blank in UI; written via secrets only)
  test_secret_set: boolean;
  live_secret_set: boolean;
  return_url: string;
  webhook_url: string;
}

const DEFAULT: YookassaSettings = {
  mode: 'test',
  test_shop_id: '',
  live_shop_id: '',
  test_secret_set: false,
  live_secret_set: false,
  return_url: '',
  webhook_url: '',
};

const KEY = 'yookassa_config';

export function useYookassaSettings() {
  const [settings, setSettings] = useState<YookassaSettings>(DEFAULT);
  const [local, setLocal] = useState<YookassaSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', KEY)
        .maybeSingle();
      if (error) {
        console.error('YooKassa settings fetch error:', error);
      }
      if (data?.setting_value) {
        const v = data.setting_value as unknown as Partial<YookassaSettings>;
        const parsed: YookassaSettings = { ...DEFAULT, ...v };
        setSettings(parsed);
        setLocal(parsed);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateLocal = (u: Partial<YookassaSettings>) => setLocal(prev => ({ ...prev, ...u }));

  const save = async () => {
    setSaving(true);
    try {
      // Never store secret keys here — only metadata
      const payload = {
        mode: local.mode,
        test_shop_id: local.test_shop_id,
        live_shop_id: local.live_shop_id,
        test_secret_set: local.test_secret_set,
        live_secret_set: local.live_secret_set,
        return_url: local.return_url,
        webhook_url: local.webhook_url,
      };

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', KEY)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ setting_value: payload as any, updated_at: new Date().toISOString() })
          .eq('setting_key', KEY);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ setting_key: KEY, setting_value: payload as any });
        if (error) throw error;
      }
      setSettings(local);
      toast.success('Настройки ЮKassa сохранены');
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error('Ошибка сохранения: ' + (e.message || ''));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setLocal(settings);
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(local);

  return { settings, localSettings: local, updateLocal, save, reset, loading, saving, hasChanges };
}
