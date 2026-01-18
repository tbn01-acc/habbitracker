-- Create table for balance status history
CREATE TABLE public.balance_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level TEXT NOT NULL,
  spread NUMERIC NOT NULL,
  min_value NUMERIC NOT NULL,
  max_value NUMERIC NOT NULL,
  min_sphere_id INTEGER,
  max_sphere_id INTEGER,
  all_spheres_above_minimum BOOLEAN DEFAULT false,
  stars_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_balance_status_history_user_id ON public.balance_status_history(user_id);
CREATE INDEX idx_balance_status_history_created_at ON public.balance_status_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.balance_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own balance history"
ON public.balance_status_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance history"
ON public.balance_status_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);