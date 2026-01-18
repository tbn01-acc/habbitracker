-- Create table for storing life index history
CREATE TABLE public.life_index_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  life_index NUMERIC(5,2) NOT NULL,
  personal_energy NUMERIC(5,2),
  external_success NUMERIC(5,2),
  mindfulness_level NUMERIC(5,2),
  sphere_indices JSONB,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for one record per user per day
CREATE UNIQUE INDEX idx_life_index_history_user_date ON public.life_index_history(user_id, recorded_at);

-- Create index for efficient queries
CREATE INDEX idx_life_index_history_user_id ON public.life_index_history(user_id);
CREATE INDEX idx_life_index_history_recorded_at ON public.life_index_history(recorded_at);

-- Enable Row Level Security
ALTER TABLE public.life_index_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own life index history" 
ON public.life_index_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own life index history" 
ON public.life_index_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life index history" 
ON public.life_index_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life index history" 
ON public.life_index_history 
FOR DELETE 
USING (auth.uid() = user_id);