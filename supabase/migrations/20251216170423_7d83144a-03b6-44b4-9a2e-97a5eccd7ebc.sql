-- Create fragility_signals table for Layer-1 signals
CREATE TABLE public.fragility_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  core_components JSONB NOT NULL DEFAULT '[]'::jsonb,
  why_it_matters TEXT NOT NULL,
  current_direction TEXT DEFAULT 'stable',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fragility_signals ENABLE ROW LEVEL SECURITY;

-- Anyone can view fragility signals (Layer 1 is public)
CREATE POLICY "Anyone can view fragility signals"
ON public.fragility_signals
FOR SELECT
USING (true);

-- Service role full access
CREATE POLICY "Service role full access fragility_signals"
ON public.fragility_signals
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_fragility_signals_updated_at
BEFORE UPDATE ON public.fragility_signals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add linked_signals column to markets table
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS linked_signals TEXT[] DEFAULT '{}';
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS resolution_criteria_full TEXT;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Insert the 5 fragility signals
INSERT INTO public.fragility_signals (signal_code, name, description, core_components, why_it_matters, current_direction)
VALUES
  ('FS-01', 'Power System Fragility', 'The structural reliability of the Southern African electricity system, with South Africa as the anchor node.', '["Eskom unplanned outage factor", "Regional interconnector stability (SAPP)", "Diesel burn vs baseload availability", "Maintenance slippage"]', 'Power instability cascades into GDP, FX, social unrest, and election outcomes.', 'elevated'),
  ('FS-02', 'Fiscal & Sovereign Stress', 'The sustainability of public finances and sovereign credibility.', '["Debt-to-GDP trajectory", "Primary deficit trends", "Treasury issuance pressure", "Credit rating outlooks"]', 'This signal directly drives ZAR valuation, capital flows, bond yields, and policy volatility.', 'elevated'),
  ('FS-03', 'Currency & Capital Flow Pressure', 'Stress on the rand and regional capital mobility.', '["FX volatility", "Portfolio inflows/outflows", "Risk-off correlation", "EM benchmark performance"]', 'Currency stress is often the earliest visible symptom of deeper fragility.', 'stable'),
  ('FS-04', 'Political Cohesion & Governance Stability', 'The ability of the political system to govern coherently.', '["Coalition stability", "Cabinet churn", "Parliamentary deadlock", "Policy reversals"]', 'Governance fragility amplifies every other risk signal.', 'elevated'),
  ('FS-05', 'BEE & Regulatory Friction Index', 'The degree to which empowerment policy and regulatory enforcement create friction for capital, infrastructure, and operational continuity.', '["New BEE-related legislation or enforcement", "Licensing delays or reversals", "Legal challenges and court rulings", "Investor sentiment linked to compliance uncertainty"]', 'This signal disproportionately affects foreign direct investment, energy projects, infrastructure timelines, and regional competitiveness.', 'stable');

-- Clear existing markets and insert the 5 locked market outcomes
DELETE FROM public.markets;

INSERT INTO public.markets (title, category, region, status, resolution_criteria, resolution_criteria_full, linked_signals, deadline, app_id)
VALUES
  ('Will South Africa experience nationally declared load shedding of Stage 4 or higher at any point before 30 June 2026?', 'Power System', 'Southern Africa', 'active', 'YES if Stage 4+ is officially declared; NO otherwise', 'Resolution: YES if Stage 4 or higher load shedding is officially declared by Eskom or the relevant authority at any point before 30 June 2026. NO otherwise.', '{"FS-01", "FS-04"}', '2026-06-30 23:59:59+00', 'market-power-system-01'),
  ('Will the South African rand trade weaker than ZAR 20.00/USD for five consecutive trading days before 31 December 2025?', 'Currency Stress', 'Southern Africa', 'active', 'YES if condition is met; NO otherwise', 'Resolution: YES if the ZAR/USD exchange rate closes weaker than 20.00 for five consecutive trading days before 31 December 2025. NO otherwise.', '{"FS-02", "FS-03"}', '2025-12-31 23:59:59+00', 'market-currency-stress-01'),
  ('Will South Africa undergo a national executive reconfiguration (new coalition or minority government) before 31 December 2025?', 'Political Structure', 'Southern Africa', 'active', 'YES if executive control structure changes; NO otherwise', 'Resolution: YES if the national executive undergoes a formal reconfiguration resulting in a new coalition arrangement or transition to minority government before 31 December 2025. NO otherwise.', '{"FS-04", "FS-05"}', '2025-12-31 23:59:59+00', 'market-political-structure-01'),
  ('Will a Southern African Power Pool (SAPP) member experience a cross-border electricity supply disruption lasting longer than 72 hours before 30 June 2026?', 'Regional Energy', 'Southern Africa', 'active', 'YES if any qualifying event occurs; NO otherwise', 'Resolution: YES if any SAPP member country experiences a documented cross-border electricity supply disruption exceeding 72 continuous hours before 30 June 2026. NO otherwise.', '{"FS-01", "FS-03"}', '2026-06-30 23:59:59+00', 'market-regional-energy-01'),
  ('Will a BEE-related regulatory action materially delay or block a foreign-owned infrastructure or energy project in South Africa before 31 December 2025?', 'BEE & Investment', 'Southern Africa', 'active', 'YES if a documented delay/block occurs; NO otherwise', 'Resolution: YES if a BEE-related regulatory action results in a documented material delay or blocking of a foreign-owned infrastructure or energy project before 31 December 2025. NO otherwise.', '{"FS-05", "FS-04"}', '2025-12-31 23:59:59+00', 'market-bee-investment-01');