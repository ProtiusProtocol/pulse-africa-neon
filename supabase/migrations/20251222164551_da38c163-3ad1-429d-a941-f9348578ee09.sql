-- Create table for community question responses
CREATE TABLE public.community_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('trader_pulse', 'executive_brief')),
  question_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  respondent_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a response
CREATE POLICY "Anyone can submit community responses"
ON public.community_responses
FOR INSERT
WITH CHECK (true);

-- Anyone can view responses (for display in reports)
CREATE POLICY "Anyone can view community responses"
ON public.community_responses
FOR SELECT
USING (true);

-- Service role full access
CREATE POLICY "Service role full access community_responses"
ON public.community_responses
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient querying by week
CREATE INDEX idx_community_responses_week ON public.community_responses(week_id, report_type);