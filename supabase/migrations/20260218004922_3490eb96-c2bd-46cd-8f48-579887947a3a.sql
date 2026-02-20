
-- Fix 1: Restrict profiles table to authenticated users only
-- This prevents unauthenticated scraping of PII (email, phone, dob, telegram_id, etc.)

-- Drop the overly permissive SELECT policy that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Create a new policy: only authenticated users can view public profiles
-- Users can always see their own profile regardless of is_public flag
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING ((is_public = true) OR (auth.uid() = user_id));

-- Fix 2: Recreate public_profiles view as SECURITY DEFINER so it can be
-- safely queried through the RPC path without leaking base table PII.
-- The view already excludes sensitive columns (email, phone, dob, telegram_id, etc.)
-- Ensure view has proper definition
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.is_public,
  p.status_tag,
  p.interests,
  p.location,
  p.job_title,
  p.expertise,
  p.can_help,
  p.active_frame,
  p.active_badges,
  p.referral_code,
  p.public_email,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.is_public = true;
