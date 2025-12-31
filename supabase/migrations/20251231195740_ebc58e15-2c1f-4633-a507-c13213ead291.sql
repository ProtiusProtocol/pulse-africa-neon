-- Create outcomes_watchlist table to track outcome questions from WATCH to TRADEABLE
CREATE TABLE public.outcomes_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_code TEXT NOT NULL,
  question_text TEXT NOT NULL,
  resolution_criteria TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'WATCH',
  probability_current NUMERIC DEFAULT 50,
  probability_previous NUMERIC DEFAULT 50,
  drift_direction TEXT DEFAULT 'stable',
  category TEXT NOT NULL DEFAULT 'medium-term',
  region TEXT NOT NULL DEFAULT 'Southern Africa',
  linked_market_id UUID REFERENCES public.markets(id),
  research_context TEXT,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('WATCH', 'APPROACHING', 'DEFINED', 'TRADEABLE', 'EXPIRED', 'RESOLVED')),
  CONSTRAINT valid_category CHECK (category IN ('short-term', 'medium-term', 'long-term')),
  CONSTRAINT valid_drift CHECK (drift_direction IN ('rising', 'falling', 'stable'))
);

-- Enable RLS
ALTER TABLE public.outcomes_watchlist ENABLE ROW LEVEL SECURITY;

-- Anyone can view outcomes
CREATE POLICY "Anyone can view outcomes watchlist"
ON public.outcomes_watchlist
FOR SELECT
USING (true);

-- Service role full access
CREATE POLICY "Service role full access outcomes_watchlist"
ON public.outcomes_watchlist
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for common queries
CREATE INDEX idx_outcomes_watchlist_signal ON public.outcomes_watchlist(signal_code);
CREATE INDEX idx_outcomes_watchlist_status ON public.outcomes_watchlist(status);
CREATE INDEX idx_outcomes_watchlist_deadline ON public.outcomes_watchlist(deadline);

-- Add updated_at trigger
CREATE TRIGGER update_outcomes_watchlist_updated_at
BEFORE UPDATE ON public.outcomes_watchlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint on attention_scores for upsert
ALTER TABLE public.attention_scores 
ADD CONSTRAINT attention_scores_category_week_unique UNIQUE (category_id, week_id);

-- Add unique constraint on attention_snapshots for upsert
ALTER TABLE public.attention_snapshots 
ADD CONSTRAINT attention_snapshots_week_unique UNIQUE (week_id);