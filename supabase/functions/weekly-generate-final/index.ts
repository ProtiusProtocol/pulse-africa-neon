import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Augurion's weekly intelligence editor. You produce two reports:
(1) Trader Pulse: concise, market-aware, signal-focused.
(2) Executive Brief: strategic, decision-oriented, board-ready.

Rules:
- Separate FACTS vs INTERPRETATION clearly.
- Use cautious probabilistic language ("likely", "elevated risk", "base case").
- No betting or investment advice.
- Cite sources for factual claims (domain + date).
- Do not mention internal toolchain. Output must be clean Markdown.`;

const TRADER_PULSE_FINAL_PROMPT = `You are finalizing the Trader Pulse report. You have been given:
- The draft report
- Admin's top 3 drivers (key themes to emphasize)
- Admin's contrarian view (include this perspective)
- Admin's sensitive items to avoid or soften

Rewrite the report incorporating admin guidance. Maintain the structure:
1) Headline take (3 bullets max)
2) What moved (facts only, bullets)
3) Signal board (table): Signal | Direction | Confidence (Low/Med/High) | Why (1 line)
4) Market watchlist (list the 6 live markets with 1–2 lines each)
5) Risks & invalidation (what would change the view)
6) Community question of the week (invite comments WITHOUT affecting outcomes)

Keep it tight and readable. Use citations inline when referencing news.`;

const EXEC_BRIEF_FINAL_PROMPT = `You are finalizing the Executive Brief report. You have been given:
- The draft report
- Admin's top 3 drivers (key themes to emphasize)
- Admin's contrarian view (include this perspective)
- Admin's sensitive items to avoid or soften

Rewrite the report incorporating admin guidance. Maintain the structure:
1) Executive summary (5 bullets)
2) Key developments (facts + citations)
3) Implications (3–5 bullets, clearly interpretation)
4) Scenarios (Base / Upside / Downside) with triggers
5) Actions to consider (non-prescriptive; options, not advice)
6) Appendix: Live market list (the 6 markets)

Tone: board-ready, sober, no hype.`;

async function generateAIContent(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { week_id } = await req.json();
    
    if (!week_id) {
      return new Response(JSON.stringify({ error: "week_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch digest
    const { data: digest, error: digestError } = await supabase
      .from("weekly_digest")
      .select("*")
      .eq("week_id", week_id)
      .single();
    
    if (digestError || !digest) {
      return new Response(JSON.stringify({ error: "Digest not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Fetch admin inputs
    const { data: adminInputs, error: inputsError } = await supabase
      .from("weekly_admin_inputs")
      .select("*")
      .eq("week_id", week_id)
      .single();
    
    if (inputsError || !adminInputs) {
      return new Response(JSON.stringify({ error: "Admin inputs not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!adminInputs.submitted_at) {
      return new Response(JSON.stringify({ error: "Admin inputs not yet submitted" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Fetch draft reports
    const { data: draftReports } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("week_id", week_id);
    
    const traderDraft = draftReports?.find(r => r.report_type === "trader_pulse");
    const execDraft = draftReports?.find(r => r.report_type === "executive_brief");
    
    if (!traderDraft || !execDraft) {
      return new Response(JSON.stringify({ error: "Draft reports not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Build admin guidance string
    const adminGuidance = `
Top 3 Drivers to Emphasize:
${(adminInputs.top_drivers || []).map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}

Contrarian View to Include:
${adminInputs.contrarian_view || 'None specified'}

Sensitive Items to Avoid/Soften:
${adminInputs.sensitive_avoid || 'None specified'}
`;
    
    // Generate final Trader Pulse
    const traderFinalPrompt = `${TRADER_PULSE_FINAL_PROMPT}

Draft Report:
${traderDraft.content_md}

Admin Guidance:
${adminGuidance}

Market Data:
${JSON.stringify(digest.market_snapshot, null, 2)}

Market Moves:
${digest.market_moves_md}

News Digest:
${digest.news_digest_md}`;
    
    const traderFinalContent = await generateAIContent(traderFinalPrompt, lovableApiKey);
    
    // Generate final Executive Brief
    const execFinalPrompt = `${EXEC_BRIEF_FINAL_PROMPT}

Draft Report:
${execDraft.content_md}

Admin Guidance:
${adminGuidance}

Market Data:
${JSON.stringify(digest.market_snapshot, null, 2)}

Market Moves:
${digest.market_moves_md}

News Digest:
${digest.news_digest_md}`;
    
    const execFinalContent = await generateAIContent(execFinalPrompt, lovableApiKey);
    
    // Update reports with final content
    await supabase
      .from("weekly_reports")
      .update({ 
        content_md: traderFinalContent, 
        status: "ready_to_publish",
        version: 2 
      })
      .eq("id", traderDraft.id);
    
    await supabase
      .from("weekly_reports")
      .update({ 
        content_md: execFinalContent, 
        status: "ready_to_publish",
        version: 2 
      })
      .eq("id", execDraft.id);
    
    console.log(`Generated final reports for week ${week_id}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Generated final reports for week ${week_id}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in weekly-generate-final:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
