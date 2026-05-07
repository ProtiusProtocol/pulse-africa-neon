
-- Lock down direct client writes on paper trading tables.
-- All writes will go through the `paper-trading-write` edge function (service-role).
-- SELECT remains public to preserve leaderboard, ticker, and universe visualizations.

-- paper_leaderboard
DROP POLICY IF EXISTS "Anyone can insert leaderboard entry" ON public.paper_leaderboard;
DROP POLICY IF EXISTS "Users can update own leaderboard entry" ON public.paper_leaderboard;

-- paper_predictions
DROP POLICY IF EXISTS "Anyone can insert paper predictions" ON public.paper_predictions;

-- user_cards
DROP POLICY IF EXISTS "Anyone can insert user cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.user_cards;

-- referrals
DROP POLICY IF EXISTS "Anyone can create referrals" ON public.referrals;

-- user_achievements
DROP POLICY IF EXISTS "Anyone can unlock achievements" ON public.user_achievements;
