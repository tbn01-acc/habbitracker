import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStars } from './useStars';
import { SpreadLevel } from './useBalanceSpread';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const DAILY_BALANCE_BONUS_KEY = 'daily_balance_bonus_last_awarded';
const BALANCE_STABLE_SINCE_KEY = 'balance_stable_since';
const BONUS_STARS = 5;
const REQUIRED_HOURS = 24;

interface DailyBalanceBonusState {
  isEligible: boolean;
  hoursRemaining: number;
  stableSince: Date | null;
  lastAwarded: string | null;
}

export function useDailyBalanceBonus() {
  const { user } = useAuth();
  const { addStars } = useStars();
  const [state, setState] = useState<DailyBalanceBonusState>({
    isEligible: false,
    hoursRemaining: REQUIRED_HOURS,
    stableSince: null,
    lastAwarded: null,
  });

  // Check if we already awarded today
  const hasAwardedToday = useCallback((): boolean => {
    const lastAwarded = localStorage.getItem(DAILY_BALANCE_BONUS_KEY);
    if (!lastAwarded) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return lastAwarded === today;
  }, []);

  // Get the timestamp when stability started
  const getStableSince = useCallback((): Date | null => {
    const stored = localStorage.getItem(BALANCE_STABLE_SINCE_KEY);
    if (!stored) return null;
    
    try {
      return new Date(stored);
    } catch {
      return null;
    }
  }, []);

  // Mark stability start time
  const markStabilityStart = useCallback(() => {
    const existing = getStableSince();
    if (!existing) {
      localStorage.setItem(BALANCE_STABLE_SINCE_KEY, new Date().toISOString());
    }
  }, [getStableSince]);

  // Reset stability tracking (when spread goes above 10)
  const resetStabilityTracking = useCallback(() => {
    localStorage.removeItem(BALANCE_STABLE_SINCE_KEY);
    setState(prev => ({
      ...prev,
      isEligible: false,
      hoursRemaining: REQUIRED_HOURS,
      stableSince: null,
    }));
  }, []);

  // Calculate hours since stability started
  const calculateHoursSinceStable = useCallback((): number => {
    const stableSince = getStableSince();
    if (!stableSince) return 0;
    
    const now = new Date();
    const diffMs = now.getTime() - stableSince.getTime();
    return diffMs / (1000 * 60 * 60);
  }, [getStableSince]);

  // Check eligibility and award bonus if qualified
  const checkAndAwardBonus = useCallback(async (currentLevel: SpreadLevel): Promise<boolean> => {
    if (!user) return false;

    // Level must be stability or topFocus (Spread <= 10)
    const isStable = currentLevel === 'stability' || currentLevel === 'topFocus';
    
    if (!isStable) {
      resetStabilityTracking();
      return false;
    }

    // Mark when stability started (if not already marked)
    markStabilityStart();

    // Check if already awarded today
    if (hasAwardedToday()) {
      setState(prev => ({
        ...prev,
        isEligible: false,
        lastAwarded: localStorage.getItem(DAILY_BALANCE_BONUS_KEY),
      }));
      return false;
    }

    // Check if 24 hours have passed
    const hoursSinceStable = calculateHoursSinceStable();
    const hoursRemaining = Math.max(0, REQUIRED_HOURS - hoursSinceStable);
    
    setState(prev => ({
      ...prev,
      stableSince: getStableSince(),
      hoursRemaining,
      isEligible: hoursSinceStable >= REQUIRED_HOURS,
    }));

    if (hoursSinceStable >= REQUIRED_HOURS) {
      // Award the bonus!
      const success = await addStars(
        BONUS_STARS,
        'daily_balance_bonus',
        'Бонус за баланс: 24ч со Spread < 10'
      );

      if (success) {
        // Mark as awarded today
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(DAILY_BALANCE_BONUS_KEY, today);
        
        // Reset the stable-since timer for next 24h cycle
        localStorage.setItem(BALANCE_STABLE_SINCE_KEY, new Date().toISOString());

        // Celebration
        toast.success(`+${BONUS_STARS} ⭐`, {
          description: 'Бонус за стабильный баланс 24ч!',
          duration: 5000,
        });

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6'],
        });

        setState(prev => ({
          ...prev,
          isEligible: false,
          lastAwarded: today,
          hoursRemaining: REQUIRED_HOURS,
          stableSince: new Date(),
        }));

        // Also save to balance_status_history for tracking
        await supabase
          .from('balance_status_history')
          .insert({
            user_id: user.id,
            level: currentLevel,
            spread: 0, // Will be updated by the caller
            min_value: 0,
            max_value: 0,
            all_spheres_above_minimum: true,
            stars_awarded: BONUS_STARS,
          });

        return true;
      }
    }

    return false;
  }, [user, addStars, hasAwardedToday, markStabilityStart, resetStabilityTracking, calculateHoursSinceStable, getStableSince]);

  // Update state periodically when mounted
  useEffect(() => {
    const stableSince = getStableSince();
    const lastAwarded = localStorage.getItem(DAILY_BALANCE_BONUS_KEY);
    const hoursSinceStable = calculateHoursSinceStable();
    
    setState({
      isEligible: hoursSinceStable >= REQUIRED_HOURS && !hasAwardedToday(),
      hoursRemaining: Math.max(0, REQUIRED_HOURS - hoursSinceStable),
      stableSince,
      lastAwarded,
    });
  }, [getStableSince, calculateHoursSinceStable, hasAwardedToday]);

  return {
    ...state,
    bonusStars: BONUS_STARS,
    requiredHours: REQUIRED_HOURS,
    checkAndAwardBonus,
    resetStabilityTracking,
  };
}
