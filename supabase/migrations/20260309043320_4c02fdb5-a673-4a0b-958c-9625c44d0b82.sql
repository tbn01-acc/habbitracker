
CREATE TABLE public.team_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  team_name TEXT NOT NULL,
  admin_name TEXT,
  inn TEXT NOT NULL,
  kpp TEXT,
  org_name TEXT,
  org_address TEXT,
  plan_type TEXT NOT NULL DEFAULT 'team',
  seats_count INTEGER NOT NULL DEFAULT 3,
  billing_period TEXT NOT NULL DEFAULT 'month',
  price_per_seat NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own team subscriptions"
  ON public.team_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own team subscriptions"
  ON public.team_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team subscriptions"
  ON public.team_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all team subscriptions"
  ON public.team_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
