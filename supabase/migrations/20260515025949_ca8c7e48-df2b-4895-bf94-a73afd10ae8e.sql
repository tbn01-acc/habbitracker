
-- Restore default column SELECT privileges on profiles (the prior REVOKE was too aggressive)
GRANT SELECT (phone, dob, telegram_id, email, ban_count, ban_until, is_banned,
              read_only_until, referred_by, referral_code, consent_revokes_count,
              legal_consents_accepted, location, telegram_username)
  ON public.profiles TO authenticated;

-- Remove the broad permissive read policy added in the previous migration; owners
-- still read their own row via "Users can view their own full profile". Cross-user
-- reads must go through public.public_profiles (safe columns only).
DROP POLICY IF EXISTS "Public profiles readable for view" ON public.profiles;

-- public_profiles view needs SELECT on profiles; recreate it as SECURITY DEFINER
-- so it bypasses RLS while still only exposing safe columns and only public rows.
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  full_name text,
  avatar_url text,
  bio text,
  status_tag text,
  job_title text,
  expertise text,
  interests text[],
  can_help text,
  public_email text,
  active_badges text[],
  active_frame text,
  is_public boolean,
  created_at timestamptz,
  phone text,
  dob date,
  telegram_id bigint,
  telegram_username text,
  email text,
  location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.full_name, p.avatar_url, p.bio,
    p.status_tag, p.job_title, p.expertise, p.interests, p.can_help,
    p.public_email, p.active_badges, p.active_frame, p.is_public, p.created_at,
    CASE WHEN p.show_phone     THEN p.phone        END,
    CASE WHEN p.show_dob       THEN p.dob          END,
    CASE WHEN p.show_telegram  THEN p.telegram_id  END,
    CASE WHEN p.show_telegram  THEN p.telegram_username END,
    CASE WHEN p.show_email     THEN p.email        END,
    CASE WHEN p.show_location  THEN p.location     END
  FROM public.profiles p
  WHERE p.is_public = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO anon, authenticated;

-- Recreate the view (security_invoker so the underlying SECURITY DEFINER fn handles access)
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT * FROM public.get_public_profiles();

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop the obsolete helper from the prior migration
DROP FUNCTION IF EXISTS public.get_my_profile();
