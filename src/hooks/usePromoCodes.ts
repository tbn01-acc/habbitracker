import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  bonus_stars: number;
  bonus_days: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePromoCodeInput {
  code: string;
  discount_percent: number;
  bonus_stars?: number;
  bonus_days?: number;
  valid_until?: string | null;
  max_uses?: number | null;
  description?: string;
}

export function usePromoCodes() {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromoCodes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes((data as PromoCode[]) || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const createPromoCode = async (input: CreatePromoCodeInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: input.code.toUpperCase(),
          discount_percent: input.discount_percent,
          bonus_stars: input.bonus_stars || 0,
          bonus_days: input.bonus_days || 0,
          valid_until: input.valid_until || null,
          max_uses: input.max_uses || null,
          description: input.description || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Промо-код создан');
      fetchPromoCodes();
      return true;
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      if (error.code === '23505') {
        toast.error('Промо-код с таким именем уже существует');
      } else {
        toast.error('Ошибка создания промо-кода');
      }
      return false;
    }
  };

  const updatePromoCode = async (id: string, updates: Partial<PromoCode>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Промо-код обновлён');
      fetchPromoCodes();
      return true;
    } catch (error) {
      console.error('Error updating promo code:', error);
      toast.error('Ошибка обновления промо-кода');
      return false;
    }
  };

  const deletePromoCode = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Промо-код удалён');
      setPromoCodes(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Ошибка удаления промо-кода');
      return false;
    }
  };

  const togglePromoCode = async (id: string, isActive: boolean): Promise<boolean> => {
    return updatePromoCode(id, { is_active: isActive });
  };

  const validatePromoCode = async (code: string): Promise<PromoCode | null> => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) {
        toast.error('Промо-код не найден или недействителен');
        return null;
      }

      const promoCode = data as PromoCode;

      // Check if expired
      if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
        toast.error('Срок действия промо-кода истёк');
        return null;
      }

      // Check max uses
      if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
        toast.error('Промо-код исчерпан');
        return null;
      }

      return promoCode;
    } catch (error) {
      console.error('Error validating promo code:', error);
      return null;
    }
  };

  const usePromoCode = async (promoCodeId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Record usage
      const { error: useError } = await supabase
        .from('promo_code_uses')
        .insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
        });

      if (useError) {
        if (useError.code === '23505') {
          toast.error('Вы уже использовали этот промо-код');
        }
        throw useError;
      }

      // Increment usage counter - get current value first
      const { data: currentPromo } = await supabase
        .from('promo_codes')
        .select('current_uses')
        .eq('id', promoCodeId)
        .single();
      
      if (currentPromo) {
        const { error: updateError } = await supabase
          .from('promo_codes')
          .update({ current_uses: (currentPromo.current_uses || 0) + 1 })
          .eq('id', promoCodeId);

        if (updateError) throw updateError;
      }

      toast.success('Промо-код активирован!');
      return true;
    } catch (error) {
      console.error('Error using promo code:', error);
      return false;
    }
  };

  return {
    promoCodes,
    loading,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    togglePromoCode,
    validatePromoCode,
    usePromoCode,
    refetch: fetchPromoCodes,
  };
}
