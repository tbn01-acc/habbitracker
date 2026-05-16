import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStars } from './useStars';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export interface ShopReward {
  id: string;
  name: string;
  description: string | null;
  price_stars: number;
  reward_type: string;
  reward_value: {
    freeze_days?: number;
    discount_percent?: number;
  } | null;
  is_active: boolean;
}

export interface PurchasedReward {
  id: string;
  user_id: string;
  reward_id: string;
  stars_spent: number;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  reward?: ShopReward;
}

export function useRewardsShop() {
  const { user } = useAuth();
  const { userStars, refetch: refetchStars } = useStars();
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [purchasedRewards, setPurchasedRewards] = useState<PurchasedReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rewards_shop')
        .select('*')
        .eq('is_active', true)
        .order('price_stars', { ascending: true });

      if (error) throw error;
      setRewards((data || []).map(r => ({
        ...r,
        reward_value: r.reward_value as ShopReward['reward_value']
      })));
    } catch (err) {
      console.error('Error fetching rewards:', err);
    }
  }, []);

  const fetchPurchasedRewards = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('purchased_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch rewards separately
      const rewardIds = [...new Set((data || []).map(pr => pr.reward_id))];
      const { data: rewardsData } = await supabase
        .from('rewards_shop')
        .select('*')
        .in('id', rewardIds);

      const rewardsMap = (rewardsData || []).reduce((acc, r) => {
        acc[r.id] = { ...r, reward_value: r.reward_value as ShopReward['reward_value'] };
        return acc;
      }, {} as Record<string, ShopReward>);
      
      setPurchasedRewards((data || []).map(pr => ({
        ...pr,
        reward: rewardsMap[pr.reward_id]
      })));
    } catch (err) {
      console.error('Error fetching purchased rewards:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRewards();
    fetchPurchasedRewards();
  }, [fetchRewards, fetchPurchasedRewards]);

  const purchaseReward = useCallback(async (rewardId: string): Promise<boolean> => {
    if (!user || !userStars) {
      toast.error('Войдите в аккаунт');
      return false;
    }

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      toast.error('Награда не найдена');
      return false;
    }

    if (userStars.total_stars < reward.price_stars) {
      toast.error('Недостаточно звезд', {
        description: `Нужно ${reward.price_stars} ⭐, у вас ${userStars.total_stars} ⭐`
      });
      return false;
    }

    try {
      const { error } = await supabase.rpc('purchase_shop_reward', { p_reward_id: rewardId });
      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('insufficient_stars')) {
          toast.error('Недостаточно звезд');
        } else if (msg.includes('reward_not_found')) {
          toast.error('Награда не найдена');
        } else {
          toast.error('Ошибка покупки');
        }
        return false;
      }

      toast.success('Награда куплена!', {
        description: reward.name
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#8b5cf6', '#10b981']
      });

      refetchStars();
      fetchPurchasedRewards();
      
      return true;
    } catch (err) {
      console.error('Error purchasing reward:', err);
      toast.error('Ошибка покупки');
      return false;
    }
  }, [user, userStars, rewards, refetchStars, fetchPurchasedRewards]);

  const useReward = useCallback(async (purchasedRewardId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('purchased_rewards')
        .update({
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', purchasedRewardId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Награда использована!');
      fetchPurchasedRewards();
      
      return true;
    } catch (err) {
      console.error('Error using reward:', err);
      return false;
    }
  }, [user, fetchPurchasedRewards]);

  const getUnusedRewards = useCallback(() => {
    return purchasedRewards.filter(pr => !pr.is_used);
  }, [purchasedRewards]);

  const hasUnusedFreeze = useCallback(() => {
    return purchasedRewards.some(
      pr => !pr.is_used && pr.reward?.reward_type === 'freeze'
    );
  }, [purchasedRewards]);

  const getAvailableDiscount = useCallback(() => {
    const discountReward = purchasedRewards.find(
      pr => !pr.is_used && pr.reward?.reward_type === 'pro_discount'
    );
    return discountReward?.reward?.reward_value?.discount_percent || 0;
  }, [purchasedRewards]);

  return {
    rewards,
    purchasedRewards,
    loading,
    userStars: userStars?.total_stars || 0,
    purchaseReward,
    useReward,
    getUnusedRewards,
    hasUnusedFreeze,
    getAvailableDiscount,
    refetch: fetchPurchasedRewards
  };
}
