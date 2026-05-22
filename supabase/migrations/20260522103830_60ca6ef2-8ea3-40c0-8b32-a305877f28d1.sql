
-- Auto-settle user_trades when a market gets resolved
CREATE OR REPLACE FUNCTION public.auto_settle_trades_on_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.resolved_outcome IS NOT NULL
     AND (OLD.resolved_outcome IS DISTINCT FROM NEW.resolved_outcome) THEN
    UPDATE public.user_trades
       SET status = CASE
         WHEN lower(side) = lower(NEW.resolved_outcome) THEN 'claimed'
         ELSE 'lost'
       END,
       updated_at = now()
     WHERE market_id = NEW.id
       AND status NOT IN ('claimed','lost');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_settle_trades ON public.markets;
CREATE TRIGGER trg_auto_settle_trades
AFTER UPDATE OF resolved_outcome ON public.markets
FOR EACH ROW
EXECUTE FUNCTION public.auto_settle_trades_on_resolution();

-- Backfill: settle existing resolved markets
UPDATE public.user_trades t
   SET status = CASE
     WHEN lower(t.side) = lower(m.resolved_outcome) THEN 'claimed'
     ELSE 'lost'
   END,
   updated_at = now()
  FROM public.markets m
 WHERE t.market_id = m.id
   AND m.resolved_outcome IS NOT NULL
   AND t.status NOT IN ('claimed','lost');
