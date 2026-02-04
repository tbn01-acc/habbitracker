import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccessControlSettings {
  start_page: 'dashboard' | 'auth';
  registration_enabled: boolean;
  guest_access_enabled: boolean;
}

const DEFAULT_ACCESS_CONTROL: AccessControlSettings = {
  start_page: 'dashboard',
  registration_enabled: true,
  guest_access_enabled: true,
};

export function useAppSettings() {
  const [accessControl, setAccessControl] = useState<AccessControlSettings>(DEFAULT_ACCESS_CONTROL);
  const [localAccessControl, setLocalAccessControl] = useState<AccessControlSettings>(DEFAULT_ACCESS_CONTROL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'access_control')
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching app settings:', error);
        }
        return;
      }

      if (data?.setting_value) {
        const value = data.setting_value as unknown as AccessControlSettings;
        const settings = {
          start_page: value.start_page ?? DEFAULT_ACCESS_CONTROL.start_page,
          registration_enabled: value.registration_enabled ?? DEFAULT_ACCESS_CONTROL.registration_enabled,
          guest_access_enabled: value.guest_access_enabled ?? DEFAULT_ACCESS_CONTROL.guest_access_enabled,
        };
        setAccessControl(settings);
        setLocalAccessControl(settings);
      }
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateLocalAccessControl = (updates: Partial<AccessControlSettings>) => {
    setLocalAccessControl(prev => ({ ...prev, ...updates }));
  };

  const saveAccessControl = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: JSON.parse(JSON.stringify(localAccessControl)),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'access_control');

      if (error) throw error;

      setAccessControl(localAccessControl);
      toast.success('Настройки сохранены');
      return true;
    } catch (error) {
      console.error('Error updating access control:', error);
      toast.error('Ошибка при обновлении настроек');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetLocalAccessControl = () => {
    setLocalAccessControl(accessControl);
  };

  const hasChanges = JSON.stringify(accessControl) !== JSON.stringify(localAccessControl);

  return {
    accessControl,
    localAccessControl,
    loading,
    saving,
    hasChanges,
    updateLocalAccessControl,
    saveAccessControl,
    resetLocalAccessControl,
    refetch: fetchSettings,
  };
}
