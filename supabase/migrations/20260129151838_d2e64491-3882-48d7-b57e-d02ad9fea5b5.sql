-- Create alert_recipients table for admin notification emails
CREATE TABLE public.alert_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_types TEXT[] NOT NULL DEFAULT ARRAY['deadline_3day', 'deadline_1day']::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access alert_recipients"
ON public.alert_recipients
FOR ALL
USING (true)
WITH CHECK (true);

-- Anyone can view (for edge function access)
CREATE POLICY "Anyone can view alert recipients"
ON public.alert_recipients
FOR SELECT
USING (true);