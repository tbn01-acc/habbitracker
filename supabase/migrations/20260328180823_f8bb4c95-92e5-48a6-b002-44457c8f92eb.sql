
-- Security definer function to check team membership role
CREATE OR REPLACE FUNCTION public.is_team_member_with_role(_user_id uuid, _team_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_team_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = _user_id
$$;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners admins can update members" ON public.team_members;
DROP POLICY IF EXISTS "Members can leave or owners can remove" ON public.team_members;

-- Recreate policies using security definer functions
CREATE POLICY "Team members can view members"
ON public.team_members FOR SELECT TO authenticated
USING (team_id IN (SELECT public.get_user_team_ids(auth.uid())));

CREATE POLICY "Team owners admins can add members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_team_member_with_role(auth.uid(), team_id, ARRAY['owner','admin'])
  OR user_id = auth.uid()
);

CREATE POLICY "Team owners admins can update members"
ON public.team_members FOR UPDATE TO authenticated
USING (public.is_team_member_with_role(auth.uid(), team_id, ARRAY['owner','admin']));

CREATE POLICY "Members can leave or owners can remove"
ON public.team_members FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_team_member_with_role(auth.uid(), team_id, ARRAY['owner','admin'])
);
