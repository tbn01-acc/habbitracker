-- Allow any authenticated user to view public profiles (needed for public_profiles view with security_invoker)
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_public = true);