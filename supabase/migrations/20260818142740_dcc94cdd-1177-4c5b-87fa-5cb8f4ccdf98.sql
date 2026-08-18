ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS researched_outcome text,
  ADD COLUMN IF NOT EXISTS researched_source text;

ALTER TABLE public.markets
  DROP CONSTRAINT IF EXISTS markets_researched_outcome_check;
ALTER TABLE public.markets
  ADD CONSTRAINT markets_researched_outcome_check
  CHECK (researched_outcome IS NULL OR researched_outcome IN ('YES','NO'));