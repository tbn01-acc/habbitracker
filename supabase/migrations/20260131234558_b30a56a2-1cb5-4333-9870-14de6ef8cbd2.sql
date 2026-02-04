-- Add is_verified column to achievement_posts table
ALTER TABLE public.achievement_posts 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.achievement_posts.is_verified IS 'True if photo was taken with camera (not from gallery)';