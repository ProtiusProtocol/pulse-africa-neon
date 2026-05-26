ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS prior_yes_pct numeric;
ALTER TABLE public.market_suggestions ADD COLUMN IF NOT EXISTS suggested_initial_yes_probability numeric;
ALTER TABLE public.market_suggestions ADD COLUMN IF NOT EXISTS suggested_initial_probability_reasoning text;