
-- 1. email_subscribers: remove public SELECT, admin-only
DROP POLICY IF EXISTS "Subscribers can view own subscription" ON public.email_subscribers;
CREATE POLICY "Admins can view subscribers"
ON public.email_subscribers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. alert_recipients: admin-only SELECT
DROP POLICY IF EXISTS "Anyone can view alert recipients" ON public.alert_recipients;
CREATE POLICY "Admins can view alert recipients"
ON public.alert_recipients FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. user_trades: admin-only SELECT (wallet addresses are sensitive)
DROP POLICY IF EXISTS "Anyone can view trades" ON public.user_trades;
CREATE POLICY "Admins can view all trades"
ON public.user_trades FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Storage fan-cards: enforce admin on INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can upload fan card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update fan card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete fan card images" ON storage.objects;

CREATE POLICY "Admins can upload fan card images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fan-cards' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fan card images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fan-cards' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fan card images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fan-cards' AND public.has_role(auth.uid(), 'admin'));

-- 5. weekly_admin_inputs: explicit admin-only policies (RLS enabled, no policies = no access; make it explicit)
CREATE POLICY "Admins can view weekly admin inputs"
ON public.weekly_admin_inputs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage weekly admin inputs"
ON public.weekly_admin_inputs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. weekly_source_items: explicit admin-only
CREATE POLICY "Admins can view weekly source items"
ON public.weekly_source_items FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage weekly source items"
ON public.weekly_source_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
