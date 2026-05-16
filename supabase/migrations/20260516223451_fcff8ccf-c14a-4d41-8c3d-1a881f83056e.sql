-- Restrict productivity stats to authenticated users only (was public to anon)
DROP POLICY IF EXISTS "Anyone can view productivity stats" ON public.user_productivity_stats;

CREATE POLICY "Authenticated users can view productivity stats"
ON public.user_productivity_stats
FOR SELECT
TO authenticated
USING (true);