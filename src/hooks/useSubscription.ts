import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  period: string | null;
  started_at: string;
  expires_at: string | null;
  bonus_days: number;
}

interface ReferralStats {
  totalReferrals: number;
  paidReferrals: number;
}

export function useSubscription() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({ totalReferrals: 0, paidReferrals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setReferralStats({ totalReferrals: 0, paidReferrals: 0 });
      setLoading(false);
      return;
    }

    fetchSubscription();
    fetchReferralStats();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
    }

    // Map the data to match our interface
    if (data) {
      setSubscription({
        id: data.id,
        user_id: data.user_id,
        plan: data.plan as 'free' | 'pro',
        period: data.period,
        started_at: data.started_at,
        expires_at: data.expires_at,
        bonus_days: data.bonus_days
      });
    } else {
      // Create default free subscription if none exists
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'free',
          bonus_days: 0
        })
        .select()
        .single();

      if (!createError && newSub) {
        setSubscription({
          id: newSub.id,
          user_id: newSub.user_id,
          plan: newSub.plan as 'free' | 'pro',
          period: newSub.period,
          started_at: newSub.started_at,
          expires_at: newSub.expires_at,
          bonus_days: newSub.bonus_days
        });
      }
    }

    setLoading(false);
  };

  const fetchReferralStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    if (error) {
      console.error('Error fetching referrals:', error);
      return;
    }

    const totalReferrals = data?.length || 0;
    const paidReferrals = data?.filter(r => r.referred_has_paid).length || 0;

    setReferralStats({ totalReferrals, paidReferrals });
  };

  const isProActive = () => {
    if (!subscription) return false;
    if (subscription.plan !== 'pro') return false;
    if (!subscription.expires_at) return subscription.plan === 'pro'; // Lifetime
    
    const expiresAt = new Date(subscription.expires_at);
    const bonusDays = subscription.bonus_days || 0;
    expiresAt.setDate(expiresAt.getDate() + bonusDays);
    
    return expiresAt > new Date();
  };

  return {
    subscription,
    referralStats,
    loading,
    isProActive: isProActive(),
    currentPlan: isProActive() ? 'pro' : 'free' as 'free' | 'pro',
    referralCode: profile?.referral_code || null,
    refetchSubscription: fetchSubscription,
    refetchReferralStats: fetchReferralStats
  };
}
