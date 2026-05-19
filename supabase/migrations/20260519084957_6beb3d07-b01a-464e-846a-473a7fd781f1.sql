DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_trades_side_check') THEN
    ALTER TABLE public.user_trades ADD CONSTRAINT user_trades_side_check CHECK (side IN ('yes','no'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_trades_amount_positive') THEN
    ALTER TABLE public.user_trades ADD CONSTRAINT user_trades_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_trades_wallet_nonempty') THEN
    ALTER TABLE public.user_trades ADD CONSTRAINT user_trades_wallet_nonempty CHECK (length(wallet_address) >= 1);
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can insert trades" ON public.user_trades;
DROP POLICY IF EXISTS "Anyone can insert valid trades" ON public.user_trades;
CREATE POLICY "Anyone can insert valid trades"
ON public.user_trades FOR INSERT TO public
WITH CHECK (
  side IN ('yes','no') AND amount > 0
  AND length(wallet_address) >= 20 AND market_id IS NOT NULL
);

DROP POLICY IF EXISTS "Anyone can submit early access signup" ON public.early_access_signups;
DROP POLICY IF EXISTS "Anyone can submit valid early access signup" ON public.early_access_signups;
CREATE POLICY "Anyone can submit valid early access signup"
ON public.early_access_signups FOR INSERT TO public
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(name) BETWEEN 1 AND 200
  AND length(country) BETWEEN 1 AND 100
  AND length(predictor_type) BETWEEN 1 AND 100
);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe with valid email" ON public.email_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
ON public.email_subscribers FOR INSERT TO public
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (name IS NULL OR length(name) <= 200)
);

DROP POLICY IF EXISTS "Anyone can submit community responses" ON public.community_responses;
DROP POLICY IF EXISTS "Anyone can submit bounded community responses" ON public.community_responses;
CREATE POLICY "Anyone can submit bounded community responses"
ON public.community_responses FOR INSERT TO public
WITH CHECK (
  length(response_text) BETWEEN 1 AND 5000
  AND length(question_text) BETWEEN 1 AND 1000
  AND length(week_id) BETWEEN 1 AND 50
  AND length(report_type) BETWEEN 1 AND 50
  AND (respondent_name IS NULL OR length(respondent_name) <= 200)
);

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual LIKE '%fan-cards%' OR with_check LIKE '%fan-cards%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;