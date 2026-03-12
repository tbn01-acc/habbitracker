
-- Create ai_usage table for rate limiting
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Only the edge function (service role) writes to this table
-- Users can read their own usage
CREATE POLICY "Users can view their own ai usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Create process_withdrawal function
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id uuid,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_amount decimal;
  v_status text;
  current_balance decimal;
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Validate action
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: must be approve or reject';
  END IF;

  -- Get withdrawal details with row lock
  SELECT user_id, amount_rub, status
  INTO v_user_id, v_amount, v_status
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal already processed';
  END IF;

  -- Update withdrawal status
  UPDATE withdrawal_requests
  SET status = CASE WHEN p_action = 'approve' THEN 'completed' ELSE 'rejected' END,
      processed_at = now()
  WHERE id = p_withdrawal_id;

  -- If approved, update wallet atomically
  IF p_action = 'approve' THEN
    SELECT balance_rub INTO current_balance
    FROM user_wallet
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF current_balance IS NULL OR current_balance < v_amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    UPDATE user_wallet
    SET balance_rub = balance_rub - v_amount,
        total_withdrawn_rub = total_withdrawn_rub + v_amount,
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN TRUE;
END;
$$;
