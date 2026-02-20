-- Fix 1: Recreate public_profiles view with only non-sensitive fields
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio,
  status_tag,
  interests,
  location,
  job_title,
  expertise,
  can_help,
  is_public,
  active_frame,
  active_badges,
  referral_code,
  public_email,
  created_at,
  updated_at
FROM public.profiles
WHERE is_public = true;

-- Fix 2: Recreate add_user_xp with caller validation
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_xp_source text)
RETURNS TABLE(new_level integer, new_total_xp integer, leveled_up boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_level INTEGER;
  calc_level INTEGER;
  calc_xp_next INTEGER;
  new_xp INTEGER;
BEGIN
  -- SECURITY: Verify caller is the target user (service role has auth.uid() = NULL, so allow that)
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot add XP for other users';
  END IF;

  -- Validate XP amount
  IF p_xp_amount < 0 OR p_xp_amount > 1000 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 0 and 1000';
  END IF;

  -- Get or create user level record
  INSERT INTO public.user_levels (user_id, total_xp, current_level)
  VALUES (p_user_id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current level
  SELECT current_level INTO old_level FROM public.user_levels WHERE user_id = p_user_id;
  
  -- Update XP and source counters
  UPDATE public.user_levels
  SET total_xp = total_xp + p_xp_amount,
      tasks_completed = CASE WHEN p_xp_source = 'task' THEN tasks_completed + 1 ELSE tasks_completed END,
      habits_completed = CASE WHEN p_xp_source = 'habit' THEN habits_completed + 1 ELSE habits_completed END,
      stars_earned = CASE WHEN p_xp_source = 'star' THEN stars_earned + 1 ELSE stars_earned END
  WHERE user_id = p_user_id
  RETURNING total_xp INTO new_xp;
  
  -- Calculate new level
  SELECT level, xp_for_next INTO calc_level, calc_xp_next
  FROM public.calculate_level_from_xp(new_xp);
  
  -- Update level if changed
  UPDATE public.user_levels
  SET current_level = calc_level,
      xp_to_next_level = calc_xp_next
  WHERE user_id = p_user_id;
  
  new_level := calc_level;
  new_total_xp := new_xp;
  leveled_up := calc_level > old_level;
  RETURN NEXT;
END;
$$;