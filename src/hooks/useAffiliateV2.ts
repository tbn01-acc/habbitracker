import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Affiliate 2.0 — READ ONLY.
 *
 * All commission, milestone and balance math now lives in PostgreSQL:
 *   - public.process_referral_commission(payment_id)  (fired by a trigger on
 *     public.payments when a payment becomes "paid")
 *   - public.get_affiliate_summary()                  (read-only aggregate)
 *
 * The client never computes money and can no longer mutate user_wallet or
 * referral_earnings (INSERT/UPDATE/DELETE are revoked for authenticated).
 * This hook only reads calculated values and history.
 */

interface MilestoneBonus {
  threshold: number;
  bonus: number;
  achieved: boolean;
}

export interface AffiliateEarning {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  earning_type: string;
  amount_rub: number;
  commission_percent: number | null;
  milestone_bonus_rub: number | null;
  milestone_type: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  paidReferrals: number;
  currentLevel: 1 | 2;
  commissionL1Percent: number;
  commissionL2Percent: number;
  totalEarned: number;
  pendingBalance: number;
  withdrawnTotal: number;
  nextMilestone: MilestoneBonus | null;
  achievedMilestones: MilestoneBonus[];
}

interface AffiliateSummary {
  total_referrals: number;
  active_referrals: number;
  paid_referrals: number;
  current_level: 1 | 2;
  commission_l1_percent: number;
  commission_l2_percent: number;
  milestone_bonus_rub: number;
  milestone_step: number;
  is_pro: boolean;
  total_earned: number;
  pending_balance: number;
  withdrawn_total: number;
}

/**
 * Presentation-only projection of the milestone ladder. The authoritative
 * bonus amount and step come from the server summary.
 */
function buildMilestones(
  paidReferrals: number,
  step: number,
  bonus: number,
  level: 1 | 2,
): MilestoneBonus[] {
  const milestones: MilestoneBonus[] = [];
  const start = level === 1 ? step : 75;
  const end = Math.max(paidReferrals + step, level === 1 ? 50 : 100);

  for (let t = start; t <= end; t += step) {
    milestones.push({ threshold: t, bonus, achieved: paidReferrals >= t });
  }
  return milestones;
}

export function useAffiliateV2() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setEarnings([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Server-calculated summary (single source of truth)
      const { data, error } = await supabase.rpc('get_affiliate_summary');
      if (error) throw error;

      const s = data as unknown as AffiliateSummary;
      setIsPro(!!s.is_pro);

      const level = (s.current_level === 2 ? 2 : 1) as 1 | 2;
      const all = buildMilestones(
        s.paid_referrals,
        s.milestone_step,
        Number(s.milestone_bonus_rub),
        level,
      );

      setStats({
        totalReferrals: s.total_referrals,
        activeReferrals: s.active_referrals,
        paidReferrals: s.paid_referrals,
        currentLevel: level,
        commissionL1Percent: Number(s.commission_l1_percent),
        commissionL2Percent: Number(s.commission_l2_percent),
        totalEarned: Number(s.total_earned),
        pendingBalance: Number(s.pending_balance),
        withdrawnTotal: Number(s.withdrawn_total),
        achievedMilestones: all.filter(m => m.achieved),
        nextMilestone: all.find(m => !m.achieved) || null,
      });

      // 2. Read-only earnings history
      const { data: earningRows } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      setEarnings((earningRows || []) as AffiliateEarning[]);
    } catch (err) {
      console.error('Error loading affiliate stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getProgressToNextMilestone = useCallback(() => {
    if (!stats || !stats.nextMilestone) return { progress: 100, remaining: 0 };

    const prevThreshold = stats.achievedMilestones.length > 0
      ? stats.achievedMilestones[stats.achievedMilestones.length - 1].threshold
      : 0;

    const range = stats.nextMilestone.threshold - prevThreshold;
    const current = stats.paidReferrals - prevThreshold;

    return {
      progress: range > 0 ? Math.min(100, (current / range) * 100) : 100,
      remaining: stats.nextMilestone.threshold - stats.paidReferrals,
    };
  }, [stats]);

  const getConversionBonus = useCallback((amountRub: number) => amountRub * 1.5, []);

  /**
   * Illustrative calculator for the marketing page only. It mirrors the
   * server rules (Tier 1: 20% + bonus every 10 paid referrals,
   * Tier 2: 30% + 1000₽ every 25 paid referrals) but never affects balances.
   */
  const calculatePotentialEarnings = useCallback((
    referralCount: number,
    avgPaymentRub: number,
    paymentsPerYear: number,
    forPro: boolean = false
  ) => {
    let commissions = 0;
    let milestones = 0;

    for (let i = 1; i <= referralCount; i++) {
      const rate = i <= 50 ? 0.20 : 0.30;
      commissions += avgPaymentRub * rate * paymentsPerYear;

      if (i <= 50 && i % 10 === 0) {
        milestones += forPro ? 1000 : 500;
      } else if (i > 50 && i % 25 === 0) {
        milestones += 1000;
      }
    }

    return { commissions, milestones, total: commissions + milestones };
  }, []);

  return {
    stats,
    earnings,
    loading,
    isPro,
    getProgressToNextMilestone,
    getConversionBonus,
    calculatePotentialEarnings,
    refetch: fetchStats,
  };
}
