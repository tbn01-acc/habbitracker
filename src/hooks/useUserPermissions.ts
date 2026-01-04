import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserPermissions {
  id: string;
  analytics_enabled: boolean;
  notifications_enabled: boolean;
  personalized_ads: boolean;
  data_sharing: boolean;
}

const DEFAULT_PERMISSIONS: Omit<UserPermissions, 'id'> = {
  analytics_enabled: true,
  notifications_enabled: true,
  personalized_ads: false,
  data_sharing: false,
};

export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No permissions record, create one
          const { data: newData, error: insertError } = await supabase
            .from('user_permissions')
            .insert({ user_id: user.id, ...DEFAULT_PERMISSIONS })
            .select()
            .single();

          if (insertError) throw insertError;
          setPermissions(newData as UserPermissions);
        } else {
          throw error;
        }
      } else {
        setPermissions(data as UserPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const updatePermission = async (key: keyof Omit<UserPermissions, 'id'>, value: boolean) => {
    if (!user || !permissions) return false;

    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPermissions(prev => prev ? { ...prev, [key]: value } : null);
      return true;
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Ошибка при обновлении');
      return false;
    }
  };

  return {
    permissions,
    loading,
    updatePermission,
    refetch: fetchPermissions,
  };
}
