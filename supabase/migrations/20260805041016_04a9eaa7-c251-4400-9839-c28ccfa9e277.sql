-- 1. Remove permissive USING(true) SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view post counts" ON public.daily_post_count;
DROP POLICY IF EXISTS "Authenticated users can view verified tasks" ON public.daily_verified_tasks;
DROP POLICY IF EXISTS "Authenticated users can view productivity stats" ON public.user_productivity_stats;
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.idea_votes;

CREATE POLICY "Users can view relevant idea votes"
ON public.idea_votes FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_votes.post_id AND i.user_id = auth.uid())
);

-- 2. Hide invite codes from direct table SELECT (RPC-only access)
REVOKE SELECT ON public.teams FROM authenticated, anon;
GRANT SELECT (id, name, description, avatar_url, owner_id, max_members, created_at, updated_at)
  ON public.teams TO authenticated;

REVOKE SELECT ON public.group_chats FROM authenticated, anon;
GRANT SELECT (id, name, description, avatar_url, created_by, is_public, max_members, created_at, updated_at)
  ON public.group_chats TO authenticated;

-- 3. Revoke EXECUTE on internal-only SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.get_user_team_ids(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_team_member_with_role(uuid, uuid, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_level_from_xp(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.find_user_by_telegram(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_fingerprint_banned(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.upsert_device_fingerprint(text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_fingerprint_banned(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_device_fingerprint(text, text, text, text, text, text, text, text, text) TO authenticated;
