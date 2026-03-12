
-- Fix 1: Add auth.uid() verification to redeem_promo_code to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_promo RECORD;
  v_already_used BOOLEAN;
  v_result JSONB;
BEGIN
  -- SECURITY: Ensure caller can only redeem for themselves
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot redeem promo code for other users';
  END IF;

  -- 1. Find active promo code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = UPPER(p_code)
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- 2. Check expiry
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  -- 3. Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'exhausted');
  END IF;

  -- 4. Check if user already used this code
  SELECT EXISTS(
    SELECT 1 FROM promo_code_uses
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_used');
  END IF;

  -- 5. Record usage
  INSERT INTO promo_code_uses (promo_code_id, user_id)
  VALUES (v_promo.id, p_user_id);

  -- 6. Increment counter atomically
  UPDATE promo_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_promo.id;

  -- 7. Apply bonus stars if any
  IF COALESCE(v_promo.bonus_stars, 0) > 0 THEN
    INSERT INTO user_stars (user_id, stars, reason, created_at)
    VALUES (p_user_id, v_promo.bonus_stars, 'promo_code:' || v_promo.code, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 8. Apply bonus days if any (extend subscription)
  IF COALESCE(v_promo.bonus_days, 0) > 0 THEN
    UPDATE subscriptions
    SET expires_at = COALESCE(expires_at, NOW()) + (v_promo.bonus_days || ' days')::INTERVAL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- 9. Log referrer attribution if promo is tied to a referrer
  IF v_promo.referrer_user_id IS NOT NULL THEN
    INSERT INTO referral_earnings (
      referrer_id, referred_id, earning_type, amount_rub, commission_percent, created_at
    ) VALUES (
      v_promo.referrer_user_id, p_user_id, 'promo_code_bonus', 0, v_promo.discount_percent, NOW()
    );
  END IF;

  -- 10. Build result
  v_result := jsonb_build_object(
    'success', true,
    'discount_percent', v_promo.discount_percent,
    'bonus_stars', COALESCE(v_promo.bonus_stars, 0),
    'bonus_days', COALESCE(v_promo.bonus_days, 0),
    'referrer_user_id', v_promo.referrer_user_id,
    'promo_code_id', v_promo.id
  );

  RETURN v_result;
END;
$function$;

-- Fix 2: Drop overly permissive INSERT policy on sprint_daily_stats
-- The SECURITY DEFINER function create_sprint_daily_snapshots bypasses RLS, so no INSERT policy is needed.
DROP POLICY IF EXISTS "System can insert sprint stats" ON public.sprint_daily_stats;
