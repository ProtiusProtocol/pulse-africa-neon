-- Add gamification columns to paper_leaderboard
ALTER TABLE public.paper_leaderboard 
ADD COLUMN IF NOT EXISTS streak_current integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_best integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_total integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

-- Create achievements definition table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  xp_reward integer NOT NULL DEFAULT 50,
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- Create user achievements tracking table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  tenant_id text NOT NULL DEFAULT 'soccer-laduma',
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_id, achievement_id, tenant_id)
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view user achievements
CREATE POLICY "Anyone can view user achievements"
ON public.user_achievements
FOR SELECT
USING (true);

-- Anyone can unlock achievements
CREATE POLICY "Anyone can unlock achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (true);

-- Insert starter achievements
INSERT INTO public.achievements (code, name, description, icon, xp_reward, category, requirement_type, requirement_value) VALUES
('first_prediction', 'First Prediction', 'Make your first prediction', '🎯', 50, 'milestones', 'predictions_made', 1),
('prediction_5', 'Getting Started', 'Make 5 predictions', '⚡', 100, 'milestones', 'predictions_made', 5),
('prediction_10', 'Dedicated Fan', 'Make 10 predictions', '🔥', 200, 'milestones', 'predictions_made', 10),
('prediction_25', 'True Believer', 'Make 25 predictions', '💎', 500, 'milestones', 'predictions_made', 25),
('first_win', 'Winner!', 'Win your first prediction', '🏆', 100, 'wins', 'predictions_won', 1),
('wins_5', 'On Fire', 'Win 5 predictions', '🔥', 250, 'wins', 'predictions_won', 5),
('wins_10', 'Sharp Mind', 'Win 10 predictions', '🧠', 500, 'wins', 'predictions_won', 10),
('streak_3', 'Hot Streak', 'Win 3 predictions in a row', '🔥', 150, 'streaks', 'streak_current', 3),
('streak_5', 'Unstoppable', 'Win 5 predictions in a row', '⚡', 300, 'streaks', 'streak_current', 5),
('streak_10', 'Legendary', 'Win 10 predictions in a row', '👑', 1000, 'streaks', 'streak_current', 10),
('accuracy_60', 'Sharp Shooter', 'Reach 60% accuracy', '🎯', 200, 'accuracy', 'accuracy_pct', 60),
('accuracy_75', 'Expert Analyst', 'Reach 75% accuracy', '📊', 400, 'accuracy', 'accuracy_pct', 75),
('points_2000', 'Point Collector', 'Reach 2,000 points', '💰', 200, 'points', 'total_points', 2000),
('points_5000', 'High Roller', 'Reach 5,000 points', '💎', 500, 'points', 'total_points', 5000),
('level_5', 'Rising Star', 'Reach level 5', '⭐', 250, 'levels', 'level', 5),
('level_10', 'Pro Predictor', 'Reach level 10', '🌟', 500, 'levels', 'level', 10);