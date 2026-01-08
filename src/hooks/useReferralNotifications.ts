import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';
import confetti from 'canvas-confetti';

const triggerLevelUpConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#8b5cf6', '#a855f7', '#c084fc', '#fbbf24', '#f59e0b'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#8b5cf6', '#a855f7', '#c084fc', '#fbbf24', '#f59e0b'],
    });
  }, 250);
};

export function useReferralNotifications() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const previousStats = useRef<{ paidReferrals: number; activeReferrals: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to referral_earnings changes
    const channel = supabase
      .channel('referral_earnings_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referral_earnings',
          filter: `referrer_id=eq.${user.id}`,
        },
        (payload) => {
          const earning = payload.new as {
            earning_type: string;
            bonus_weeks: number | null;
            amount_rub: number | null;
            commission_percent: number | null;
          };

          if (earning.earning_type === 'registration_bonus') {
            toast.success(isRussian ? '🎉 Бонус начислен!' : '🎉 Bonus awarded!', {
              description: `+${earning.bonus_weeks || 1} ${isRussian ? 'недель PRO' : 'weeks PRO'}`,
            });
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10b981', '#34d399', '#6ee7b7'],
            });
          } else if (earning.earning_type === 'payment_commission') {
            toast.success(isRussian ? '💰 Комиссия получена!' : '💰 Commission earned!', {
              description: `+${earning.amount_rub || 0}₽ (${earning.commission_percent || 0}%)`,
            });
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.5 },
              colors: ['#fbbf24', '#f59e0b', '#d97706'],
            });
          }
        }
      )
      .subscribe();

    // Subscribe to referrals activation
    const referralsChannel = supabase
      .channel('referrals_activation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        (payload) => {
          const referral = payload.new as {
            is_active: boolean;
            referred_has_paid: boolean;
          };
          const oldReferral = payload.old as {
            is_active: boolean;
            referred_has_paid: boolean;
          };

          // Check for level up on activation
          if (referral.is_active && !oldReferral.is_active) {
            toast.success(isRussian ? '✅ Реферал активирован!' : '✅ Referral activated!', {
              description: isRussian ? 'Бонус за активного реферала начислен' : 'Active referral bonus awarded',
            });
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#8b5cf6', '#a855f7', '#c084fc'],
            });
          }

          // Level up notification for paid referrals
          if (referral.referred_has_paid && !oldReferral.referred_has_paid) {
            toast.success(isRussian ? '🏆 Новый уровень!' : '🏆 Level up!', {
              description: isRussian ? 'Реферал оплатил подписку!' : 'Referral paid for subscription!',
              duration: 5000,
            });
            triggerLevelUpConfetti();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(referralsChannel);
    };
  }, [user, isRussian]);

  return null;
}
