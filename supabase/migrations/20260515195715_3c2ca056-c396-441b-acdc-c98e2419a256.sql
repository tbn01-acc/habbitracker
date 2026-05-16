
-- 1. PROFILES: protect privileged columns via trigger
CREATE OR REPLACE FUNCTION public.profiles_protect_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  -- Service role and admins may change anything
  is_privileged := (auth.role() = 'service_role')
                   OR public.has_role(auth.uid(), 'admin'::app_role);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  -- Force protected columns to retain their previous values
  NEW.max_habits := OLD.max_habits;
  NEW.max_tasks := OLD.max_tasks;
  NEW.max_fin_ops := OLD.max_fin_ops;
  NEW.has_ai_analytics := OLD.has_ai_analytics;
  NEW.cloud_sync_interval_days := OLD.cloud_sync_interval_days;
  NEW.affiliate_level := OLD.affiliate_level;
  NEW.is_banned := OLD.is_banned;
  NEW.ban_until := OLD.ban_until;
  NEW.ban_count := OLD.ban_count;
  NEW.read_only_until := OLD.read_only_until;
  NEW.active_units_count := OLD.active_units_count;
  NEW.consent_revokes_count := OLD.consent_revokes_count;
  NEW.referred_by := OLD.referred_by;
  NEW.referral_code := OLD.referral_code;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged_columns_trg ON public.profiles;
CREATE TRIGGER profiles_protect_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_protect_privileged_columns();

-- 2. INVITE CODES: revoke direct column access; access only via existing RPCs
REVOKE SELECT (invite_code) ON public.group_chats FROM authenticated, anon;
REVOKE SELECT (invite_code) ON public.teams FROM authenticated, anon;

-- 3. USER NOTIFICATIONS: remove client INSERT, add SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.user_notifications;

CREATE OR REPLACE FUNCTION public.create_self_notification(
  p_type text,
  p_title text,
  p_message text,
  p_reference_id uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Whitelist of types allowed for self-created notifications (deadlines, reminders)
  IF p_type NOT IN (
    'task_deadline','habit_reminder','task_reminder','overdue_task',
    'pomodoro_done','focus_complete','goal_deadline','generic'
  ) THEN
    RAISE EXCEPTION 'Notification type % not permitted', p_type;
  END IF;

  IF length(coalesce(p_title,'')) > 200 OR length(coalesce(p_message,'')) > 1000 THEN
    RAISE EXCEPTION 'Notification text too long';
  END IF;

  INSERT INTO public.user_notifications (
    user_id, type, title, message, reference_id, reference_type, actor_id
  ) VALUES (
    v_uid, p_type, p_title, p_message, p_reference_id, p_reference_type, NULL
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_self_notification(text,text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_self_notification(text,text,text,uuid,text) TO authenticated;

-- 4. AI USAGE: atomic rate-limit RPC
CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_max_per_day integer)
RETURNS TABLE(allowed boolean, current_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (v_uid, v_today, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET request_count = public.ai_usage.request_count + 1
  RETURNING request_count INTO v_count;

  IF v_count > p_max_per_day THEN
    -- Roll back this increment so quota is not artificially inflated
    UPDATE public.ai_usage
       SET request_count = request_count - 1
     WHERE user_id = v_uid AND usage_date = v_today;
    RETURN QUERY SELECT false, p_max_per_day;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO authenticated, service_role;

-- Ensure unique constraint exists for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.ai_usage'::regclass
      AND contype = 'u'
      AND conname = 'ai_usage_user_date_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.ai_usage ADD CONSTRAINT ai_usage_user_date_unique UNIQUE (user_id, usage_date);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
