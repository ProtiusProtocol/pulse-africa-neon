-- Add region/country field to fragility_signals for pan-African tracking
ALTER TABLE public.fragility_signals 
ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'Southern Africa';

-- Add a source field to track where signal updates come from (admin/automated)
ALTER TABLE public.fragility_signals 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';

-- Add weekly_update_md field for weekly signal commentary
ALTER TABLE public.fragility_signals 
ADD COLUMN IF NOT EXISTS weekly_update_md text;