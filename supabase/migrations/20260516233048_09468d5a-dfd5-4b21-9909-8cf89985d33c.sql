
-- Grant admin role to SuperAdmin
INSERT INTO public.user_roles (user_id, role)
VALUES ('d9d7749a-68db-41be-adb5-bb96f109ae34', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin SELECT policies for user detail page
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all referral earnings"
  ON public.referral_earnings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all notification settings"
  ON public.notification_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
