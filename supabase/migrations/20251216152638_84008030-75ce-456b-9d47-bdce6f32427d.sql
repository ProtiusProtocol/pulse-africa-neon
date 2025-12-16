-- Allow anyone to read early access signups (admin panel uses password protection)
CREATE POLICY "Anyone can view signups" 
ON public.early_access_signups 
FOR SELECT 
USING (true);