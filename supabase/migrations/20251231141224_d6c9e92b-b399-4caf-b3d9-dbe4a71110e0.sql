-- Create attention categories table (fixed 12 categories)
CREATE TABLE public.attention_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_group TEXT NOT NULL CHECK (category_group IN ('fragility', 'sport')),
  description TEXT,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attention_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view attention categories" 
ON public.attention_categories 
FOR SELECT 
USING (true);

-- Service role full access
CREATE POLICY "Service role full access attention_categories" 
ON public.attention_categories 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create attention scores table (weekly scores per category)
CREATE TABLE public.attention_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.attention_categories(id) ON DELETE CASCADE,
  week_id TEXT NOT NULL,
  attention_score NUMERIC NOT NULL DEFAULT 0,
  engagement_score NUMERIC NOT NULL DEFAULT 0,
  market_worthiness_score NUMERIC NOT NULL DEFAULT 0,
  combined_score NUMERIC GENERATED ALWAYS AS (
    (attention_score * 0.4 + engagement_score * 0.3 + market_worthiness_score * 0.3)
  ) STORED,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, week_id)
);

-- Enable RLS
ALTER TABLE public.attention_scores ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view attention scores" 
ON public.attention_scores 
FOR SELECT 
USING (true);

-- Service role full access
CREATE POLICY "Service role full access attention_scores" 
ON public.attention_scores 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create weekly snapshots table
CREATE TABLE public.attention_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL UNIQUE,
  summary_md TEXT,
  recommended_markets JSONB DEFAULT '[]'::jsonb,
  deprioritised_topics JSONB DEFAULT '[]'::jsonb,
  sport_percentage NUMERIC DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attention_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view attention snapshots" 
ON public.attention_snapshots 
FOR SELECT 
USING (true);

-- Service role full access
CREATE POLICY "Service role full access attention_snapshots" 
ON public.attention_snapshots 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add updated_at trigger for scores
CREATE TRIGGER update_attention_scores_updated_at
BEFORE UPDATE ON public.attention_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for snapshots
CREATE TRIGGER update_attention_snapshots_updated_at
BEFORE UPDATE ON public.attention_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 12 fixed categories
INSERT INTO public.attention_categories (code, name, category_group, description, keywords, display_order) VALUES
('LOAD_SHEDDING', 'Electricity & Load Shedding', 'fragility', 'Power system stress, Eskom outages, energy crisis', '["load shedding", "eskom", "stage 4", "stage 6", "blackout", "power cut", "electricity crisis"]', 1),
('FUEL', 'Fuel Prices & Logistics', 'fragility', 'Fuel price movements, supply chain stress', '["petrol price", "diesel price", "fuel increase", "transport costs", "logistics"]', 2),
('FX', 'FX & Capital Stress (ZAR)', 'fragility', 'Rand volatility, capital flows, currency pressure', '["rand", "ZAR", "dollar rand", "currency", "forex", "capital flight"]', 3),
('FOOD_INFLATION', 'Food Prices & Inflation', 'fragility', 'Food security, CPI, cost of living', '["food prices", "inflation", "cost of living", "groceries", "CPI"]', 4),
('POLITICAL', 'Political Stability', 'fragility', 'Government stability, coalition dynamics, policy uncertainty', '["ANC", "DA", "GNU", "coalition", "Ramaphosa", "cabinet"]', 5),
('ELECTIONS', 'Elections & Governance', 'fragility', 'Electoral processes, municipal elections, voter sentiment', '["elections", "IEC", "voting", "by-election", "municipal"]', 6),
('LABOUR', 'Labour Unrest', 'fragility', 'Strikes, wage disputes, union activity', '["strike", "NUMSA", "COSATU", "wage dispute", "labour unrest"]', 7),
('SECURITY', 'Security & Infrastructure Risk', 'fragility', 'Crime, infrastructure sabotage, safety concerns', '["crime", "security", "cable theft", "infrastructure", "sabotage"]', 8),
('CLIMATE', 'Climate & Water Stress', 'fragility', 'Drought, water restrictions, weather events', '["drought", "water crisis", "dam levels", "climate", "el nino"]', 9),
('RUGBY', 'Rugby', 'sport', 'Springboks, URC, Currie Cup', '["springboks", "rugby", "URC", "currie cup", "rassie"]', 10),
('CRICKET', 'Cricket', 'sport', 'Proteas, CSA, T20', '["proteas", "cricket", "CSA", "T20", "test match"]', 11),
('SOCCER', 'Soccer', 'sport', 'PSL, Bafana Bafana, CAF', '["bafana bafana", "PSL", "kaizer chiefs", "orlando pirates", "mamelodi sundowns"]', 12);