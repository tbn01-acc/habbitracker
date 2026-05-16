
-- Remove dead permissive deny policy and replace with a true restrictive deny for non-admins
DROP POLICY IF EXISTS "No public access to telegram_queue" ON public.telegram_queue;

CREATE POLICY "Restrict telegram_queue to admins only"
ON public.telegram_queue
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
