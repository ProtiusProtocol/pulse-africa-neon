-- Ensure outcome_ref is mandatory and unique for stable cross-network migration
ALTER TABLE public.markets ALTER COLUMN outcome_ref SET NOT NULL;
ALTER TABLE public.markets ADD CONSTRAINT markets_outcome_ref_unique UNIQUE (outcome_ref);