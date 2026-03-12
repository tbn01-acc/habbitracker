import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Affiliate 2.0 Commission Structure
// БАЗОВЫЙ (без подписки):
//   Level 1 (1-50): 15% L1, 1.5% L2, milestone 250₽/10
//   Level 2 (51+):  20% L1, 1.5% L2, milestone 500₽/25
// PREMIUM (с подпиской):
//   Level 1 (1-50): 25% L1, 2.5% L2, milestone 500₽/10
//   Level 2 (51+):  30% L1, 2.5% L2, milestone 1000₽/25

interface MilestoneBonus {
  threshold: number;
  bonus: number;
  achieved: boolean;
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

function buildMilestones(paidReferrals: number, isPro: boolean): MilestoneBonus[] {
  const milestones: MilestoneBonus[] = [];
  const l1Bonus = isPro ? 500 : 250;
  const l2Bonus = isPro ? 1000 : 500;

  if (paidReferrals <= 50) {
    // Level 1: bonus per every 10 paid referrals
    for (let t = 10; t <= 50; t += 10) {
      milestones.push({ threshold: t, bonus: l1Bonus, achieved: paidReferrals >= t });
    }
  } else {
    // All Level 1 milestones achieved
    for (let t = 10; t <= 50; t += 10) {
      milestones.push({ threshold: t, bonus: l1Bonus, achieved: true });
    }
    // Level 2: bonus per every 25 paid referrals starting from 75
    let t = 75;
    while (t <= paidReferrals + 25) {
      milestones.push({ threshold: t, bonus: l2Bonus, achieved: paidReferrals >= t });
      t += 25;
    }
  }

  return milestones;
}

export function useAffiliateV2() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const calculateStats = useCallback(async () => {
    if (!user) return;

    try {
      // Check subscription status
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, expires_at, is_trial')
        .eq('user_id', user.id)
        .single();

      const userIsPro = sub
        ? sub.plan === 'pro' && !sub.is_trial && (!sub.expires_at || new Date(sub.expires_at) > new Date())
        : false;
      setIsPro(userIsPro);

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      const totalReferrals = referrals?.length || 0;
      const activeReferrals = referrals?.filter(r => r.is_active).length || 0;
      const paidReferrals = referrals?.filter(r => r.referred_has_paid).length || 0;

      const { data: wallet } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const currentLevel: 1 | 2 = paidReferrals <= 50 ? 1 : 2;
      
      // Commission rates based on subscription status and level
      let commissionL1Percent: number;
      let commissionL2Percent: number;
      
      if (userIsPro) {
        commissionL1Percent = currentLevel === 1 ? 25 : 30;
        commissionL2Percent = 2.5;
      } else {
        commissionL1Percent = currentLevel === 1 ? 15 : 20;
        commissionL2Percent = 1.5;
      }

      const allMilestones = buildMilestones(paidReferrals, userIsPro);
      const achievedMilestones = allMilestones.filter(m => m.achieved);
      const nextMilestone = allMilestones.find(m => !m.achieved) || null;

      setStats({
        totalReferrals,
        activeReferrals,
        paidReferrals,
        currentLevel,
        commissionL1Percent,
        commissionL2Percent,
        totalEarned: Number(wallet?.total_earned_rub || 0),
        pendingBalance: Number(wallet?.balance_rub || 0),
        withdrawnTotal: Number(wallet?.total_withdrawn_rub || 0),
        nextMilestone,
        achievedMilestones,
      });
    } catch (err) {
      console.error('Error calculating affiliate stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const getProgressToNextMilestone = useCallback(() => {
    if (!stats || !stats.nextMilestone) return { progress: 100, remaining: 0 };

    const prevThreshold = stats.achievedMilestones.length > 0
      ? stats.achievedMilestones[stats.achievedMilestones.length - 1].threshold
      : 0;

    const range = stats.nextMilestone.threshold - prevThreshold;
    const current = stats.paidReferrals - prevThreshold;

    return {
      progress: Math.min(100, (current / range) * 100),
      remaining: stats.nextMilestone.threshold - stats.paidReferrals,
    };
  }, [stats]);

  const getConversionBonus = useCallback((amountRub: number) => {
    return amountRub * 1.5;
  }, []);

  const calculatePotentialEarnings = useCallback((
    referralCount: number,
    avgPaymentRub: number,
    paymentsPerYear: number,
    forPro: boolean = false
  ) => {
    let totalEarnings = 0;
    let milestoneBonus = 0;

    for (let i = 1; i <= referralCount; i++) {
      let commL1: number;
      if (forPro) {
        commL1 = i <= 50 ? 0.25 : 0.30;
      } else {
        commL1 = i <= 50 ? 0.15 : 0.20;
      }
      totalEarnings += avgPaymentRub * commL1 * paymentsPerYear;

      // Milestone bonuses
      if (i <= 50 && i % 10 === 0) {
        milestoneBonus += forPro ? 500 : 250;
      } else if (i > 50 && i % 25 === 0) {
        milestoneBonus += forPro ? 1000 : 500;
      }
    }

    return {
      commissions: totalEarnings,
      milestones: milestoneBonus,
      total: totalEarnings + milestoneBonus,
    };
  }, []);

  return {
    stats,
    loading,
    isPro,
    getProgressToNextMilestone,
    getConversionBonus,
    calculatePotentialEarnings,
    refetch: calculateStats,
  };
}
