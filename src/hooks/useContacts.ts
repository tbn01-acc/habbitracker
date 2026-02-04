import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Contact } from '@/types/sphere';

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchContactsBySphere = useCallback(async (sphereId: number) => {
    if (!user) return [];

    try {
      const { data: sphereContacts } = await supabase
        .from('contact_spheres')
        .select('contact_id')
        .eq('user_id', user.id)
        .eq('sphere_id', sphereId);

      if (!sphereContacts || sphereContacts.length === 0) return [];

      const contactIds = sphereContacts.map(sc => sc.contact_id);
      
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds);

      return data || [];
    } catch (err) {
      console.error('Error fetching contacts by sphere:', err);
      return [];
    }
  }, [user]);

  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding contact:', err);
      return null;
    }
  }, [user]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (err) {
      console.error('Error updating contact:', err);
      return null;
    }
  }, [user]);

  const deleteContact = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setContacts(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      return false;
    }
  }, [user]);

  const linkContactToSphere = useCallback(async (contactId: string, sphereId: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contact_spheres')
        .upsert({
          contact_id: contactId,
          sphere_id: sphereId,
          user_id: user.id,
        }, { onConflict: 'contact_id,sphere_id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error linking contact to sphere:', err);
      return false;
    }
  }, [user]);

  const unlinkContactFromSphere = useCallback(async (contactId: string, sphereId: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contact_spheres')
        .delete()
        .eq('contact_id', contactId)
        .eq('sphere_id', sphereId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error unlinking contact from sphere:', err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    fetchContacts,
    fetchContactsBySphere,
    addContact,
    updateContact,
    deleteContact,
    linkContactToSphere,
    unlinkContactFromSphere,
  };
}
