
-- 1. Referral bonus calculators: restrict to self or admin
CREATE OR REPLACE FUNCTION public.calculate_referral_bonus(referrer_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  total_refs INTEGER;
  paid_refs INTEGER;
  is_pro BOOLEAN;
  reg_bonus INTEGER := 0;
  paid_bonus INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> referrer_user_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE referred_has_paid = true)
  INTO total_refs, paid_refs
  FROM public.referrals
  WHERE referrer_id = referrer_user_id;

  SELECT (plan = 'pro' AND (expires_at IS NULL OR expires_at > now()))
  INTO is_pro
  FROM public.subscriptions
  WHERE user_id = referrer_user_id;

  is_pro := COALESCE(is_pro, false);

  IF total_refs >= 25 THEN
    reg_bonus := CASE WHEN is_pro THEN 42 ELSE 28 END;
  ELSIF total_refs >= 11 THEN
    reg_bonus := CASE WHEN is_pro THEN 35 ELSE 21 END;
  ELSIF total_refs >= 6 THEN
    reg_bonus := CASE WHEN is_pro THEN 28 ELSE 14 END;
  ELSIF total_refs >= 1 THEN
    reg_bonus := CASE WHEN is_pro THEN 21 ELSE 7 END;
  END IF;

  IF paid_refs >= 11 THEN
    paid_bonus := CASE WHEN is_pro THEN 120 ELSE 90 END;
  ELSIF paid_refs >= 6 THEN
    paid_bonus := CASE WHEN is_pro THEN 90 ELSE 60 END;
  ELSIF paid_refs >= 1 THEN
    paid_bonus := CASE WHEN is_pro THEN 60 ELSE 30 END;
  END IF;

  RETURN reg_bonus + paid_bonus;
END;
$function$;

-- 2. Lock down EXECUTE on every SECURITY DEFINER function in public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Re-grant only the app-facing RPCs to signed-in users
GRANT EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_idea_flow(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_idea_flow_custom(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_achievement_post_star(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_completion_star(text, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_sync_mutations(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level_from_xp(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_self_notification(text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_telegram(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_chat_invite_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_top(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_user_stars(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stars_rank(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_team_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_consent_revoke(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_fingerprint_banned(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member_with_role(uuid, uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_chat_by_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_team_by_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_telegram_account(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_shop_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_streak_freeze() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_daily_login_star() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_achievement_post_star(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_idea_followup(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_device_fingerprint(text, text, text, text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_sprint(uuid) TO authenticated;

-- 3. Social content requires sign-in
DROP POLICY IF EXISTS "Anyone can view visible posts" ON public.achievement_posts;
CREATE POLICY "Authenticated users can view visible posts"
ON public.achievement_posts FOR SELECT TO authenticated
USING (is_visible = true);

DROP POLICY IF EXISTS "Anyone can view visible comments" ON public.post_comments;
CREATE POLICY "Authenticated users can view visible comments"
ON public.post_comments FOR SELECT TO authenticated
USING (is_visible = true);

REVOKE SELECT ON public.achievement_posts FROM anon;
REVOKE SELECT ON public.post_comments FROM anon;

-- 4. Team members: no arbitrary self-join
DROP POLICY IF EXISTS "Team owners admins can add members" ON public.team_members;
CREATE POLICY "Team owners admins can add members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (public.is_team_member_with_role(auth.uid(), team_id, ARRAY['owner','admin']));

-- 5. Group chats: self-join only into public chats, as plain member
DROP POLICY IF EXISTS "Users can join public chats" ON public.group_chat_members;
CREATE POLICY "Users can join public chats"
ON public.group_chat_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'member'
  AND EXISTS (
    SELECT 1 FROM public.group_chats gc
    WHERE gc.id = group_chat_members.chat_id AND gc.is_public = true
  )
);

DROP POLICY IF EXISTS "Chat managers can add members" ON public.group_chat_members;
CREATE POLICY "Chat managers can add members"
ON public.group_chat_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chats gc
    WHERE gc.id = group_chat_members.chat_id AND gc.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.group_chat_members m
    WHERE m.chat_id = group_chat_members.chat_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['admin','moderator'])
  )
);

-- 6. Storage: stop bucket listing, keep public URL reads working
DROP POLICY IF EXISTS "Anyone can view achievement images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view achievements" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can list their own achievement images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'achievements' AND (auth.uid())::text = (storage.foldername(name))[1]);
