
-- ============================================================
-- 1. STARS ANTI-ABUSE
-- ============================================================
ALTER TABLE public.tasks  ADD COLUMN IF NOT EXISTS stars_awarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS stars_awarded boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.star_award_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_kind text NOT NULL,
  entity_id uuid NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_kind, entity_id)
);

GRANT SELECT ON public.star_award_ledger TO authenticated;
GRANT ALL ON public.star_award_ledger TO service_role;
ALTER TABLE public.star_award_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own star award ledger" ON public.star_award_ledger;
CREATE POLICY "Users can view their own star award ledger"
  ON public.star_award_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.award_completion_star(p_kind text, p_reference uuid, p_timer_minutes integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() at time zone 'UTC')::date;
  _count int;
  _amount int;
  _total int;
  _inserted int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_kind NOT IN ('task','habit') THEN RAISE EXCEPTION 'invalid_kind'; END IF;
  IF p_timer_minutes IS NULL OR p_timer_minutes < 15 THEN
    RAISE EXCEPTION 'min_focus_required';
  END IF;
  IF p_reference IS NULL THEN RAISE EXCEPTION 'reference_required'; END IF;

  -- Permanent, irreversible award ledger: an entity can only ever be paid once.
  INSERT INTO public.star_award_ledger (user_id, entity_kind, entity_id)
  VALUES (_uid, p_kind, p_reference)
  ON CONFLICT (user_id, entity_kind, entity_id) DO NOTHING;

  GET DIAGNOSTICS _inserted = ROW_COUNT;
  IF _inserted = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_awarded');
  END IF;

  -- Daily cap
  INSERT INTO public.daily_verified_tasks (user_id, activity_date, verified_count)
  VALUES (_uid, _today, 0)
  ON CONFLICT (user_id, activity_date) DO NOTHING;

  SELECT verified_count INTO _count
    FROM public.daily_verified_tasks
   WHERE user_id = _uid AND activity_date = _today
   FOR UPDATE;

  IF _count >= 7 THEN
    -- release the ledger slot so the user can earn it on a later day
    DELETE FROM public.star_award_ledger
     WHERE user_id = _uid AND entity_kind = p_kind AND entity_id = p_reference;
    RETURN jsonb_build_object('success', false, 'error', 'daily_limit');
  END IF;

  _amount := CASE WHEN public._is_user_pro(_uid) THEN 2 ELSE 1 END;

  _total := public._mint_stars(_uid, _amount, p_kind,
    CASE WHEN p_kind='task' THEN 'Выполнение задачи' ELSE 'Выполнение привычки' END,
    p_reference, p_timer_minutes);

  UPDATE public.daily_verified_tasks
     SET verified_count = verified_count + 1
   WHERE user_id = _uid AND activity_date = _today;

  IF p_kind = 'task' THEN
    UPDATE public.tasks SET stars_awarded = true WHERE id = p_reference AND user_id = _uid;
  ELSE
    UPDATE public.habits SET stars_awarded = true WHERE id = p_reference AND user_id = _uid;
  END IF;

  RETURN jsonb_build_object('success', true, 'amount', _amount, 'total', _total, 'daily_count', _count + 1);
END;
$function$;

-- Never let stars_awarded be reset from the client
CREATE OR REPLACE FUNCTION public.prevent_stars_awarded_reset()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.stars_awarded = true THEN
    NEW.stars_awarded := true;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_tasks_stars_awarded ON public.tasks;
CREATE TRIGGER trg_tasks_stars_awarded BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.prevent_stars_awarded_reset();

DROP TRIGGER IF EXISTS trg_habits_stars_awarded ON public.habits;
CREATE TRIGGER trg_habits_stars_awarded BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.prevent_stars_awarded_reset();

-- ============================================================
-- 2. AFFILIATE: SERVER-SIDE COMMISSION ENGINE
-- ============================================================
-- Lock down client mutations on the wallet: read-only for the owner.
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallet;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallet;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallet;
REVOKE INSERT, UPDATE, DELETE ON public.user_wallet FROM authenticated, anon;
GRANT SELECT ON public.user_wallet TO authenticated;
GRANT ALL ON public.user_wallet TO service_role;
CREATE POLICY "Users can view their own wallet"
  ON public.user_wallet FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.referral_earnings FROM authenticated, anon;
GRANT SELECT ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_earnings TO service_role;

CREATE OR REPLACE FUNCTION public.process_referral_commission(p_payment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment      record;
  v_l1_referrer  uuid;
  v_l2_referrer  uuid;
  v_paid_count   int;
  v_tier         int;
  v_l1_pct       numeric;
  v_l2_pct       numeric := 2.5;
  v_l1_amount    numeric;
  v_l2_amount    numeric;
  v_is_pro       boolean;
  v_milestone    numeric := 0;
  v_milestone_ty text := NULL;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  IF NOT FOUND OR v_payment.status <> 'paid' THEN RETURN; END IF;

  -- idempotency
  IF EXISTS (SELECT 1 FROM public.referral_earnings WHERE payment_id = p_payment_id) THEN
    RETURN;
  END IF;

  SELECT referrer_id INTO v_l1_referrer
    FROM public.referrals WHERE referred_id = v_payment.user_id LIMIT 1;
  IF v_l1_referrer IS NULL THEN RETURN; END IF;

  -- flag the referral as paying
  UPDATE public.referrals
     SET referred_has_paid = true
   WHERE referred_id = v_payment.user_id AND referrer_id = v_l1_referrer;

  SELECT COUNT(*) INTO v_paid_count
    FROM public.referrals
   WHERE referrer_id = v_l1_referrer AND referred_has_paid = true;

  v_tier   := CASE WHEN v_paid_count <= 50 THEN 1 ELSE 2 END;
  v_l1_pct := CASE WHEN v_tier = 1 THEN 20 ELSE 30 END;
  v_is_pro := public._is_user_pro(v_l1_referrer);

  v_l1_amount := round(v_payment.amount * v_l1_pct / 100.0, 2);

  -- milestone bonuses
  IF v_tier = 1 AND v_paid_count % 10 = 0 THEN
    v_milestone := CASE WHEN v_is_pro THEN 1000 ELSE 500 END;
    v_milestone_ty := 'tier1_' || v_paid_count;
  ELSIF v_tier = 2 AND v_paid_count % 25 = 0 THEN
    v_milestone := 1000;
    v_milestone_ty := 'tier2_' || v_paid_count;
  END IF;

  INSERT INTO public.referral_earnings
    (referrer_id, referred_id, earning_type, amount_rub, payment_id,
     commission_percent, milestone_bonus_rub, milestone_type)
  VALUES
    (v_l1_referrer, v_payment.user_id, 'commission_l1', v_l1_amount, p_payment_id,
     v_l1_pct::int, v_milestone, v_milestone_ty);

  INSERT INTO public.user_wallet (user_id, balance_rub, total_earned_rub)
  VALUES (v_l1_referrer, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_wallet
     SET balance_rub      = balance_rub + v_l1_amount + v_milestone,
         total_earned_rub = total_earned_rub + v_l1_amount + v_milestone,
         updated_at       = now()
   WHERE user_id = v_l1_referrer;

  -- second level
  SELECT referrer_id INTO v_l2_referrer
    FROM public.referrals WHERE referred_id = v_l1_referrer LIMIT 1;

  IF v_l2_referrer IS NOT NULL THEN
    v_l2_amount := round(v_payment.amount * v_l2_pct / 100.0, 2);

    INSERT INTO public.referral_earnings
      (referrer_id, referred_id, earning_type, amount_rub, payment_id, commission_percent)
    VALUES
      (v_l2_referrer, v_payment.user_id, 'commission_l2', v_l2_amount, p_payment_id, v_l2_pct::int);

    INSERT INTO public.user_wallet (user_id, balance_rub, total_earned_rub)
    VALUES (v_l2_referrer, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.user_wallet
       SET balance_rub      = balance_rub + v_l2_amount,
           total_earned_rub = total_earned_rub + v_l2_amount,
           updated_at       = now()
     WHERE user_id = v_l2_referrer;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.payments_referral_commission_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    PERFORM public.process_referral_commission(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_payments_referral_commission ON public.payments;
CREATE TRIGGER trg_payments_referral_commission
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.payments_referral_commission_trigger();

-- Read-only affiliate summary for the caller
CREATE OR REPLACE FUNCTION public.get_affiliate_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_total int; v_active int; v_paid int;
  v_wallet record; v_tier int; v_is_pro boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE is_active),
         COUNT(*) FILTER (WHERE referred_has_paid)
    INTO v_total, v_active, v_paid
    FROM public.referrals WHERE referrer_id = v_uid;

  SELECT * INTO v_wallet FROM public.user_wallet WHERE user_id = v_uid;

  v_tier := CASE WHEN v_paid <= 50 THEN 1 ELSE 2 END;
  v_is_pro := public._is_user_pro(v_uid);

  RETURN jsonb_build_object(
    'total_referrals', v_total,
    'active_referrals', v_active,
    'paid_referrals', v_paid,
    'current_level', v_tier,
    'commission_l1_percent', CASE WHEN v_tier = 1 THEN 20 ELSE 30 END,
    'commission_l2_percent', 2.5,
    'milestone_bonus_rub', CASE WHEN v_tier = 1 THEN (CASE WHEN v_is_pro THEN 1000 ELSE 500 END) ELSE 1000 END,
    'milestone_step', CASE WHEN v_tier = 1 THEN 10 ELSE 25 END,
    'is_pro', v_is_pro,
    'total_earned', COALESCE(v_wallet.total_earned_rub, 0),
    'pending_balance', COALESCE(v_wallet.balance_rub, 0),
    'withdrawn_total', COALESCE(v_wallet.total_withdrawn_rub, 0)
  );
END;
$function$;

-- ============================================================
-- 3. CLOUD SYNC: TRANSACTIONAL BATCH MUTATIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.batch_sync_mutations(p_mutations jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  m jsonb;
  v_applied int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_mutations IS NULL OR jsonb_typeof(p_mutations) <> 'array' THEN
    RAISE EXCEPTION 'invalid_mutations';
  END IF;
  IF jsonb_array_length(p_mutations) > 200 THEN
    RAISE EXCEPTION 'too_many_mutations';
  END IF;

  FOR m IN SELECT * FROM jsonb_array_elements(p_mutations) LOOP
    IF m->>'scope' = 'data' THEN
      INSERT INTO public.cloud_user_data AS c (
        user_id, habits, tasks, transactions, time_entries, notes,
        checklists, counters, pomodoro_sessions, reflections, updated_at
      ) VALUES (
        v_uid,
        COALESCE(m->'payload'->'habits', '[]'::jsonb),
        COALESCE(m->'payload'->'tasks', '[]'::jsonb),
        COALESCE(m->'payload'->'transactions', '[]'::jsonb),
        COALESCE(m->'payload'->'time_entries', '[]'::jsonb),
        COALESCE(m->'payload'->'notes', '[]'::jsonb),
        COALESCE(m->'payload'->'checklists', '[]'::jsonb),
        COALESCE(m->'payload'->'counters', '[]'::jsonb),
        COALESCE(m->'payload'->'pomodoro_sessions', '[]'::jsonb),
        COALESCE(m->'payload'->'reflections', '[]'::jsonb),
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        habits = EXCLUDED.habits,
        tasks = EXCLUDED.tasks,
        transactions = EXCLUDED.transactions,
        time_entries = EXCLUDED.time_entries,
        notes = EXCLUDED.notes,
        checklists = EXCLUDED.checklists,
        counters = EXCLUDED.counters,
        pomodoro_sessions = EXCLUDED.pomodoro_sessions,
        reflections = EXCLUDED.reflections,
        updated_at = now();
      v_applied := v_applied + 1;

    ELSIF m->>'scope' = 'settings' THEN
      INSERT INTO public.cloud_user_settings AS s (
        user_id, widget_settings, theme_settings, celebration_settings,
        notification_settings, general_settings, dashboard_layout, updated_at
      ) VALUES (
        v_uid,
        m->'payload'->'widget_settings',
        m->'payload'->'theme_settings',
        m->'payload'->'celebration_settings',
        m->'payload'->'notification_settings',
        m->'payload'->'general_settings',
        m->'payload'->'dashboard_layout',
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        widget_settings = COALESCE(EXCLUDED.widget_settings, s.widget_settings),
        theme_settings = COALESCE(EXCLUDED.theme_settings, s.theme_settings),
        celebration_settings = COALESCE(EXCLUDED.celebration_settings, s.celebration_settings),
        notification_settings = COALESCE(EXCLUDED.notification_settings, s.notification_settings),
        general_settings = COALESCE(EXCLUDED.general_settings, s.general_settings),
        dashboard_layout = COALESCE(EXCLUDED.dashboard_layout, s.dashboard_layout),
        updated_at = now();
      v_applied := v_applied + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'applied', v_applied);
END;
$function$;
