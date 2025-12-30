-- Function to calculate referral bonus days
CREATE OR REPLACE FUNCTION public.calculate_referral_bonus(
  referrer_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_refs INTEGER;
  paid_refs INTEGER;
  is_pro BOOLEAN;
  reg_bonus INTEGER := 0;
  paid_bonus INTEGER := 0;
BEGIN
  -- Count referrals
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE referred_has_paid = true)
  INTO total_refs, paid_refs
  FROM public.referrals
  WHERE referrer_id = referrer_user_id;

  -- Check if user has PRO subscription
  SELECT (plan = 'pro' AND (expires_at IS NULL OR expires_at > now()))
  INTO is_pro
  FROM public.subscriptions
  WHERE user_id = referrer_user_id;

  -- Default to false if no subscription found
  is_pro := COALESCE(is_pro, false);

  -- Calculate registration bonus (in days, weeks converted)
  IF total_refs >= 25 THEN
    reg_bonus := CASE WHEN is_pro THEN 42 ELSE 28 END; -- 6 or 4 weeks
  ELSIF total_refs >= 11 THEN
    reg_bonus := CASE WHEN is_pro THEN 35 ELSE 21 END; -- 5 or 3 weeks
  ELSIF total_refs >= 6 THEN
    reg_bonus := CASE WHEN is_pro THEN 28 ELSE 14 END; -- 4 or 2 weeks
  ELSIF total_refs >= 1 THEN
    reg_bonus := CASE WHEN is_pro THEN 21 ELSE 7 END; -- 3 or 1 week
  END IF;

  -- Calculate paid bonus (in days, months converted to 30 days)
  IF paid_refs >= 25 THEN
    paid_bonus := CASE WHEN is_pro THEN 120 ELSE 90 END; -- 4 or 3 months
  ELSIF paid_refs >= 11 THEN
    paid_bonus := CASE WHEN is_pro THEN 120 ELSE 90 END; -- 4 or 3 months
  ELSIF paid_refs >= 6 THEN
    paid_bonus := CASE WHEN is_pro THEN 90 ELSE 60 END; -- 3 or 2 months
  ELSIF paid_refs >= 1 THEN
    paid_bonus := CASE WHEN is_pro THEN 60 ELSE 30 END; -- 2 or 1 month
  END IF;

  RETURN reg_bonus + paid_bonus;
END;
$$;

-- Function to update referrer bonus when referral changes
CREATE OR REPLACE FUNCTION public.update_referrer_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_bonus INTEGER;
BEGIN
  -- Calculate new bonus for referrer
  new_bonus := public.calculate_referral_bonus(NEW.referrer_id);

  -- Update or create subscription with bonus
  INSERT INTO public.subscriptions (user_id, plan, bonus_days)
  VALUES (NEW.referrer_id, 'free', new_bonus)
  ON CONFLICT (user_id) 
  DO UPDATE SET bonus_days = new_bonus, updated_at = now();

  RETURN NEW;
END;
$$;

-- Trigger on new referral
CREATE TRIGGER on_referral_created
AFTER INSERT ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_referrer_bonus();

-- Trigger on referral payment status update
CREATE TRIGGER on_referral_paid
AFTER UPDATE OF referred_has_paid ON public.referrals
FOR EACH ROW
WHEN (NEW.referred_has_paid = true AND OLD.referred_has_paid = false)
EXECUTE FUNCTION public.update_referrer_bonus();