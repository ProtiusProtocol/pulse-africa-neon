-- Create email subscribers table
CREATE TABLE public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_to TEXT[] NOT NULL DEFAULT ARRAY['trader_pulse', 'executive_brief'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe
CREATE POLICY "Anyone can subscribe"
ON public.email_subscribers
FOR INSERT
WITH CHECK (true);

-- Allow subscribers to view their own subscription
CREATE POLICY "Subscribers can view own subscription"
ON public.email_subscribers
FOR SELECT
USING (true);

-- Service role can manage all subscriptions
CREATE POLICY "Service role full access email_subscribers"
ON public.email_subscribers
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for email lookups
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX idx_email_subscribers_active ON public.email_subscribers(is_active) WHERE is_active = true;