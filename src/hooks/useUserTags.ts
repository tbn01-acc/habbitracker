import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';

export interface UserTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useUserTags() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!user) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const addTag = async (name: string, color: string = '#6366f1') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_tags')
        .insert({ user_id: user.id, name: name.trim(), color })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error(t('tagAlreadyExists'));
        } else {
          throw error;
        }
        return null;
      }

      setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(t('tagCreated'));
      return data;
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error(t('error'));
      return null;
    }
  };

  const updateTag = async (id: string, name: string, color: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_tags')
        .update({ name: name.trim(), color })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error(t('tagAlreadyExists'));
        } else {
          throw error;
        }
        return false;
      }

      setTags(prev => 
        prev.map(tag => tag.id === id ? { ...tag, name, color } : tag)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(t('save'));
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(t('error'));
      return false;
    }
  };

  const deleteTag = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTags(prev => prev.filter(tag => tag.id !== id));
      toast.success(t('delete'));
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error(t('error'));
      return false;
    }
  };

  return {
    tags,
    loading,
    addTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  };
}
