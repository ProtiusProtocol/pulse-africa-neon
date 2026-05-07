-- Allow admins to insert and update fragility signals
CREATE POLICY "Admins can insert fragility signals"
ON public.fragility_signals
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update fragility signals"
ON public.fragility_signals
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete fragility signals"
ON public.fragility_signals
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));