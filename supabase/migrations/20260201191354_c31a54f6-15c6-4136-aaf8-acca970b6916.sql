-- Add referral code to paper_leaderboard
ALTER TABLE public.paper_leaderboard 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by text,
ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_session_id text NOT NULL,
  referee_session_id text NOT NULL UNIQUE,
  referral_code text NOT NULL,
  bonus_awarded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tenant_id text NOT NULL DEFAULT 'soccer-laduma'
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Anyone can view referrals" 
ON public.referrals 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update referrals" 
ON public.referrals 
FOR UPDATE 
USING (true);

-- Generate referral codes for existing users
UPDATE public.paper_leaderboard 
SET referral_code = UPPER(SUBSTRING(id::text, 1, 8))
WHERE referral_code IS NULL;