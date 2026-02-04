import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Track user activity for referral activation
export function useReferralActivityTracker() {
  const { user } = useAuth();
  const sessionStartRef = useRef<Date | null>(null);
  const lastActivityRef = useRef<Date | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_THRESHOLD = 2 * 60 * 1000; // 2 minutes of inactivity = pause tracking
  const SAVE_INTERVAL = 60 * 1000; // Save every minute

  const saveActivity = useCallback(async (minutes: number) => {
    if (!user || minutes <= 0) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // Upsert activity for today
      const { data: existing } = await supabase
        .from('referral_activity_log')
        .select('id, time_spent_minutes')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .single();

      if (existing) {
        await supabase
          .from('referral_activity_log')
          .update({ 
            time_spent_minutes: (existing.time_spent_minutes || 0) + minutes 
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('referral_activity_log')
          .insert({
            user_id: user.id,
            activity_date: today,
            time_spent_minutes: minutes,
          });
      }

      // Check and update referral activation status
      await updateReferralActivation();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  }, [user]);

  const updateReferralActivation = useCallback(async () => {
    if (!user) return;

    try {
      // Get total activity for this user
      const { data: activityData } = await supabase
        .from('referral_activity_log')
        .select('activity_date, time_spent_minutes')
        .eq('user_id', user.id);

      if (!activityData) return;

      const uniqueDays = activityData.length;
      const totalMinutes = activityData.reduce((sum, a) => sum + (a.time_spent_minutes || 0), 0);

      // Check if user meets activation criteria (7+ days, 30+ minutes)
      const isActive = uniqueDays >= 7 && totalMinutes >= 30;

      // Update referral record if this user was referred
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, is_active')
        .eq('referred_id', user.id)
        .single();

      if (referral && !referral.is_active && isActive) {
        await supabase
          .from('referrals')
          .update({
            is_active: true,
            activated_at: new Date().toISOString(),
            active_days: uniqueDays,
            total_time_minutes: totalMinutes,
          })
          .eq('id', referral.id);

        // Award bonus to referrer
        await awardReferrerBonus(referral.id);
      } else if (referral) {
        // Update stats even if not yet active
        await supabase
          .from('referrals')
          .update({
            active_days: uniqueDays,
            total_time_minutes: totalMinutes,
          })
          .eq('id', referral.id);
      }
    } catch (error) {
      console.error('Error updating referral activation:', error);
    }
  }, [user]);

  const awardReferrerBonus = useCallback(async (referralId: string) => {
    try {
      // Get referral details
      const { data: referral } = await supabase
        .from('referrals')
        .select('referrer_id, referred_id')
        .eq('id', referralId)
        .single();

      if (!referral) return;

      // Check if bonus already awarded
      const { data: existingBonus } = await supabase
        .from('referral_earnings')
        .select('id')
        .eq('referrer_id', referral.referrer_id)
        .eq('referred_id', referral.referred_id)
        .eq('earning_type', 'registration_bonus')
        .single();

      if (existingBonus) return;

      // Get referrer subscription to determine bonus
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, is_trial, period')
        .eq('user_id', referral.referrer_id)
        .single();

      const isPro = sub?.plan === 'pro' && !sub?.is_trial;
      const bonusWeeks = isPro ? 2 : 1;

      // Create earning record
      await supabase
        .from('referral_earnings')
        .insert({
          referrer_id: referral.referrer_id,
          referred_id: referral.referred_id,
          earning_type: 'registration_bonus',
          bonus_weeks: bonusWeeks,
        });

      // Update wallet
      await supabase
        .from('user_wallet')
        .upsert({
          user_id: referral.referrer_id,
          bonus_weeks_earned: bonusWeeks,
        }, {
          onConflict: 'user_id',
        });

      // Extend subscription
      await extendSubscription(referral.referrer_id, bonusWeeks * 7);
    } catch (error) {
      console.error('Error awarding referrer bonus:', error);
    }
  }, []);

  const extendSubscription = async (userId: string, days: number) => {
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!sub) return;

      const currentExpiry = sub.expires_at ? new Date(sub.expires_at) : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);

      await supabase
        .from('subscriptions')
        .update({
          expires_at: newExpiry.toISOString(),
          plan: 'pro',
          bonus_days: (sub.bonus_days || 0) + days,
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error extending subscription:', error);
    }
  };

  const handleActivity = useCallback(() => {
    const now = new Date();
    lastActivityRef.current = now;

    // Clear inactivity timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Start session if not started
    if (!sessionStartRef.current) {
      sessionStartRef.current = now;
    }

    // Set inactivity timeout
    inactivityTimeoutRef.current = setTimeout(() => {
      // User inactive - save current session
      if (sessionStartRef.current && lastActivityRef.current) {
        const minutes = Math.floor(
          (lastActivityRef.current.getTime() - sessionStartRef.current.getTime()) / 60000
        );
        saveActivity(minutes);
        sessionStartRef.current = null;
      }
    }, INACTIVITY_THRESHOLD);
  }, [saveActivity]);

  useEffect(() => {
    if (!user) return;

    // Track various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial session
    handleActivity();

    // Periodic save
    saveIntervalRef.current = setInterval(() => {
      if (sessionStartRef.current) {
        const now = new Date();
        const minutes = Math.floor(
          (now.getTime() - sessionStartRef.current.getTime()) / 60000
        );
        if (minutes > 0) {
          saveActivity(minutes);
          sessionStartRef.current = now; // Reset session start
        }
      }
    }, SAVE_INTERVAL);

    // Save on page unload - используем прокси URL
    const handleUnload = () => {
      if (sessionStartRef.current && lastActivityRef.current) {
        const minutes = Math.floor(
          (lastActivityRef.current.getTime() - sessionStartRef.current.getTime()) / 60000
        );
        // Use sendBeacon for reliable unload saving through proxy
        if (minutes > 0) {
          const proxyUrl = `${window.location.origin}/api/db/rest/v1/referral_activity_log`;
          navigator.sendBeacon?.(
            proxyUrl,
            JSON.stringify({
              user_id: user.id,
              activity_date: new Date().toISOString().split('T')[0],
              time_spent_minutes: minutes,
            })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('beforeunload', handleUnload);
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      // Save remaining time
      if (sessionStartRef.current && lastActivityRef.current) {
        const minutes = Math.floor(
          (lastActivityRef.current.getTime() - sessionStartRef.current.getTime()) / 60000
        );
        saveActivity(minutes);
      }
    };
  }, [user, handleActivity, saveActivity]);

  return null;
}
