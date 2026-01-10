-- Add user preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_day_of_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS active_frame TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS active_badges TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.first_day_of_week IS '0 = Sunday, 1 = Monday';
COMMENT ON COLUMN public.profiles.active_frame IS 'Currently active avatar frame ID';
COMMENT ON COLUMN public.profiles.active_badges IS 'Array of active badge IDs';