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

    try {
      // Add transaction
      await supabase
        .from('star_transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: transactionType,
          description,
          reference_id: referenceId,
          timer_minutes: timerMinutes
        });

      // Update total stars
      const newTotal = userStars.total_stars + amount;
      await supabase
        .from('user_stars')
        .update({ total_stars: newTotal })
        .eq('user_id', user.id);

      setUserStars(prev => prev ? { ...prev, total_stars: newTotal } : null);
      
      return true;
    } catch (err) {
      console.error('Error adding stars:', err);
      return false;
    }
  }, [user, userStars]);

  const awardTaskCompletion = useCallback(async (
    taskId: string,
    timerMinutes: number
  ) => {
    if (!user || !userStars) return false;

    // Check minimum focus time
    if (timerMinutes < MIN_FOCUS_MINUTES) {
      toast.error('Минимум 15 минут фокусировки для получения звезды');
      return false;
    }

    // Check daily limit
    if (dailyVerifiedCount >= DAILY_TASK_LIMIT) {
      toast.info('Достигнут дневной лимит (7 задач)');
      return false;
    }

    const stars = 1 * multiplier;
    const success = await addStars(
      stars,
      'task',
      'Выполнение задачи',
      taskId,
      timerMinutes
    );

    if (success) {
      // Update daily count
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('daily_verified_tasks')
        .upsert({
          user_id: user.id,
          activity_date: today,
          verified_count: dailyVerifiedCount + 1
        }, { onConflict: 'user_id,activity_date' });

      setDailyVerifiedCount(prev => prev + 1);
      
      toast.success(`+${stars} ⭐`, { description: 'За выполненную задачу' });
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }

    return success;
  }, [user, userStars, dailyVerifiedCount, multiplier, addStars]);

  const awardHabitCompletion = useCallback(async (
    habitId: string,
    timerMinutes: number
  ) => {
    if (!user || !userStars) return false;

    if (timerMinutes < MIN_FOCUS_MINUTES) {
      toast.error('Минимум 15 минут фокусировки для получения звезды');
      return false;
    }

    if (dailyVerifiedCount >= DAILY_TASK_LIMIT) {
      toast.info('Достигнут дневной лимит (7 задач)');
      return false;
    }

    const stars = 1 * multiplier;
    const success = await addStars(
      stars,
      'habit',
      'Выполнение привычки',
      habitId,
      timerMinutes
    );

    if (success) {
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('daily_verified_tasks')
        .upsert({
          user_id: user.id,
          activity_date: today,
          verified_count: dailyVerifiedCount + 1
        }, { onConflict: 'user_id,activity_date' });

      setDailyVerifiedCount(prev => prev + 1);
      toast.success(`+${stars} ⭐`, { description: 'За привычку' });
    }

    return success;
  }, [user, userStars, dailyVerifiedCount, multiplier, addStars]);

  const recordDailyLogin = useCallback(async () => {
    if (!user || !userStars) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = userStars.last_activity_date;

    // Already logged in today
    if (lastActivity === today) return;

    let newStreak = 1;
    let streakBroken = false;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = userStars.current_streak_days + 1;
      } else if (diffDays === 2 && userStars.freeze_available === false) {
        // Used freeze yesterday
        newStreak = userStars.current_streak_days + 1;
      } else {
        // Streak broken
        streakBroken = true;
      }
    }

    // Award daily login stars
    const dailyStars = 1 * multiplier;
    await addStars(dailyStars, 'daily_login', 'Ежедневный вход');

    // Check for streak bonuses
    let bonusStars = 0;
    if (STREAK_BONUS_DAYS.includes(newStreak)) {
      bonusStars = (newStreak === 10 ? 5 : newStreak === 20 ? 5 : 5) * multiplier;
      await addStars(bonusStars, 'streak_bonus', `Бонус за ${newStreak} дней подряд`);
      
      toast.success(`🔥 ${newStreak} дней подряд!`, {
        description: `+${bonusStars} бонусных звезд`,
        duration: 5000
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706']
      });
    }

    // Update streak
    const longestStreak = Math.max(newStreak, userStars.longest_streak_days);
    await supabase
      .from('user_stars')
      .update({
        last_activity_date: today,
        current_streak_days: newStreak,
        longest_streak_days: longestStreak,
        freeze_available: true // Reset freeze availability at month start if needed
      })
      .eq('user_id', user.id);

    setUserStars(prev => prev ? {
      ...prev,
      last_activity_date: today,
      current_streak_days: newStreak,
      longest_streak_days: longestStreak
    } : null);

    if (streakBroken && userStars.current_streak_days > 0) {
      toast.info('Серия сброшена', { description: 'Начинаем заново!' });
    } else if (!streakBroken && newStreak > 1) {
      toast.success(`🔥 ${newStreak} дней подряд!`, { description: `+${dailyStars} ⭐` });
    } else {
      toast.success(`+${dailyStars} ⭐`, { description: 'За ежедневный вход' });
    }
  }, [user, userStars, multiplier, addStars]);

  const purchaseFreeze = useCallback(async () => {
    if (!user || !userStars) return false;

    if (userStars.total_stars < FREEZE_COST) {
      toast.error('Недостаточно звезд', { description: `Нужно ${FREEZE_COST} ⭐` });
      return false;
    }

    if (!userStars.freeze_available) {
      toast.error('Заморозка уже использована в этом месяце');
      return false;
    }

    try {
      // Deduct stars
      await addStars(-FREEZE_COST, 'freeze_purchase', 'Покупка заморозки серии');

      // Mark freeze as used
      await supabase
        .from('user_stars')
        .update({
          freeze_available: false,
          freeze_used_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      setUserStars(prev => prev ? {
        ...prev,
        freeze_available: false,
        freeze_used_at: new Date().toISOString()
      } : null);

      toast.success('Заморозка активирована!', {
        description: 'Серия сохранится при пропуске 1 дня'
      });

      return true;
    } catch (err) {
      console.error('Error purchasing freeze:', err);
      return false;
    }
  }, [user, userStars, addStars]);

  const awardAchievementPost = useCallback(async (postId: string) => {
    if (!user) return false;

    const stars = (isProActive ? 10 : 5);
    const success = await addStars(
      stars,
      'achievement_post',
      'Публикация достижения',
      postId
    );

    if (success) {
      toast.success(`+${stars} ⭐`, { description: 'За публикацию достижения' });
    }

    return success;
  }, [user, isProActive, addStars]);

  const deductAchievementPost = useCallback(async (postId: string) => {
    if (!user) return false;

    // Find the original transaction for this post to know how much was awarded
    const { data: originalTx } = await supabase
      .from('star_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('reference_id', postId)
      .eq('transaction_type', 'achievement_post')
      .maybeSingle();

    if (!originalTx) {
      // No stars were awarded for this post
      return true;
    }

    const starsToDeduct = originalTx.amount;
    const success = await addStars(
      -starsToDeduct,
      'achievement_post_removed',
      'Удаление/скрытие публикации',
      postId
    );

    if (success) {
      toast.info(`-${starsToDeduct} ⭐`, { description: 'Звезды списаны за скрытый пост' });
    }

    return success;
  }, [user, addStars]);

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
