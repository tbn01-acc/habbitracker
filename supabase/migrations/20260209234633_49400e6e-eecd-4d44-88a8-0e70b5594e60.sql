
-- Fix 1: Restrict profiles table - remove overly permissive public SELECT
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Add owner-only full profile access
CREATE POLICY "Users can view their own full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Fix 2: Create a public view with only safe fields (excludes email, phone, dob, telegram_id, full_name)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
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

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;
