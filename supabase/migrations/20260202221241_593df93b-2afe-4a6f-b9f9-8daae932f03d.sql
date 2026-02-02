-- Allow authenticated admins to insert markets
CREATE POLICY "Admins can insert markets"
ON public.markets
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to update markets
CREATE POLICY "Admins can update markets"
ON public.markets
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to delete markets
CREATE POLICY "Admins can delete markets"
ON public.markets
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Also allow admins to update market_suggestions
CREATE POLICY "Admins can update market suggestions"
ON public.market_suggestions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));