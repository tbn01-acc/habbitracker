import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscriptionContext as useSubscription } from '@/contexts/SubscriptionContext';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  paidReferrals: number;
  pendingActivation: number;
}

interface WalletData {
  balance_rub: number;
  total_earned_rub: number;
  total_withdrawn_rub: number;
  bonus_weeks_earned: number;
}

interface ReferralDetail {
  id: string;
  referred_id: string;
  is_active: boolean;
  referred_has_paid: boolean;
  active_days: number;
  total_time_minutes: number;
  created_at: string;
  activated_at: string | null;
}

interface EarningRecord {
  id: string;
  earning_type: 'registration_bonus' | 'payment_commission';
  amount_rub: number;
  bonus_weeks: number;
  commission_percent: number | null;
  created_at: string;
}

interface PeriodStats {
  month: ReferralStats;
  quarter: ReferralStats;
  year: ReferralStats;
}

export function useReferralProgram() {
  const { user } = useAuth();
  const { subscription, isProActive } = useSubscription();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    paidReferrals: 0,
    pendingActivation: 0,
  });
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [referrals, setReferrals] = useState<ReferralDetail[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferralData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch referrals
      const { data: referralsData, error: refError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      if (refError) throw refError;

      const refs = (referralsData || []) as ReferralDetail[];
      setReferrals(refs);

      const totalReferrals = refs.length;
      const activeReferrals = refs.filter(r => r.is_active).length;
      const paidReferrals = refs.filter(r => r.referred_has_paid).length;
      const pendingActivation = refs.filter(r => !r.is_active && !r.referred_has_paid).length;

      setStats({
        totalReferrals,
        activeReferrals,
        paidReferrals,
        pendingActivation,
      });

      // Calculate period stats
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const calcPeriodStats = (since: Date): ReferralStats => {
        const periodRefs = refs.filter(r => new Date(r.created_at) >= since);
        return {
          totalReferrals: periodRefs.length,
          activeReferrals: periodRefs.filter(r => r.is_active).length,
          paidReferrals: periodRefs.filter(r => r.referred_has_paid).length,
          pendingActivation: periodRefs.filter(r => !r.is_active && !r.referred_has_paid).length,
        };
      };

      setPeriodStats({
        month: calcPeriodStats(monthAgo),
        quarter: calcPeriodStats(quarterAgo),
        year: calcPeriodStats(yearAgo),
      });

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Wallet error:', walletError);
      }

      if (walletData) {
        setWallet(walletData as WalletData);
      } else {
        // Create wallet if doesn't exist
        const { data: newWallet } = await supabase
          .from('user_wallet')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (newWallet) {
          setWallet(newWallet as WalletData);
        }
      }

      // Fetch earnings
      const { data: earningsData } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (earningsData) {
        setEarnings(earningsData as EarningRecord[]);
      }

    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  // Calculate bonus based on new rules
  const calculateBonus = useCallback(() => {
    const isPro = isProActive;
    const isLifetime = subscription?.period === 'lifetime';
    const paidWithMoney = isPro && !subscription?.is_trial;

    let bonusWeeks = 0;
    let commissionPercent = 0;

    if (paidWithMoney || isLifetime) {
      // PRO users: +2 weeks per active referral
      bonusWeeks = stats.activeReferrals * 2;

      // Commission for paid referrals
      if (stats.paidReferrals >= 26) {
        commissionPercent = 15;
      } else if (stats.paidReferrals >= 11) {
        commissionPercent = 10;
      } else if (stats.paidReferrals >= 1) {
        commissionPercent = 5;
      }
    } else {
      // FREE users: +1 week per active referral
      bonusWeeks = stats.activeReferrals;

      // Bonus weeks for paid referrals (cumulative)
      const paid = stats.paidReferrals;
      if (paid >= 26) {
        bonusWeeks += 10 * 2 + 15 * 3 + (paid - 25) * 4; // 1-10: 2wks, 11-25: 3wks, 26+: 4wks
      } else if (paid >= 11) {
        bonusWeeks += 10 * 2 + (paid - 10) * 3;
      } else if (paid >= 1) {
        bonusWeeks += paid * 2;
      }
    }

    return { bonusWeeks, commissionPercent };
  }, [stats, subscription, isProActive]);

  // Calculate earnings for next referral
  const getNextReferralBonus = useCallback(() => {
    const isPro = isProActive && !subscription?.is_trial;
    const currentPaid = stats.paidReferrals;

    if (isPro) {
      // PRO user - show commission
      let currentPercent = 0;
      let nextPercent = 5;
      let refsToNext = 1;

      if (currentPaid >= 26) {
        currentPercent = 15;
        nextPercent = 15;
        refsToNext = 0;
      } else if (currentPaid >= 11) {
        currentPercent = 10;
        nextPercent = 15;
        refsToNext = 26 - currentPaid;
      } else if (currentPaid >= 1) {
        currentPercent = 5;
        nextPercent = 10;
        refsToNext = 11 - currentPaid;
      } else {
        currentPercent = 0;
        nextPercent = 5;
        refsToNext = 1;
      }

      return { type: 'commission', currentPercent, nextPercent, refsToNext };
    } else {
      // FREE user - show weeks
      let currentWeeks = 2;
      let nextWeeks = 2;
      let refsToNext = 1;

      if (currentPaid >= 26) {
        currentWeeks = 4;
        nextWeeks = 4;
        refsToNext = 0;
      } else if (currentPaid >= 11) {
        currentWeeks = 3;
        nextWeeks = 4;
        refsToNext = 26 - currentPaid;
      } else if (currentPaid >= 1) {
        currentWeeks = 2;
        nextWeeks = 3;
        refsToNext = 11 - currentPaid;
      }

      return { type: 'weeks', currentWeeks, nextWeeks, refsToNext };
    }
  }, [stats.paidReferrals, subscription, isProActive]);

  return {
    stats,
    periodStats,
    wallet,
    referrals,
    earnings,
    loading,
    calculateBonus,
    getNextReferralBonus,
    refetch: fetchReferralData,
  };
}
