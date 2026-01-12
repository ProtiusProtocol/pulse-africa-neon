-- Create market_translations table for multi-language support
CREATE TABLE public.market_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table TEXT NOT NULL CHECK (source_table IN ('markets', 'outcomes_watchlist')),
  source_id UUID NOT NULL,
  field TEXT NOT NULL CHECK (field IN ('title', 'question_text', 'resolution_criteria')),
  language TEXT NOT NULL CHECK (language IN ('fr', 'pt', 'de', 'af', 'zu', 'es', 'it')),
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_table, source_id, field, language)
);

-- Enable RLS
ALTER TABLE public.market_translations ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Anyone can read translations"
ON public.market_translations
FOR SELECT
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_market_translations_lookup 
ON public.market_translations(source_table, source_id, language);

-- Add updated_at trigger
CREATE TRIGGER update_market_translations_updated_at
BEFORE UPDATE ON public.market_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();