
DROP POLICY IF EXISTS "Team owners admins can add members" ON public.team_members;
CREATE POLICY "Team owners admins can add members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_team_member_with_role(auth.uid(), team_id, ARRAY['owner','admin'])
  OR EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
  )
);
