DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

CREATE POLICY "Team members and owners can view their teams"
ON public.teams
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (SELECT public.get_user_team_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

CREATE POLICY "Users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;

CREATE POLICY "Team owners can update their teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;

CREATE POLICY "Team owners can delete their teams"
ON public.teams
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);