
-- ============================================================
-- 1. PROFILES: drop duplicate id-based policies, enforce id=user_id
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.profiles_enforce_id_matches_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'profiles.user_id must not be null';
  END IF;
  -- Force id to equal user_id so the two columns can never diverge
  NEW.id := NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_id_matches_user_trg ON public.profiles;
CREATE TRIGGER profiles_enforce_id_matches_user_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_enforce_id_matches_user();

-- ============================================================
-- 2. PROMO CODES: remove broad authenticated SELECT
-- ============================================================
DROP POLICY IF EXISTS "Users can view active promo codes" ON public.promo_codes;
-- Admins retain access via "Admins can manage promo codes". Regular users
-- must use the redeem_promo_code RPC to validate/use a code.

-- ============================================================
-- 3. DEVICE FINGERPRINTS: drop client UPDATE, add SECURITY DEFINER upsert
-- ============================================================
DROP POLICY IF EXISTS "Users can update own fingerprint" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Users can insert own fingerprint" ON public.device_fingerprints;

CREATE OR REPLACE FUNCTION public.upsert_device_fingerprint(
  _fingerprint_hash text,
  _user_agent text DEFAULT NULL,
  _screen_resolution text DEFAULT NULL,
  _timezone text DEFAULT NULL,
  _language text DEFAULT NULL,
  _platform text DEFAULT NULL,
  _canvas_hash text DEFAULT NULL,
  _webgl_hash text DEFAULT NULL,
  _fonts_hash text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF _fingerprint_hash IS NULL OR length(_fingerprint_hash) = 0 THEN
    RAISE EXCEPTION 'invalid_fingerprint';
  END IF;

  -- Note: ip_address is intentionally NOT accepted from the client.
  -- It can only be populated by trusted server-side code (e.g. an edge function).
  IF EXISTS (SELECT 1 FROM public.device_fingerprints WHERE user_id = _uid) THEN
    UPDATE public.device_fingerprints
       SET fingerprint_hash = _fingerprint_hash,
           user_agent = COALESCE(_user_agent, user_agent),
           screen_resolution = COALESCE(_screen_resolution, screen_resolution),
           timezone = COALESCE(_timezone, timezone),
           language = COALESCE(_language, language),
           platform = COALESCE(_platform, platform),
           canvas_hash = COALESCE(_canvas_hash, canvas_hash),
           webgl_hash = COALESCE(_webgl_hash, webgl_hash),
           fonts_hash = COALESCE(_fonts_hash, fonts_hash),
           updated_at = now()
     WHERE user_id = _uid;
  ELSE
    INSERT INTO public.device_fingerprints
      (user_id, fingerprint_hash, user_agent, screen_resolution, timezone,
       language, platform, canvas_hash, webgl_hash, fonts_hash)
    VALUES
      (_uid, _fingerprint_hash, _user_agent, _screen_resolution, _timezone,
       _language, _platform, _canvas_hash, _webgl_hash, _fonts_hash);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_device_fingerprint(text,text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_device_fingerprint(text,text,text,text,text,text,text,text,text) TO authenticated;

-- ============================================================
-- 4. GROUP_CHATS / TEAMS: hide invite_code from row-level SELECT
-- Use column-level revoke so existing SELECT policies still work for other cols.
-- ============================================================
REVOKE SELECT (invite_code) ON public.group_chats FROM PUBLIC, anon, authenticated;
REVOKE SELECT (invite_code) ON public.teams FROM PUBLIC, anon, authenticated;
-- Service role retains access; admins/owners read invite codes via the
-- dedicated SECURITY DEFINER RPCs (get_group_chat_invite_code / get_team_invite_code).
