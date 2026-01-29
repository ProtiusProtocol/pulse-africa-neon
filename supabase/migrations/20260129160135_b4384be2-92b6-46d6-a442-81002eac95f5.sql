-- Create table for AI-generated market suggestions from fragility signals
CREATE TABLE public.market_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_code TEXT NOT NULL,
  suggested_title TEXT NOT NULL,
  suggested_outcome_ref TEXT NOT NULL,
  suggested_category TEXT NOT NULL DEFAULT 'Energy',
  suggested_region TEXT NOT NULL DEFAULT 'Southern Africa',
  suggested_deadline TIMESTAMP WITH TIME ZONE,
  suggested_resolution_criteria TEXT,
  ai_reasoning TEXT,
  source_signal_direction TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_market_id UUID REFERENCES public.markets(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can view suggestions (admins will filter in UI)
CREATE POLICY "Anyone can view market suggestions"
  ON public.market_suggestions
  FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access market_suggestions"
  ON public.market_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_market_suggestions_updated_at
  BEFORE UPDATE ON public.market_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for quick lookups
CREATE INDEX idx_market_suggestions_status ON public.market_suggestions(status);
CREATE INDEX idx_market_suggestions_signal_code ON public.market_suggestions(signal_code);