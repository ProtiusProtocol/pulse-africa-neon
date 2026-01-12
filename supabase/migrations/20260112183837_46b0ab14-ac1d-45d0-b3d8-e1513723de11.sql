-- Insert Sport Fragility Signal
INSERT INTO public.fragility_signals (
  signal_code,
  name,
  description,
  why_it_matters,
  core_components,
  current_direction,
  region,
  source
) VALUES (
  'FS-SPORT',
  'Sport Sector Dynamics',
  'Tracks major sporting events, team performance, league dynamics, and sports governance factors that drive public attention and economic activity in Southern Africa.',
  'Sport commands significant public attention and spending in the region. Major events (PSL, rugby internationals, cricket) drive media cycles, tourism, and betting activity. Governance issues, team performance, and event scheduling create predictable outcome windows.',
  '[{"name": "Major Event Calendar", "description": "Upcoming fixtures, tournaments, and international events"}, {"name": "Team Performance Metrics", "description": "League standings, form, injury reports, and squad dynamics"}, {"name": "Governance & Federation", "description": "Sports body decisions, sponsorship deals, broadcast rights"}, {"name": "Fan Sentiment", "description": "Social media engagement, ticket sales, and public mood"}]'::jsonb,
  'stable',
  'Southern Africa',
  'admin'
);