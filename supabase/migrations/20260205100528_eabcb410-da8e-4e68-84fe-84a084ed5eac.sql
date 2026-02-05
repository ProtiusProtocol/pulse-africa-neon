-- Add card_points column to paper_leaderboard for CP tracking
ALTER TABLE public.paper_leaderboard
ADD COLUMN card_points integer NOT NULL DEFAULT 0,
ADD COLUMN card_streak_current integer NOT NULL DEFAULT 0,
ADD COLUMN card_streak_best integer NOT NULL DEFAULT 0,
ADD COLUMN last_card_claim timestamp with time zone;

-- Fan cards master table (card definitions)
CREATE TABLE public.fan_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  cp_value integer NOT NULL DEFAULT 10,
  category text NOT NULL DEFAULT 'player',
  team text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User card collection
CREATE TABLE public.user_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  card_id uuid NOT NULL REFERENCES public.fan_cards(id),
  tenant_id text NOT NULL DEFAULT 'soccer-laduma',
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  is_new boolean NOT NULL DEFAULT true
);

-- Card sets for completion bonuses
CREATE TABLE public.card_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  card_codes text[] NOT NULL DEFAULT '{}',
  bonus_cp integer NOT NULL DEFAULT 500,
  badge_icon text DEFAULT '🏆',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User completed sets
CREATE TABLE public.user_card_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  set_id uuid NOT NULL REFERENCES public.card_sets(id),
  tenant_id text NOT NULL DEFAULT 'soccer-laduma',
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  bonus_claimed boolean NOT NULL DEFAULT false,
  UNIQUE(session_id, set_id, tenant_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.fan_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_card_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for fan_cards (public read)
CREATE POLICY "Anyone can view fan cards"
ON public.fan_cards FOR SELECT
USING (true);

-- RLS policies for user_cards
CREATE POLICY "Anyone can view user cards"
ON public.user_cards FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert user cards"
ON public.user_cards FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own cards"
ON public.user_cards FOR UPDATE
USING (true);

-- RLS policies for card_sets (public read)
CREATE POLICY "Anyone can view card sets"
ON public.card_sets FOR SELECT
USING (true);

-- RLS policies for user_card_sets
CREATE POLICY "Anyone can view user card sets"
ON public.user_card_sets FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert user card sets"
ON public.user_card_sets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own card sets"
ON public.user_card_sets FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_user_cards_session ON public.user_cards(session_id, tenant_id);
CREATE INDEX idx_user_cards_card ON public.user_cards(card_id);
CREATE INDEX idx_user_card_sets_session ON public.user_card_sets(session_id, tenant_id);