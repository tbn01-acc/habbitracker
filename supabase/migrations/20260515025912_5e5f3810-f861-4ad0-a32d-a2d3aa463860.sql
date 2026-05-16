
-- =========================================================
-- 1. Profiles: per-field opt-in + remove broad public read
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_dob boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_telegram boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_location boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

-- Safe public view (security_invoker so RLS still applies but we expose only safe cols)
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.user_id,
  p.display_name,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.status_tag,
  p.job_title,
  p.expertise,
  p.interests,
  p.can_help,
  p.public_email,
  p.active_badges,
  p.active_frame,
  p.is_public,
  p.created_at,
  CASE WHEN p.show_phone     THEN p.phone        END AS phone,
  CASE WHEN p.show_dob       THEN p.dob          END AS dob,
  CASE WHEN p.show_telegram  THEN p.telegram_id  END AS telegram_id,
  CASE WHEN p.show_telegram  THEN p.telegram_username END AS telegram_username,
  CASE WHEN p.show_email     THEN p.email        END AS email,
  CASE WHEN p.show_location  THEN p.location     END AS location
FROM public.profiles p
WHERE p.is_public = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Re-add a permissive SELECT policy that allows access only via the view
-- (the view is security_invoker, so it needs SELECT on profiles to work).
-- We expose only public rows via the underlying policy, but limit through the view.
CREATE POLICY "Public profiles readable for view"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- NOTE: The above policy still technically allows direct table SELECT of all
-- columns for public rows. To enforce column-level restriction we additionally
-- revoke column privileges on sensitive fields from anon/authenticated, while
-- keeping owner access via a definer pathway is unnecessary because owner
-- access is granted by the existing "Users can view their own full profile"
-- policy and column GRANTs apply to the role, not RLS evaluation.
REVOKE SELECT (phone, dob, telegram_id, email, ban_count, ban_until, is_banned,
               read_only_until, referred_by, referral_code, consent_revokes_count,
               legal_consents_accepted, location, telegram_username)
  ON public.profiles FROM anon, authenticated;

-- Owners need to still read their own sensitive columns. Column-level GRANTs
-- restrict ALL access regardless of RLS, so owners must use the view or
-- their own row via service-side functions. To preserve owner full-read,
-- we create a SECURITY DEFINER RPC the owner can call.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- =========================================================
-- 2. user_roles: explicit deny self-insert for non-admins
-- =========================================================
-- Restrictive policy: any INSERT must be by an admin.
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- 3. promo_codes: require authentication to read
-- =========================================================
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;
-- "Users can view active promo codes" (authenticated, is_active=true) remains.
