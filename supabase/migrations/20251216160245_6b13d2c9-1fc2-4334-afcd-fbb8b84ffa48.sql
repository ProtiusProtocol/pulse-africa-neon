-- Weekly Intelligence System Schema

-- Markets table (on-chain markets we track)
CREATE TABLE public.markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Southern Africa',
  category TEXT NOT NULL,
  oracle_address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'resolved')),
  yes_total NUMERIC DEFAULT 0,
  no_total NUMERIC DEFAULT 0,
  fee_bps INTEGER DEFAULT 100,
  outcome_ref TEXT,
  resolution_criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- News sources table
CREATE TABLE public.news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  feed_url TEXT,
  feed_type TEXT NOT NULL DEFAULT 'rss' CHECK (feed_type IN ('rss', 'html', 'manual')),
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly source items (fetched articles snapshot)
CREATE TABLE public.weekly_source_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.news_sources(id) ON DELETE CASCADE,
  week_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  summary_bullets JSONB,
  tags TEXT[],
  datapoints JSONB,
  raw_content TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly digest (market moves + news digest)
CREATE TABLE public.weekly_digest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL UNIQUE,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  market_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  market_moves_md TEXT,
  news_digest_md TEXT,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin inputs for each week
CREATE TABLE public.weekly_admin_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL UNIQUE,
  top_drivers TEXT[] DEFAULT '{}',
  contrarian_view TEXT,
  sensitive_avoid TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly reports (drafts and finals)
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('trader_pulse', 'executive_brief')),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_to_publish', 'published')),
  content_md TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_id, report_type)
);

-- Enable RLS
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_digest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_admin_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Public read policies for published reports
CREATE POLICY "Anyone can view markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Anyone can view news sources" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY "Anyone can view published reports" ON public.weekly_reports FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can view digest for published weeks" ON public.weekly_digest FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.weekly_reports WHERE weekly_reports.week_id = weekly_digest.week_id AND weekly_reports.status = 'published'));

-- Admin policies (using service role for edge functions)
CREATE POLICY "Service role full access markets" ON public.markets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access news_sources" ON public.news_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access weekly_source_items" ON public.weekly_source_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access weekly_digest" ON public.weekly_digest FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access weekly_admin_inputs" ON public.weekly_admin_inputs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access weekly_reports" ON public.weekly_reports FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_weekly_source_items_week ON public.weekly_source_items(week_id);
CREATE INDEX idx_weekly_reports_week_type ON public.weekly_reports(week_id, report_type);
CREATE INDEX idx_weekly_reports_status ON public.weekly_reports(status);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_digest_updated_at BEFORE UPDATE ON public.weekly_digest FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_admin_inputs_updated_at BEFORE UPDATE ON public.weekly_admin_inputs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_reports_updated_at BEFORE UPDATE ON public.weekly_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 6 live markets
INSERT INTO public.markets (app_id, title, category, resolution_criteria, outcome_ref) VALUES
('market_sa_election_2029', 'SA Election 2029 Outcome', 'elections', 'Resolves YES if ANC receives <45% national vote share in 2029 general election as certified by IEC', 'IEC official results'),
('market_loadshedding_stage6', 'Load Shedding Stage 6+ by Q2 2025', 'energy', 'Resolves YES if Eskom declares Stage 6 or higher load shedding for 3+ consecutive days before June 30, 2025', 'Eskom official announcements'),
('market_zar_20_threshold', 'ZAR Breaches R20/USD by H1 2025', 'fx', 'Resolves YES if USD/ZAR spot rate exceeds 20.00 for any trading day before July 1, 2025 per SARB data', 'SARB daily rates'),
('market_protest_disruption', 'Major Protest Disruption Q1 2025', 'social', 'Resolves YES if protests cause >3 days of major transport/business disruption in Gauteng or Western Cape before April 1, 2025', 'News coverage + SAPS reports'),
('market_beitbridge_closure', 'Beitbridge Border Closure 2025', 'logistics', 'Resolves YES if Beitbridge border post closes for >48 hours due to any cause in 2025', 'SARS/Home Affairs announcements'),
('market_bee_enforcement_2025', 'BEE Enforcement Escalation 2025', 'bee', 'Resolves YES if government announces new BEE compliance penalties, procurement exclusions, or sector-specific enforcement actions affecting >R10bn in contracts before Dec 31, 2025', 'Government Gazette + BBBEE Commission');

-- Seed news sources
INSERT INTO public.news_sources (name, url, feed_url, feed_type, category) VALUES
('Reuters Africa', 'https://www.reuters.com/world/africa/', 'https://www.reuters.com/arc/outboundfeeds/v4/feed/section/world/africa/', 'rss', 'international'),
('BBC News Africa', 'https://www.bbc.com/news/world/africa', 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', 'rss', 'international'),
('Al Jazeera Africa', 'https://www.aljazeera.com/africa/', 'https://www.aljazeera.com/xml/rss/all.xml', 'rss', 'international'),
('Africa News', 'https://www.africanews.com/', 'https://www.africanews.com/rss/', 'rss', 'regional'),
('The Conversation Africa', 'https://theconversation.com/africa', 'https://theconversation.com/africa/articles.rss', 'rss', 'analysis'),
('Daily Maverick', 'https://www.dailymaverick.co.za/', 'https://www.dailymaverick.co.za/rss/', 'rss', 'south_africa'),
('News24', 'https://www.news24.com/', 'https://feeds.news24.com/articles/news24/TopStories/rss', 'rss', 'south_africa'),
('SABC News', 'https://www.sabcnews.com/', 'https://www.sabcnews.com/rss', 'rss', 'south_africa'),
('Business Day', 'https://www.businesslive.co.za/', NULL, 'html', 'business'),
('The Africa Report', 'https://www.theafricareport.com/', 'https://www.theafricareport.com/feed/', 'rss', 'regional'),
('IMF', 'https://www.imf.org/en/Countries', 'https://www.imf.org/en/News/RSS', 'rss', 'institutional'),
('World Bank', 'https://www.worldbank.org/en/region/afr', 'https://blogs.worldbank.org/rss.xml', 'rss', 'institutional'),
('ReliefWeb Southern Africa', 'https://reliefweb.int/updates', 'https://reliefweb.int/updates/rss.xml', 'rss', 'humanitarian'),
('UN OCHA', 'https://www.unocha.org/', 'https://www.unocha.org/rss', 'rss', 'humanitarian'),
('IEC South Africa', 'https://www.elections.org.za/', NULL, 'manual', 'elections'),
('Eskom', 'https://www.eskom.co.za/', NULL, 'manual', 'energy'),
('SARB', 'https://www.resbank.co.za/', NULL, 'manual', 'monetary'),
('Stats SA', 'https://www.statssa.gov.za/', NULL, 'manual', 'data'),
('Government Gazette', 'https://www.gov.za/documents/government-gazette', NULL, 'manual', 'government');