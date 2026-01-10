-- Create promo_codes table for managing promotional codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  bonus_stars INTEGER DEFAULT 0,
  bonus_days INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking promo code usage
CREATE TABLE public.promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Policies for promo_codes - only admins can manage
CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Anyone can read active promo codes to validate
CREATE POLICY "Anyone can read active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true);

-- Policies for promo_code_uses
CREATE POLICY "Users can see their own promo code uses" 
ON public.promo_code_uses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo code uses" 
ON public.promo_code_uses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo code uses" 
ON public.promo_code_uses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_promo_code_uses_user ON public.promo_code_uses(user_id);
CREATE INDEX idx_promo_code_uses_code ON public.promo_code_uses(promo_code_id);

-- Function to update timestamp
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();