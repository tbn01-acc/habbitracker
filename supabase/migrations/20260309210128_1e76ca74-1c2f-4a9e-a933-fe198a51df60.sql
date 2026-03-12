-- Drop the restrictive policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;

-- Recreate both as PERMISSIVE so either one can grant access
CREATE POLICY "Users can view their own full profile"
  ON public.profiles
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_public = true);