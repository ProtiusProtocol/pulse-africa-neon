
-- early_access_signups: lock down SELECT to admins only
DROP POLICY IF EXISTS "Anyone can view signups" ON public.early_access_signups;
CREATE POLICY "Admins can view signups"
  ON public.early_access_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- user_card_sets: remove always-true UPDATE policy (service role bypasses RLS)
DROP POLICY IF EXISTS "Users can update own card sets" ON public.user_card_sets;

-- user_trades: remove redundant always-true ALL policy (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role full access user_trades" ON public.user_trades;
