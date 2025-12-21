-- Create user_trades table to track trades by wallet address
CREATE TABLE public.user_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  tx_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'won', 'lost', 'claimed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast wallet lookups
CREATE INDEX idx_user_trades_wallet ON public.user_trades(wallet_address);
CREATE INDEX idx_user_trades_market ON public.user_trades(market_id);

-- Enable RLS
ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;

-- Anyone can view trades (they're public on blockchain anyway)
CREATE POLICY "Anyone can view trades"
ON public.user_trades
FOR SELECT
USING (true);

-- Anyone can insert trades (wallet validation happens client-side via signature)
CREATE POLICY "Anyone can insert trades"
ON public.user_trades
FOR INSERT
WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access user_trades"
ON public.user_trades
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_trades_updated_at
BEFORE UPDATE ON public.user_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();