import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';

export function useReferralNotifications() {
  const { user } = useAuth();
  const { t } = useTranslation();

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
            toast.success(t('bonusAwarded'), {
              description: `+${earning.bonus_weeks || 1} ${t('weeksBonus')}`,
            });
          } else if (earning.earning_type === 'payment_commission') {
            toast.success(t('commissionEarned'), {
              description: `+${earning.amount_rub || 0}₽ (${earning.commission_percent || 0}%)`,
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
          };
          const oldReferral = payload.old as {
            is_active: boolean;
          };

          if (referral.is_active && !oldReferral.is_active) {
            toast.success(t('referralActivated'), {
              description: t('referralBecameActive'),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(referralsChannel);
    };
  }, [user, t]);

  return null;
}
