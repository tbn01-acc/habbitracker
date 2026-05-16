import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export interface UserStars {
  id: string;
  user_id: string;
  total_stars: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  freeze_available: boolean;
  freeze_used_at: string | null;
}

export interface StarTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  timer_minutes: number | null;
  created_at: string;
}

const DAILY_TASK_LIMIT = 7;
const MIN_FOCUS_MINUTES = 15;
const STREAK_BONUS_DAYS = [10, 20, 30];
const FREEZE_COST = 25;

export function useStars() {
  const { user } = useAuth();
  const { isProActive } = useSubscription();
  const [userStars, setUserStars] = useState<UserStars | null>(null);
  const [transactions, setTransactions] = useState<StarTransaction[]>([]);
  const [dailyVerifiedCount, setDailyVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const multiplier = isProActive ? 2 : 1;

  const fetchUserStars = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch or create user stars
      let { data, error } = await supabase
        .from('user_stars')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data && !error) {
        // Create new record
        const { data: newData, error: insertError } = await supabase
          .from('user_stars')
          .insert({ user_id: user.id })
          .select()
          .maybeSingle();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      setUserStars(data);

      // Fetch today's verified count
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData } = await supabase
        .from('daily_verified_tasks')
        .select('verified_count')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .maybeSingle();

      setDailyVerifiedCount(dailyData?.verified_count || 0);

      // Fetch recent transactions
      const { data: txData } = await supabase
        .from('star_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(txData || []);
    } catch (err) {
      console.error('Error fetching stars:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserStars();
  }, [fetchUserStars]);

  const addStars = useCallback(async (
    amount: number,
    transactionType: string,
    description?: string,
    referenceId?: string,
    timerMinutes?: number
  ) => {
    if (!user || !userStars) return false;
    // Direct mutation of stars from the client is no longer permitted.
    // All star awards/deductions now flow through SECURITY DEFINER RPCs that
    // validate limits and balances server-side. This wrapper is kept as a
    // no-op for legacy callers; new code should use the dedicated RPCs.
    console.warn('addStars() is deprecated — use server RPCs', {
      transactionType, amount,
    });
    return false;
  }, [user, userStars]);

  const awardTaskCompletion = useCallback(async (
    taskId: string,
    timerMinutes: number
  ) => {
    if (!user || !userStars) return false;
    if (timerMinutes < MIN_FOCUS_MINUTES) {
      toast.error('Минимум 15 минут фокусировки для получения звезды');
      return false;
    }
    const { data, error } = await supabase.rpc('award_completion_star', {
      p_kind: 'task', p_reference: taskId, p_timer_minutes: timerMinutes,
    });
    if (error) { console.error(error); return false; }
    const result = data as { success: boolean; error?: string; amount?: number; total?: number; daily_count?: number };
    if (!result?.success) {
      if (result?.error === 'daily_limit') toast.info('Достигнут дневной лимит (7 задач)');
      else if (result?.error === 'already_awarded') return false;
      else toast.error('Не удалось начислить звезду');
      return false;
    }
    if (result.daily_count != null) setDailyVerifiedCount(result.daily_count);
    if (result.total != null) setUserStars(prev => prev ? { ...prev, total_stars: result.total! } : null);
    toast.success(`+${result.amount} ⭐`, { description: 'За выполненную задачу' });
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    return true;
  }, [user, userStars]);

  const awardHabitCompletion = useCallback(async (
    habitId: string,
    timerMinutes: number
  ) => {
    if (!user || !userStars) return false;
    if (timerMinutes < MIN_FOCUS_MINUTES) {
      toast.error('Минимум 15 минут фокусировки для получения звезды');
      return false;
    }
    const { data, error } = await supabase.rpc('award_completion_star', {
      p_kind: 'habit', p_reference: habitId, p_timer_minutes: timerMinutes,
    });
    if (error) { console.error(error); return false; }
    const result = data as { success: boolean; error?: string; amount?: number; total?: number; daily_count?: number };
    if (!result?.success) {
      if (result?.error === 'daily_limit') toast.info('Достигнут дневной лимит (7 задач)');
      return false;
    }
    if (result.daily_count != null) setDailyVerifiedCount(result.daily_count);
    if (result.total != null) setUserStars(prev => prev ? { ...prev, total_stars: result.total! } : null);
    toast.success(`+${result.amount} ⭐`, { description: 'За привычку' });
    return true;
  }, [user, userStars]);

  const recordDailyLogin = useCallback(async () => {
    if (!user || !userStars) return;
    const { data, error } = await supabase.rpc('record_daily_login_star');
    if (error) { console.error(error); return; }
    const r = data as { success: boolean; error?: string; amount?: number; bonus?: number; streak?: number; total?: number };
    if (!r?.success) return;
    if ((r.bonus ?? 0) > 0) {
      toast.success(`🔥 ${r.streak} дней подряд!`, { description: `+${r.bonus} бонусных звезд`, duration: 5000 });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#d97706'] });
    } else if ((r.streak ?? 0) > 1) {
      toast.success(`🔥 ${r.streak} дней подряд!`, { description: `+${r.amount} ⭐` });
    } else {
      toast.success(`+${r.amount} ⭐`, { description: 'За ежедневный вход' });
    }
    fetchUserStars();
  }, [user, userStars, fetchUserStars]);

  const purchaseFreeze = useCallback(async () => {
    if (!user || !userStars) return false;
    const { error } = await supabase.rpc('purchase_streak_freeze');
    if (error) {
      const msg = String(error.message || '');
      if (msg.includes('insufficient_stars')) toast.error('Недостаточно звезд', { description: `Нужно ${FREEZE_COST} ⭐` });
      else if (msg.includes('freeze_already_used')) toast.error('Заморозка уже использована в этом месяце');
      else toast.error('Не удалось активировать заморозку');
      return false;
    }
    toast.success('Заморозка активирована!', { description: 'Серия сохранится при пропуске 1 дня' });
    fetchUserStars();
    return true;
  }, [user, userStars, fetchUserStars]);

  const awardAchievementPost = useCallback(async (postId: string) => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('award_achievement_post_star', { p_post_id: postId });
    if (error) { console.error(error); return false; }
    const r = data as { success: boolean; amount?: number; total?: number };
    if (!r?.success) return false;
    if (r.total != null) setUserStars(prev => prev ? { ...prev, total_stars: r.total! } : null);
    toast.success(`+${r.amount} ⭐`, { description: 'За публикацию достижения' });
    return true;
  }, [user]);

  const deductAchievementPost = useCallback(async (postId: string) => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('revoke_achievement_post_star', { p_post_id: postId });
    if (error) { console.error(error); return false; }
    const r = data as { success: boolean; amount?: number; total?: number };
    if (!r?.success) return false;
    if (r.total != null) setUserStars(prev => prev ? { ...prev, total_stars: r.total! } : null);
    if ((r.amount ?? 0) > 0) toast.info(`-${r.amount} ⭐`, { description: 'Звезды списаны за скрытый пост' });
    return true;
  }, [user]);

  return {
    userStars,
    transactions,
    dailyVerifiedCount,
    loading,
    multiplier,
    dailyLimit: DAILY_TASK_LIMIT,
    minFocusMinutes: MIN_FOCUS_MINUTES,
    freezeCost: FREEZE_COST,
    addStars,
    awardTaskCompletion,
    awardHabitCompletion,
    recordDailyLogin,
    purchaseFreeze,
    awardAchievementPost,
    deductAchievementPost,
    refetch: fetchUserStars
  };
}
