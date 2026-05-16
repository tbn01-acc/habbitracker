
-- ============ user_stars: owner-only SELECT ============
DROP POLICY IF EXISTS "Authenticated users can view stars" ON public.user_stars;
DROP POLICY IF EXISTS "Users can view their own stars" ON public.user_stars;

CREATE POLICY "Users can view their own stars"
  ON public.user_stars
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Safe public projection for leaderboard / user catalog / user search.
-- Returns only non-sensitive aggregate fields, never freeze_available
-- or last_activity_date.
CREATE OR REPLACE FUNCTION public.get_public_user_stars(_user_ids uuid[])
RETURNS TABLE(user_id uuid, total_stars integer, current_streak_days integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT us.user_id, us.total_stars, us.current_streak_days
  FROM public.user_stars us
  WHERE us.user_id = ANY(_user_ids)
$$;

REVOKE ALL ON FUNCTION public.get_public_user_stars(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_user_stars(uuid[]) TO authenticated, anon;

-- Top-N leaderboard (joins with public profiles, only public fields)
CREATE OR REPLACE FUNCTION public.get_leaderboard_top(_limit integer DEFAULT 100)
RETURNS TABLE(
  user_id uuid,
  total_stars integer,
  current_streak_days integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT us.user_id, us.total_stars, us.current_streak_days
  FROM public.user_stars us
  ORDER BY us.total_stars DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 100), 500))
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard_top(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_top(integer) TO authenticated, anon;

-- Rank for a single user (count of users with strictly more stars)
CREATE OR REPLACE FUNCTION public.get_user_stars_rank(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (COUNT(*)::int + 1)
  FROM public.user_stars us
  WHERE us.total_stars > COALESCE(
    (SELECT total_stars FROM public.user_stars WHERE user_id = _user_id),
    0
  )
$$;

REVOKE ALL ON FUNCTION public.get_user_stars_rank(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_stars_rank(uuid) TO authenticated;

-- ============ user_daily_activity: owner-only SELECT ============
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_daily_activity') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view activity for leaderboard" ON public.user_daily_activity';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_daily_activity';
    EXECUTE $p$
      CREATE POLICY "Users can view their own activity"
        ON public.user_daily_activity
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id)
    $p$;
  END IF;
END $$;

-- ============ subscriptions: block client-side plan escalation ============
CREATE OR REPLACE FUNCTION public.subscriptions_enforce_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role and admins bypass (webhook / admin RPC paths)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin authenticated callers can never set a paid plan from the client.
  IF TG_OP = 'INSERT' THEN
    NEW.plan := 'free';
    NEW.period := NULL;
    NEW.expires_at := NULL;
    NEW.is_trial := COALESCE(NEW.is_trial, false);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Disallow changing plan, period, expires_at, trial flags from the client.
    NEW.plan := OLD.plan;
    NEW.period := OLD.period;
    NEW.expires_at := OLD.expires_at;
    NEW.is_trial := OLD.is_trial;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.trial_bonus_months := OLD.trial_bonus_months;
    NEW.bonus_days := OLD.bonus_days;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_enforce_plan_trg ON public.subscriptions;
CREATE TRIGGER subscriptions_enforce_plan_trg
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.subscriptions_enforce_plan();
