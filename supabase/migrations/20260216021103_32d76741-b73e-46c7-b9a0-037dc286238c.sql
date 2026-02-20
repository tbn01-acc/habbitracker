
-- Fix 1: Remove client-side INSERT/UPDATE policies on leaderboard_aggregates
-- Only service role (via aggregate-leaderboard edge function) should modify this data
DROP POLICY IF EXISTS "Users can update own aggregates" ON public.leaderboard_aggregates;
DROP POLICY IF EXISTS "Users can update their own aggregates" ON public.leaderboard_aggregates;

-- Fix 2: Check and secure user_daily_activity table
ALTER TABLE IF EXISTS public.user_daily_activity ENABLE ROW LEVEL SECURITY;

-- Add read-only policy for user_daily_activity if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_daily_activity') THEN
    -- Drop any existing permissive write policies
    DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_daily_activity;
    DROP POLICY IF EXISTS "Users can update their own activity" ON public.user_daily_activity;
    
    -- Ensure read policy exists
    BEGIN
      CREATE POLICY "Users can view own daily activity"
      ON public.user_daily_activity FOR SELECT
      USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Fix 3: Replace overly permissive "System can insert profiles" policy
-- This uses WITH CHECK (true) which is flagged by the Supabase linter
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
-- Profile creation is handled by the handle_new_user trigger (SECURITY DEFINER) using service role,
-- so no additional INSERT policy with CHECK(true) is needed.
-- The existing "Users can insert their own profile" and "Users can insert own profile" policies are sufficient.
