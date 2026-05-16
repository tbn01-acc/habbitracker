
-- ============================================================
-- Server-enforced star economy
-- ============================================================

-- Helper: detect PRO subscription (server-side multiplier)
CREATE OR REPLACE FUNCTION public._is_user_pro(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan = 'pro' AND (expires_at IS NULL OR expires_at > now())
       FROM public.subscriptions WHERE user_id = _uid),
    false
  );
$$;

-- Internal: mint a star transaction + bump total (bypasses RLS as DEFINER)
CREATE OR REPLACE FUNCTION public._mint_stars(
  _uid uuid, _amount int, _type text, _description text,
  _reference uuid, _timer_minutes int
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total int;
BEGIN
  INSERT INTO public.user_stars (user_id, total_stars)
  VALUES (_uid, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.star_transactions
    (user_id, amount, transaction_type, description, reference_id, timer_minutes)
  VALUES (_uid, _amount, _type, _description, _reference, _timer_minutes);

  UPDATE public.user_stars
     SET total_stars = total_stars + _amount,
         updated_at = now()
   WHERE user_id = _uid
   RETURNING total_stars INTO v_total;

  RETURN v_total;
END;
$$;

-- Award a star for completing a task or habit
CREATE OR REPLACE FUNCTION public.award_completion_star(
  p_kind text, p_reference uuid, p_timer_minutes int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() at time zone 'UTC')::date;
  _count int;
  _amount int;
  _total int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_kind NOT IN ('task','habit') THEN RAISE EXCEPTION 'invalid_kind'; END IF;
  IF p_timer_minutes IS NULL OR p_timer_minutes < 15 THEN
    RAISE EXCEPTION 'min_focus_required';
  END IF;

  -- Lock daily counter row
  INSERT INTO public.daily_verified_tasks (user_id, activity_date, verified_count)
  VALUES (_uid, _today, 0)
  ON CONFLICT (user_id, activity_date) DO NOTHING;

  SELECT verified_count INTO _count
    FROM public.daily_verified_tasks
   WHERE user_id = _uid AND activity_date = _today
   FOR UPDATE;

  IF _count >= 7 THEN
    RETURN jsonb_build_object('success', false, 'error', 'daily_limit');
  END IF;

  -- Prevent double-award for the same reference
  IF p_reference IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.star_transactions
     WHERE user_id = _uid AND reference_id = p_reference AND transaction_type = p_kind
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_awarded');
  END IF;

  _amount := CASE WHEN public._is_user_pro(_uid) THEN 2 ELSE 1 END;

  _total := public._mint_stars(_uid, _amount, p_kind,
    CASE WHEN p_kind='task' THEN 'Выполнение задачи' ELSE 'Выполнение привычки' END,
    p_reference, p_timer_minutes);

  UPDATE public.daily_verified_tasks
     SET verified_count = verified_count + 1
   WHERE user_id = _uid AND activity_date = _today;

  RETURN jsonb_build_object('success', true, 'amount', _amount, 'total', _total, 'daily_count', _count + 1);
END;
$$;

-- Daily login + streak handling, including streak bonuses
CREATE OR REPLACE FUNCTION public.record_daily_login_star()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() at time zone 'UTC')::date;
  _row public.user_stars;
  _diff int;
  _new_streak int := 1;
  _amount int;
  _bonus int := 0;
  _total int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  INSERT INTO public.user_stars (user_id, total_stars)
  VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _row FROM public.user_stars WHERE user_id = _uid FOR UPDATE;

  IF _row.last_activity_date = _today THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_today', 'total', _row.total_stars);
  END IF;

  IF _row.last_activity_date IS NOT NULL THEN
    _diff := (_today - _row.last_activity_date);
    IF _diff = 1 OR (_diff = 2 AND _row.freeze_available = false) THEN
      _new_streak := _row.current_streak_days + 1;
    END IF;
  END IF;

  _amount := CASE WHEN public._is_user_pro(_uid) THEN 2 ELSE 1 END;
  _total := public._mint_stars(_uid, _amount, 'daily_login', 'Ежедневный вход', NULL, NULL);

  IF _new_streak IN (10, 20, 30) THEN
    _bonus := 5 * (CASE WHEN public._is_user_pro(_uid) THEN 2 ELSE 1 END);
    _total := public._mint_stars(_uid, _bonus, 'streak_bonus',
      'Бонус за ' || _new_streak || ' дней подряд', NULL, NULL);
  END IF;

  UPDATE public.user_stars
     SET last_activity_date = _today,
         current_streak_days = _new_streak,
         longest_streak_days = GREATEST(longest_streak_days, _new_streak),
         updated_at = now()
   WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'amount', _amount,
    'bonus', _bonus, 'streak', _new_streak, 'total', _total);
END;
$$;

-- Atomic shop reward purchase
CREATE OR REPLACE FUNCTION public.purchase_shop_reward(p_reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _reward public.rewards_shop;
  _balance int;
  _new_total int;
  _purchase_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO _reward FROM public.rewards_shop WHERE id = p_reward_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'reward_not_found'; END IF;

  SELECT total_stars INTO _balance FROM public.user_stars WHERE user_id = _uid FOR UPDATE;
  IF _balance IS NULL OR _balance < _reward.price_stars THEN
    RAISE EXCEPTION 'insufficient_stars';
  END IF;

  _new_total := public._mint_stars(_uid, -_reward.price_stars, 'reward_purchase',
    'Покупка: ' || _reward.name, p_reward_id, NULL);

  INSERT INTO public.purchased_rewards (user_id, reward_id, stars_spent)
  VALUES (_uid, p_reward_id, _reward.price_stars)
  RETURNING id INTO _purchase_id;

  RETURN jsonb_build_object('success', true, 'purchase_id', _purchase_id, 'total', _new_total);
END;
$$;

-- Atomic streak freeze purchase
CREATE OR REPLACE FUNCTION public.purchase_streak_freeze()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.user_stars;
  _new_total int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO _row FROM public.user_stars WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND OR _row.total_stars < 25 THEN RAISE EXCEPTION 'insufficient_stars'; END IF;
  IF NOT _row.freeze_available THEN RAISE EXCEPTION 'freeze_already_used'; END IF;

  _new_total := public._mint_stars(_uid, -25, 'freeze_purchase', 'Покупка заморозки серии', NULL, NULL);

  UPDATE public.user_stars
     SET freeze_available = false, freeze_used_at = now(), updated_at = now()
   WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'total', _new_total);
END;
$$;

-- Achievement post star award (validated server-side)
CREATE OR REPLACE FUNCTION public.award_achievement_post_star(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _amount int;
  _total int;
  _owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT user_id INTO _owner FROM public.achievement_posts WHERE id = p_post_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF EXISTS (SELECT 1 FROM public.star_transactions
              WHERE user_id=_uid AND reference_id=p_post_id AND transaction_type='achievement_post') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_awarded');
  END IF;

  _amount := CASE WHEN public._is_user_pro(_uid) THEN 10 ELSE 5 END;
  _total := public._mint_stars(_uid, _amount, 'achievement_post', 'Публикация достижения', p_post_id, NULL);
  RETURN jsonb_build_object('success', true, 'amount', _amount, 'total', _total);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_achievement_post_star(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _amount int;
  _total int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT amount INTO _amount FROM public.star_transactions
   WHERE user_id=_uid AND reference_id=p_post_id AND transaction_type='achievement_post'
   ORDER BY created_at DESC LIMIT 1;

  IF _amount IS NULL THEN RETURN jsonb_build_object('success', true, 'amount', 0); END IF;

  IF EXISTS (SELECT 1 FROM public.star_transactions
              WHERE user_id=_uid AND reference_id=p_post_id AND transaction_type='achievement_post_removed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_revoked');
  END IF;

  _total := public._mint_stars(_uid, -_amount, 'achievement_post_removed',
    'Удаление/скрытие публикации', p_post_id, NULL);
  RETURN jsonb_build_object('success', true, 'amount', _amount, 'total', _total);
END;
$$;

-- ============================================================
-- Lock down direct client writes
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own star transactions" ON public.star_transactions;
DROP POLICY IF EXISTS "Users can update their own stars" ON public.user_stars;
DROP POLICY IF EXISTS "Users can insert their own purchased rewards" ON public.purchased_rewards;
DROP POLICY IF EXISTS "Users can insert their own daily tasks" ON public.daily_verified_tasks;
DROP POLICY IF EXISTS "Users can update their own daily tasks" ON public.daily_verified_tasks;

-- Permissions: revoke any direct privileges from authenticated/anon
REVOKE INSERT, UPDATE, DELETE ON public.star_transactions FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.user_stars FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.purchased_rewards FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.daily_verified_tasks FROM anon, authenticated;
