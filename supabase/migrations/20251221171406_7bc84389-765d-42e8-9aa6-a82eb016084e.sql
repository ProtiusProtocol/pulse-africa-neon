-- Drop old constraint and add expanded one with all statuses
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS markets_status_check;

ALTER TABLE public.markets ADD CONSTRAINT markets_status_check 
CHECK (status IN ('pending', 'active', 'frozen', 'resolved', 'cancelled'));