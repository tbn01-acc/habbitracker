
-- Fix 1: Remove overly permissive UPDATE policy on payments table
-- The "Users can update own payments" policy allows users to mark their own payments as paid
-- Edge functions use service role key which bypasses RLS, so no UPDATE policy is needed
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Service can update payments" ON public.payments;

-- Fix 2: Remove overly permissive INSERT policy on user_notifications
-- Notifications are created by SECURITY DEFINER triggers and edge functions (service role)
-- Both bypass RLS, so no INSERT policy is needed for client-side access
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;
