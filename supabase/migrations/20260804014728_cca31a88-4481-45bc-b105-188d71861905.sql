
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;
