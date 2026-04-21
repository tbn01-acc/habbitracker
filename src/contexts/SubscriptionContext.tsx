import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  period: string | null;
  started_at: string;
  expires_at: string | null;
  bonus_days: number;
  is_trial: boolean;
  trial_bonus_months: number;
  trial_ends_at: string | null;
}

interface ReferralStats {
  totalReferrals: number;
  paidReferrals: number;
}

interface SubscriptionContextValue {
  subscription: Subscription | null;
  referralStats: ReferralStats;
  loading: boolean;
  userRole: string | null;
  isTeamMember: boolean;
  isProActive: boolean;
  isInTrial: boolean;
  trialDaysLeft: number;
  trialBonusMonths: number;
  currentPlan: 'free' | 'pro';
  referralCode: string | null;
  refetchSubscription: () => Promise<void>;
  refetchReferralStats: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
  user: User | null;
  referralCode: string | null;
}

export function SubscriptionProvider({ children, user, referralCode }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({ totalReferrals: 0, paidReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchUserRole = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUserRole(data.role);
    }
  }, [user]);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
    }

    if (data) {
      setSubscription({
        id: data.id,
        user_id: data.user_id,
        plan: data.plan as 'free' | 'pro',
        period: data.period,
        started_at: data.started_at,
        expires_at: data.expires_at,
        bonus_days: data.bonus_days,
        is_trial: (data as any).is_trial ?? false,
        trial_bonus_months: (data as any).trial_bonus_months ?? 0,
        trial_ends_at: (data as any).trial_ends_at ?? null
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
          bonus_days: newSub.bonus_days,
          is_trial: (newSub as any).is_trial ?? false,
          trial_bonus_months: (newSub as any).trial_bonus_months ?? 0,
          trial_ends_at: (newSub as any).trial_ends_at ?? null
        });
      }
    }
  }, [user]);

  const fetchReferralStats = useCallback(async () => {
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
  }, [user]);

  // Load all data on user change - ONE TIME fetch
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setReferralStats({ totalReferrals: 0, paidReferrals: 0 });
      setUserRole(null);
      setLoading(false);
      setInitialized(false);
      return;
    }

    if (initialized) return;

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchSubscription(),
        fetchReferralStats(),
        fetchUserRole()
      ]);
      setLoading(false);
      setInitialized(true);
    };

    loadAll();
  }, [user, initialized, fetchSubscription, fetchReferralStats, fetchUserRole]);

  // Subscribe to realtime updates for subscription changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            setSubscription({
              id: data.id,
              user_id: data.user_id,
              plan: data.plan as 'free' | 'pro',
              period: data.period,
              started_at: data.started_at,
              expires_at: data.expires_at,
              bonus_days: data.bonus_days,
              is_trial: data.is_trial ?? false,
              trial_bonus_months: data.trial_bonus_months ?? 0,
              trial_ends_at: data.trial_ends_at ?? null
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Team role gets PRO access automatically
  const isTeamMember = userRole === 'team' || userRole === 'admin' || userRole === 'moderator';

  const isProActive = (() => {
    if (isTeamMember) return true;
    if (!subscription) return false;
    if (subscription.plan !== 'pro') return false;
    if (!subscription.expires_at) return subscription.plan === 'pro'; // Lifetime
    
    const expiresAt = new Date(subscription.expires_at);
    const bonusDays = subscription.bonus_days || 0;
    expiresAt.setDate(expiresAt.getDate() + bonusDays);
    
    return expiresAt > new Date();
  })();

  const isInTrial = (() => {
    if (isTeamMember) return false;
    if (!subscription) return false;
    if (!subscription.is_trial) return false;
    if (!subscription.trial_ends_at) return false;
    return new Date(subscription.trial_ends_at) > new Date();
  })();

  const trialDaysLeft = (() => {
    if (!subscription?.trial_ends_at) return 0;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const value: SubscriptionContextValue = {
    subscription,
    referralStats,
    loading,
    userRole,
    isTeamMember,
    isProActive,
    isInTrial,
    trialDaysLeft,
    trialBonusMonths: subscription?.trial_bonus_months || 0,
    currentPlan: isProActive ? 'pro' : 'free',
    referralCode,
    refetchSubscription: fetchSubscription,
    refetchReferralStats: fetchReferralStats
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
