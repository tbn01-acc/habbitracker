-- 1. daily_post_count: drop anonymous-readable policy, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view post counts" ON public.daily_post_count;
CREATE POLICY "Authenticated users can view post counts"
ON public.daily_post_count
FOR SELECT
TO authenticated
USING (true);

-- 2. daily_verified_tasks: same treatment
DROP POLICY IF EXISTS "Anyone can view verified tasks" ON public.daily_verified_tasks;
CREATE POLICY "Authenticated users can view verified tasks"
ON public.daily_verified_tasks
FOR SELECT
TO authenticated
USING (true);

-- 3. group_chats: require authentication for listing public chats
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.group_chats;
CREATE POLICY "Authenticated users can view chats they can access"
ON public.group_chats
FOR SELECT
TO authenticated
USING (
  is_public = true
  OR id IN (
    SELECT group_chat_members.chat_id
    FROM group_chat_members
    WHERE group_chat_members.user_id = auth.uid()
  )
);

-- 4. user_notifications: defensive trigger to forbid cross-user inserts from
--    the authenticated role (service role bypasses RLS and triggers via SECURITY DEFINER pathways still work).
CREATE OR REPLACE FUNCTION public.enforce_notification_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Cannot create a notification for another user';
  END IF;
  IF auth.uid() IS NOT NULL AND NEW.actor_id IS NOT NULL AND NEW.actor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Cannot impersonate another actor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_notification_recipient_trg ON public.user_notifications;
CREATE TRIGGER enforce_notification_recipient_trg
BEFORE INSERT ON public.user_notifications
FOR EACH ROW EXECUTE FUNCTION public.enforce_notification_recipient();