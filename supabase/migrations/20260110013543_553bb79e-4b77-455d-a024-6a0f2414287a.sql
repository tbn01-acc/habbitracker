-- Add public_email column to profiles table for contact sharing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS public_email TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_email ON public.profiles (public_email) WHERE public_email IS NOT NULL;