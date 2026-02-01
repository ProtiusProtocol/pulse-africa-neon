-- Create paper_predictions table for Soccer Laduma (non-wallet predictions)
CREATE TABLE public.paper_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL, -- Anonymous session identifier (stored in localStorage)
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  points_staked INTEGER NOT NULL DEFAULT 50,
  points_won INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  tenant_id TEXT NOT NULL DEFAULT 'soccer-laduma',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, market_id) -- One prediction per market per session
);

-- Create leaderboard_entries table for tracking user scores
CREATE TABLE public.paper_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous Fan',
  tenant_id TEXT NOT NULL DEFAULT 'soccer-laduma',
  total_points INTEGER NOT NULL DEFAULT 1000, -- Starting points
  predictions_made INTEGER NOT NULL DEFAULT 0,
  predictions_won INTEGER NOT NULL DEFAULT 0,
  predictions_lost INTEGER NOT NULL DEFAULT 0,
  accuracy_pct NUMERIC,
  weekly_points INTEGER NOT NULL DEFAULT 0,
  weekly_rank INTEGER,
  all_time_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.paper_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS policies for paper_predictions
CREATE POLICY "Anyone can view paper predictions"
  ON public.paper_predictions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert paper predictions"
  ON public.paper_predictions FOR INSERT
  WITH CHECK (true);

-- RLS policies for paper_leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON public.paper_leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert leaderboard entry"
  ON public.paper_leaderboard FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own leaderboard entry"
  ON public.paper_leaderboard FOR UPDATE
  USING (true);

-- Indexes for performance
CREATE INDEX idx_paper_predictions_session ON public.paper_predictions(session_id);
CREATE INDEX idx_paper_predictions_market ON public.paper_predictions(market_id);
CREATE INDEX idx_paper_predictions_tenant ON public.paper_predictions(tenant_id);
CREATE INDEX idx_paper_leaderboard_tenant_points ON public.paper_leaderboard(tenant_id, total_points DESC);
CREATE INDEX idx_paper_leaderboard_session ON public.paper_leaderboard(session_id);

-- Trigger for updated_at on leaderboard
CREATE TRIGGER update_paper_leaderboard_updated_at
  BEFORE UPDATE ON public.paper_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();