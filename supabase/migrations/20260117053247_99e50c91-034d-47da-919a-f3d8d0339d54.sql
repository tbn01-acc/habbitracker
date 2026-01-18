-- Clean up duplicate SELECT policies on profiles table
-- Keep only "All profiles are publicly viewable" which allows true access

DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles for leaderboard" ON public.profiles;