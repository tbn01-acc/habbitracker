
-- Ensure telegram_id has a unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_id 
  ON public.profiles (telegram_id) 
  WHERE telegram_id IS NOT NULL;

-- Trigger function: auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _telegram_id bigint;
  _display_name text;
  _avatar_url text;
  _email text;
  _referral_code text;
BEGIN
  -- Extract metadata
  _telegram_id := (NEW.raw_user_meta_data ->> 'telegram_id')::bigint;
  _display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  _avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'photo_url'
  );
  _email := NEW.email;
  
  -- Generate unique referral code
  _referral_code := 'TF' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  -- Insert profile, skip if already exists
  INSERT INTO public.profiles (user_id, display_name, avatar_url, email, telegram_id, referral_code, is_public, created_at, updated_at)
  VALUES (NEW.id, _display_name, _avatar_url, _email, _telegram_id, _referral_code, true, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    telegram_id = COALESCE(profiles.telegram_id, EXCLUDED.telegram_id),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
