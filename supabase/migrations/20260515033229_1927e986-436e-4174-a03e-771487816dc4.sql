
CREATE OR REPLACE FUNCTION public.is_fingerprint_banned(_fingerprint_hash text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_fingerprints
    WHERE fingerprint_hash = _fingerprint_hash
  );
$$;

REVOKE ALL ON FUNCTION public.is_fingerprint_banned(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_fingerprint_banned(text) TO authenticated, anon;
