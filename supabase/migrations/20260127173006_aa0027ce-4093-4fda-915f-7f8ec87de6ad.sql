-- Add resolved_outcome column to store actual resolution result
-- This is separate from outcome_ref which is the stable market identifier

ALTER TABLE public.markets 
ADD COLUMN resolved_outcome text DEFAULT NULL;

-- Add a check constraint to ensure valid values
ALTER TABLE public.markets
ADD CONSTRAINT markets_resolved_outcome_check 
CHECK (resolved_outcome IS NULL OR resolved_outcome IN ('YES', 'NO', 'VOID'));

COMMENT ON COLUMN public.markets.outcome_ref IS 'Stable identifier for cross-network migration tracking';
COMMENT ON COLUMN public.markets.resolved_outcome IS 'Actual resolution result: YES, NO, or VOID (null while active)';