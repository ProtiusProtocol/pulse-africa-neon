-- Create match day challenges table
CREATE TABLE public.match_day_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  xp_multiplier numeric NOT NULL DEFAULT 2,
  bonus_points integer NOT NULL DEFAULT 50,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  challenge_type text NOT NULL DEFAULT 'match_day',
  tenant_id text NOT NULL DEFAULT 'soccer-laduma',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_day_challenges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active challenges" 
ON public.match_day_challenges 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage challenges" 
ON public.match_day_challenges 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add index for efficient queries
CREATE INDEX idx_challenges_active ON public.match_day_challenges (tenant_id, is_active, ends_at);