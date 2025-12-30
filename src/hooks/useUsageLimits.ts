import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { useGuestMode } from './useGuestMode';
import { useAuth } from './useAuth';

export interface UsageLimits {
  habits: { current: number; max: number; canAdd: boolean };
  tasks: { current: number; max: number; canAdd: boolean };
  transactions: { current: number; max: number; canAdd: boolean };
}

const FREE_LIMITS = {
  habits: 3,
  tasks: 3,
  transactions: 15,
};

const PRO_LIMITS = {
  habits: Infinity,
  tasks: Infinity,
  transactions: Infinity,
};

export function useUsageLimits() {
  const { user } = useAuth();
  const { isProActive, isInTrial } = useSubscription();
  const { isActive: isGuestModeActive } = useGuestMode();

  // PRO access: either paid PRO, in trial, or guest mode active (24h)
  const hasProAccess = useMemo(() => {
    // Logged in users: check subscription/trial
    if (user) {
      return isProActive || isInTrial;
    }
    // Guest users: check 24h guest mode
    return isGuestModeActive;
  }, [user, isProActive, isInTrial, isGuestModeActive]);

  const limits = useMemo(() => hasProAccess ? PRO_LIMITS : FREE_LIMITS, [hasProAccess]);

  const checkLimit = (type: 'habits' | 'tasks' | 'transactions', currentCount: number): UsageLimits[typeof type] => {
    const max = limits[type];
    return {
      current: currentCount,
      max,
      canAdd: currentCount < max,
    };
  };

  const getHabitsLimit = (currentCount: number) => checkLimit('habits', currentCount);
  const getTasksLimit = (currentCount: number) => checkLimit('tasks', currentCount);
  const getTransactionsLimit = (currentCount: number) => checkLimit('transactions', currentCount);

  return {
    limits,
    hasProAccess,
    isProActive: hasProAccess,
    getHabitsLimit,
    getTasksLimit,
    getTransactionsLimit,
    checkLimit,
  };
}
