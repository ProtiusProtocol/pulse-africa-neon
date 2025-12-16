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

const TRADER_PULSE_PROMPT = `Input:
- Week range {week_start}–{week_end}
- Market snapshot list (app_id, title, status, yes_total, no_total, fee_bps, outcomeRef, any volume/proxy metrics)
- Weekly digest: market_moves_md + news_digest_md

Write "Trader Pulse — Week {week_id}" in Markdown with this structure:

1) Headline take (3 bullets max)
2) What moved (facts only, bullets)
3) Signal board (table): Signal | Direction | Confidence (Low/Med/High) | Why (1 line)
4) Market watchlist (list the 6 live markets with 1–2 lines each)
5) Risks & invalidation (what would change the view)
6) Community question of the week (invite comments WITHOUT affecting outcomes)

Keep it tight and readable. Use citations inline when referencing news.`;

const EXEC_BRIEF_PROMPT = `Input:
- Week range {week_start}–{week_end}
- Market snapshot list
- Weekly digest

Write "Executive Brief — Week {week_id}" in Markdown with this structure:

1) Executive summary (5 bullets)
2) Key developments (facts + citations)
3) Implications (3–5 bullets, clearly interpretation)
4) Scenarios (Base / Upside / Downside) with triggers
5) Actions to consider (non-prescriptive; options, not advice)
6) Appendix: Live market list (the 6 markets)

Tone: board-ready, sober, no hype.`;

const NEWS_EXTRACTION_PROMPT = `Given the raw article text, extract:
- 5 bullet summary (facts only)
- 3 tags (e.g., elections, energy, FX, security, BEE, regional)
- Any measurable datapoints (numbers, dates, names)
Return JSON with format: { "summary_bullets": [...], "tags": [...], "datapoints": [...] }`;

// Get ISO week number and year
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}

// Get previous week's Monday and Sunday in Vienna timezone
function getPreviousWeekRange(): { weekId: string; weekStart: Date; weekEnd: Date } {
  const now = new Date();
  // Go back to previous Monday
  const dayOfWeek = now.getUTCDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() - daysToSubtract);
  
  // Previous week Monday
  const prevMonday = new Date(thisMonday);
  prevMonday.setUTCDate(thisMonday.getUTCDate() - 7);
  prevMonday.setUTCHours(0, 0, 0, 0);
  
  // Previous week Sunday
  const prevSunday = new Date(prevMonday);
  prevSunday.setUTCDate(prevMonday.getUTCDate() + 6);
  prevSunday.setUTCHours(23, 59, 59, 999);
  
  const { year, week } = getISOWeek(prevMonday);
  const weekId = `${year}-W${week.toString().padStart(2, '0')}`;
  
  return { weekId, weekStart: prevMonday, weekEnd: prevSunday };
}

async function fetchRSSFeed(feedUrl: string): Promise<Array<{ title: string; url: string; published_at: string | null }>> {
  try {
    const response = await fetch(feedUrl, { 
      headers: { "User-Agent": "Augurion/1.0" },
    });
    if (!response.ok) return [];
    
    const text = await response.text();
    const items: Array<{ title: string; url: string; published_at: string | null }> = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    for (const match of itemMatches) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemContent.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
      const pubDateMatch = itemContent.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          url: linkMatch[1].trim(),
          published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : null,
        });
      }
    }
    
    return items.slice(0, 20); // Limit to 20 items per source
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

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

async function extractNewsContent(text: string, apiKey: string): Promise<{ summary_bullets: string[]; tags: string[]; datapoints: any[] }> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You extract structured data from news articles. Always return valid JSON." },
          { role: "user", content: `${NEWS_EXTRACTION_PROMPT}\n\nArticle:\n${text.slice(0, 5000)}` },
        ],
      }),
    });
    
    if (!response.ok) return { summary_bullets: [], tags: [], datapoints: [] };
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { summary_bullets: [], tags: [], datapoints: [] };
  } catch {
    return { summary_bullets: [], tags: [], datapoints: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get previous week range
    const { weekId, weekStart, weekEnd } = getPreviousWeekRange();
    console.log(`Generating drafts for week ${weekId} (${weekStart.toISOString()} to ${weekEnd.toISOString()})`);
    
    // Check if digest already exists
    const { data: existingDigest } = await supabase
      .from("weekly_digest")
      .select("id")
      .eq("week_id", weekId)
      .single();
    
    if (existingDigest) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Digest for week ${weekId} already exists` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // 1. Fetch market snapshots
    const { data: markets } = await supabase
      .from("markets")
      .select("*")
      .eq("status", "active");
    
    const marketSnapshot = markets || [];
    console.log(`Fetched ${marketSnapshot.length} markets`);
    
    // 2. Fetch news from RSS sources
    const { data: sources } = await supabase
      .from("news_sources")
      .select("*")
      .eq("is_active", true)
      .eq("feed_type", "rss");
    
    const allItems: Array<{
      source_id: string;
      week_id: string;
      title: string;
      url: string;
      published_at: string | null;
    }> = [];
    
    for (const source of (sources || [])) {
      if (!source.feed_url) continue;
      console.log(`Fetching RSS from ${source.name}...`);
      const items = await fetchRSSFeed(source.feed_url);
      for (const item of items) {
        // Filter to items within the week range
        if (item.published_at) {
          const pubDate = new Date(item.published_at);
          if (pubDate >= weekStart && pubDate <= weekEnd) {
            allItems.push({
              source_id: source.id,
              week_id: weekId,
              title: item.title,
              url: item.url,
              published_at: item.published_at,
            });
          }
        } else {
          // Include items without dates
          allItems.push({
            source_id: source.id,
            week_id: weekId,
            title: item.title,
            url: item.url,
            published_at: null,
          });
        }
      }
    }
    
    console.log(`Collected ${allItems.length} news items for the week`);
    
    // 3. Store source items
    if (allItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("weekly_source_items")
        .insert(allItems);
      
      if (itemsError) {
        console.error("Error storing source items:", itemsError);
      }
    }
    
    // 4. Generate market moves summary
    const marketMovesPrompt = `Summarize the following market data as "Market Moves" for week ${weekId}:
${JSON.stringify(marketSnapshot, null, 2)}

Write 3-5 bullet points about market status and key metrics. Facts only, no interpretation.`;
    
    const marketMovesMd = await generateAIContent(marketMovesPrompt, lovableApiKey);
    console.log("Generated market moves summary");
    
    // 5. Generate news digest
    const newsDigestPrompt = `Create a news digest from these headlines for week ${weekId}:
${allItems.slice(0, 50).map(i => `- ${i.title}`).join('\n')}

Write 10-15 bullet points summarizing key news. Include source citations (domain + date) for each point.`;
    
    const newsDigestMd = await generateAIContent(newsDigestPrompt, lovableApiKey);
    console.log("Generated news digest");
    
    // 6. Create weekly digest record
    const { error: digestError } = await supabase
      .from("weekly_digest")
      .insert({
        week_id: weekId,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        market_snapshot: marketSnapshot,
        market_moves_md: marketMovesMd,
        news_digest_md: newsDigestMd,
        citations: allItems.slice(0, 50).map(i => ({ title: i.title, url: i.url, date: i.published_at })),
      });
    
    if (digestError) {
      throw new Error(`Error creating digest: ${digestError.message}`);
    }
    
    // 7. Create admin inputs placeholder
    await supabase
      .from("weekly_admin_inputs")
      .insert({ week_id: weekId });
    
    // 8. Generate draft reports
    const traderPulseContent = await generateAIContent(
      TRADER_PULSE_PROMPT
        .replace(/{week_start}/g, weekStart.toISOString().split('T')[0])
        .replace(/{week_end}/g, weekEnd.toISOString().split('T')[0])
        .replace(/{week_id}/g, weekId) +
      `\n\nMarket Data:\n${JSON.stringify(marketSnapshot, null, 2)}\n\nMarket Moves:\n${marketMovesMd}\n\nNews Digest:\n${newsDigestMd}`,
      lovableApiKey
    );
    
    const execBriefContent = await generateAIContent(
      EXEC_BRIEF_PROMPT
        .replace(/{week_start}/g, weekStart.toISOString().split('T')[0])
        .replace(/{week_end}/g, weekEnd.toISOString().split('T')[0])
        .replace(/{week_id}/g, weekId) +
      `\n\nMarket Data:\n${JSON.stringify(marketSnapshot, null, 2)}\n\nMarket Moves:\n${marketMovesMd}\n\nNews Digest:\n${newsDigestMd}`,
      lovableApiKey
    );
    
    // 9. Store draft reports
    const { error: reportsError } = await supabase
      .from("weekly_reports")
      .insert([
        {
          week_id: weekId,
          report_type: "trader_pulse",
          status: "draft",
          version: 1,
          content_md: traderPulseContent,
        },
        {
          week_id: weekId,
          report_type: "executive_brief",
          status: "draft",
          version: 1,
          content_md: execBriefContent,
        },
      ]);
    
    if (reportsError) {
      throw new Error(`Error creating reports: ${reportsError.message}`);
    }
    
    console.log(`Successfully generated drafts for week ${weekId}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      weekId,
      message: `Generated drafts for week ${weekId}`,
      stats: {
        markets: marketSnapshot.length,
        newsItems: allItems.length,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in weekly-generate-drafts:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
