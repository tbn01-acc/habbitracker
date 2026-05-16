
-- 1. Restrict public reads to authenticated only
DROP POLICY IF EXISTS "Anyone can view votes" ON public.idea_votes;
CREATE POLICY "Authenticated users can view votes"
  ON public.idea_votes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Authenticated users can view reactions"
  ON public.post_reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view stars for leaderboard" ON public.user_stars;
CREATE POLICY "Authenticated users can view stars"
  ON public.user_stars FOR SELECT TO authenticated USING (true);

-- 2. Hide invite_code from group_chats / teams for non-privileged users
REVOKE SELECT (invite_code) ON public.group_chats FROM anon, authenticated;
REVOKE SELECT (invite_code) ON public.teams FROM anon, authenticated;

-- Helper: get invite code only if creator/admin of group chat
CREATE OR REPLACE FUNCTION public.get_group_chat_invite_code(_chat_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gc.invite_code
  FROM public.group_chats gc
  WHERE gc.id = _chat_id
    AND (
      gc.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.group_chat_members m
        WHERE m.chat_id = gc.id
          AND m.user_id = auth.uid()
          AND m.role IN ('admin','moderator')
      )
    )
$$;

-- Helper: get invite code only if owner/admin of team
CREATE OR REPLACE FUNCTION public.get_team_invite_code(_team_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.invite_code
  FROM public.teams t
  WHERE t.id = _team_id
    AND (
      t.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('admin','owner')
      )
    )
$$;

-- Join helpers (so users can join by code without seeing the column)
CREATE OR REPLACE FUNCTION public.join_group_chat_by_invite_code(_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_chat_id
  FROM public.group_chats
  WHERE invite_code = upper(_invite_code)
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.group_chat_members (chat_id, user_id, role)
  VALUES (v_chat_id, v_uid, 'member')
  ON CONFLICT DO NOTHING;

  RETURN v_chat_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_team_by_invite_code(_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_team_id
  FROM public.teams
  WHERE invite_code = _invite_code
  LIMIT 1;

  IF v_team_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_team_id, v_uid, 'member')
  ON CONFLICT DO NOTHING;

  RETURN v_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_chat_invite_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_chat_by_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_team_by_invite_code(text) TO authenticated;
