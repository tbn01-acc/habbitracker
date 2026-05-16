DROP POLICY IF EXISTS "Users can insert own notifications" ON public.user_notifications;

CREATE POLICY "Users can insert own notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (actor_id IS NULL OR actor_id = auth.uid())
);