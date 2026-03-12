
-- Add referrer_user_id and referrer_level to promo_codes
ALTER TABLE public.promo_codes 
  ADD COLUMN IF NOT EXISTS referrer_user_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referrer_level text DEFAULT NULL;

-- Create promo code creation logs table
CREATE TABLE IF NOT EXISTS public.promo_code_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'created',
  code text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  bonus_stars integer DEFAULT 0,
  bonus_days integer DEFAULT 0,
  max_uses integer DEFAULT NULL,
  valid_until timestamptz DEFAULT NULL,
  referrer_user_id uuid DEFAULT NULL,
  referrer_level text DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  description text DEFAULT NULL
);

ALTER TABLE public.promo_code_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage logs
CREATE POLICY "Admins can manage promo code logs"
  ON public.promo_code_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
