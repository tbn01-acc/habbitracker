import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type LegalDocumentType = 'terms' | 'privacy' | 'data_processing' | 'public_offer' | 'help_support';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  title: string;
  content: string;
  version: number;
  updated_at: string;
}

export function useLegalDocuments() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('type');

      if (error) throw error;
      setDocuments(data as LegalDocument[] || []);
    } catch (error) {
      console.error('Error fetching legal documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminRole = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    checkAdminRole();
  }, [checkAdminRole]);

  const updateDocument = async (type: string, title: string, content: string) => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('legal_documents')
        .update({ 
          title, 
          content, 
          version: documents.find(d => d.type === type)?.version || 1 + 1,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        })
        .eq('type', type);

      if (error) throw error;

      await fetchDocuments();
      toast.success('Документ обновлён');
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Ошибка при обновлении');
      return false;
    }
  };

  const getDocument = (type: LegalDocumentType) => {
    return documents.find(d => d.type === type);
  };

  return {
    documents,
    loading,
    adminLoading,
    isAdmin,
    getDocument,
    updateDocument,
    refetch: fetchDocuments,
  };
}
