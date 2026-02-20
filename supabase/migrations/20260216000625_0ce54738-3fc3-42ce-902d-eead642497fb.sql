-- Fix 1: Drop the old permissive storage upload policy for achievements
DROP POLICY IF EXISTS "Authenticated users can upload achievement images" ON storage.objects;

-- Fix 2: Recreate public_profiles as SECURITY INVOKER view (drop and recreate)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
    user_id,
    display_name,
    avatar_url,
    bio,
    status_tag,
    interests,
    location,
    job_title,
    expertise,
    can_help,
    is_public,
    is_banned,
    ban_until,
    active_frame,
    active_badges,
    referral_code,
    public_email,
    telegram_username,
    created_at,
    updated_at,
    referred_by
FROM public.profiles
WHERE is_public = true;

-- Fix 3: Add SELECT policy on profiles for public profile viewing (needed for the view)
CREATE POLICY "Anyone can view public profiles"
ON public.profiles FOR SELECT
USING (is_public = true OR auth.uid() = user_id);