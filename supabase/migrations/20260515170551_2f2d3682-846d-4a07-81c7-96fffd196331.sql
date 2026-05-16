
-- promo_code_uses: redemptions only via redeem_promo_code RPC
DROP POLICY IF EXISTS "Users can insert their own promo code uses" ON public.promo_code_uses;

-- user_stars: creation/updates only via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Users can insert their own star records" ON public.user_stars;
DROP POLICY IF EXISTS "Users can insert their own stars" ON public.user_stars;
DROP POLICY IF EXISTS "Users can update their own star records" ON public.user_stars;
DROP POLICY IF EXISTS "Users can update their own stars" ON public.user_stars;

-- user_wallet: balance changes only via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallet;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallet;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallet;

-- referrals: referral attribution only via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can insert their own referrals" ON public.referrals;

-- group_chat_members: tighten self-join
DROP POLICY IF EXISTS "Admins can add members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Users can join public chats" ON public.group_chat_members;
DROP POLICY IF EXISTS "Chat managers can add members" ON public.group_chat_members;

CREATE POLICY "Users can join public chats"
ON public.group_chat_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_chats gc
    WHERE gc.id = group_chat_members.chat_id AND gc.is_public = true
  )
);

CREATE POLICY "Chat managers can add members"
ON public.group_chat_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chats gc
    WHERE gc.id = group_chat_members.chat_id AND gc.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.group_chat_members m
    WHERE m.chat_id = group_chat_members.chat_id
      AND m.user_id = auth.uid()
      AND m.role IN ('admin','moderator')
  )
);

-- star_transactions: explicit RESTRICTIVE deny for client mutations
DROP POLICY IF EXISTS "Deny client writes on star_transactions" ON public.star_transactions;
CREATE POLICY "Deny client writes on star_transactions"
ON public.star_transactions
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny client updates on star_transactions" ON public.star_transactions;
CREATE POLICY "Deny client updates on star_transactions"
ON public.star_transactions
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS "Deny client deletes on star_transactions" ON public.star_transactions;
CREATE POLICY "Deny client deletes on star_transactions"
ON public.star_transactions
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);
