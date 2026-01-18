-- Fix RLS policies for profiles table
-- Drop existing SELECT policies that might be conflicting
DROP POLICY IF EXISTS "All profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles for leaderboard" ON public.profiles;

-- Create single public read policy for profiles (allows anonymous access)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Ensure UPDATE policy exists and works correctly
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix daily_post_count policies - add public read access
DROP POLICY IF EXISTS "Users can view their own post count" ON public.daily_post_count;
CREATE POLICY "Anyone can view post counts"
ON public.daily_post_count
FOR SELECT
TO public
USING (true);

-- Fix daily_verified_tasks policies - add public read access  
DROP POLICY IF EXISTS "Users can view their own daily tasks" ON public.daily_verified_tasks;
CREATE POLICY "Anyone can view verified tasks"
ON public.daily_verified_tasks
FOR SELECT
TO public
USING (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_post_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_verified_tasks ENABLE ROW LEVEL SECURITY;