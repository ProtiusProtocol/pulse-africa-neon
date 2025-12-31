import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category keywords for external search
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'LOAD_SHEDDING': ['load shedding', 'eskom', 'stage 4', 'stage 6', 'blackout', 'power cut', 'electricity crisis'],
  'FUEL': ['petrol price', 'diesel price', 'fuel increase', 'transport costs', 'logistics south africa'],
  'FX': ['rand dollar', 'ZAR USD', 'currency south africa', 'forex rand', 'capital flight'],
  'FOOD_INFLATION': ['food prices south africa', 'inflation CPI', 'cost of living', 'groceries expensive'],
  'POLITICAL': ['ANC DA coalition', 'GNU government', 'Ramaphosa cabinet', 'political stability'],
  'ELECTIONS': ['south africa elections', 'IEC voting', 'by-election', 'municipal elections'],
  'LABOUR': ['strike south africa', 'NUMSA', 'COSATU', 'wage dispute', 'labour unrest'],
  'SECURITY': ['crime south africa', 'security', 'cable theft', 'infrastructure sabotage'],
  'CLIMATE': ['drought south africa', 'water crisis', 'dam levels', 'el nino africa'],
  'RUGBY': ['springboks', 'rugby south africa', 'URC', 'currie cup', 'rassie erasmus'],
  'CRICKET': ['proteas cricket', 'CSA', 'T20 south africa', 'test match proteas'],
  'SOCCER': ['bafana bafana', 'PSL', 'kaizer chiefs', 'orlando pirates', 'mamelodi sundowns'],
};

// Function to calculate week ID (ISO week format)
function getWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Fetch news mentions via web search (using Perplexity-like approach)
async function fetchNewsAttention(categoryCode: string, keywords: string[]): Promise<{ score: number; sources: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log(`No API key, using simulated data for ${categoryCode}`);
    // Return simulated score based on category importance
    const baseScores: Record<string, number> = {
      'LOAD_SHEDDING': 75,
      'FUEL': 55,
      'FX': 60,
      'FOOD_INFLATION': 50,
      'POLITICAL': 65,
      'ELECTIONS': 40,
      'LABOUR': 35,
      'SECURITY': 45,
      'CLIMATE': 30,
      'RUGBY': 70,
      'CRICKET': 45,
      'SOCCER': 60,
    };
    const variance = Math.random() * 20 - 10; // -10 to +10
    return { 
      score: Math.max(0, Math.min(100, (baseScores[categoryCode] || 50) + variance)),
      sources: [] 
    };
  }

  try {
    const query = `Recent news about ${keywords.slice(0, 3).join(' OR ')} in South Africa last 7 days`;
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an attention analysis tool. Given a topic, estimate how much public attention it's receiving in South Africa on a scale of 0-100 where:
0-20: Very low attention, rare mentions
21-40: Low attention, occasional news
41-60: Moderate attention, regular coverage
61-80: High attention, trending topic
81-100: Very high attention, dominating headlines

Respond with JSON only: {"score": number, "reasoning": "brief explanation", "sources": ["example headlines if any"]}`
          },
          { 
            role: "user", 
            content: `Analyze current public attention for: ${keywords.join(', ')} in South Africa. Consider news coverage, social media, and public discourse.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error(`AI API error for ${categoryCode}:`, response.status);
      return { score: 50, sources: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { 
          score: Math.max(0, Math.min(100, parsed.score || 50)),
          sources: parsed.sources || []
        };
      }
    } catch (e) {
      console.log(`Could not parse AI response for ${categoryCode}, using default`);
    }
    
    return { score: 50, sources: [] };
  } catch (error) {
    console.error(`Error fetching attention for ${categoryCode}:`, error);
    return { score: 50, sources: [] };
  }
}

// Calculate market worthiness based on category characteristics
function calculateMarketWorthiness(categoryCode: string, attentionScore: number): number {
  // Base worthiness factors
  const settlabilityFactors: Record<string, number> = {
    'LOAD_SHEDDING': 90, // Very clear, measurable outcomes
    'FUEL': 85,          // Price-based, clear resolution
    'FX': 95,            // Numerical, objective
    'FOOD_INFLATION': 80, // CPI data available
    'POLITICAL': 70,      // Can be subjective
    'ELECTIONS': 95,      // Clear outcomes
    'LABOUR': 65,         // Sometimes unclear resolution
    'SECURITY': 60,       // Hard to measure objectively
    'CLIMATE': 75,        // Weather data available
    'RUGBY': 100,         // Match outcomes clear
    'CRICKET': 100,       // Match outcomes clear
    'SOCCER': 100,        // Match outcomes clear
  };
  
  const baseWorthiness = settlabilityFactors[categoryCode] || 50;
  
  // Adjust based on attention (high attention = more liquidity potential)
  const attentionBonus = attentionScore * 0.2;
  
  return Math.min(100, baseWorthiness * 0.7 + attentionBonus);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const weekId = getWeekId();
    console.log(`Starting attention ingestion for week: ${weekId}`);

    // Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('attention_categories')
      .select('*')
      .order('display_order');

    if (catError) throw catError;
    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }

    console.log(`Processing ${categories.length} categories`);

    // Process each category
    const results = [];
    for (const category of categories) {
      const keywords = category.keywords as string[] || CATEGORY_KEYWORDS[category.code] || [];
      
      // Fetch external attention
      const { score: attentionScore, sources } = await fetchNewsAttention(category.code, keywords);
      
      // Simulate engagement score (would come from analytics in production)
      const engagementScore = Math.random() * 60 + 20; // 20-80 range
      
      // Calculate market worthiness
      const marketWorthiness = calculateMarketWorthiness(category.code, attentionScore);
      
      console.log(`${category.code}: attention=${attentionScore.toFixed(1)}, engagement=${engagementScore.toFixed(1)}, worthiness=${marketWorthiness.toFixed(1)}`);

      // Upsert score
      const { error: upsertError } = await supabase
        .from('attention_scores')
        .upsert({
          category_id: category.id,
          week_id: weekId,
          attention_score: attentionScore,
          engagement_score: engagementScore,
          market_worthiness_score: marketWorthiness,
          raw_data: {
            sources,
            keywords_searched: keywords.slice(0, 5),
            fetched_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'category_id,week_id',
        });

      if (upsertError) {
        console.error(`Error upserting score for ${category.code}:`, upsertError);
      } else {
        results.push({
          code: category.code,
          attention: attentionScore,
          engagement: engagementScore,
          worthiness: marketWorthiness,
        });
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Generate weekly snapshot with AI recommendations
    await generateWeeklySnapshot(supabase, weekId, results);

    return new Response(JSON.stringify({ 
      success: true, 
      week_id: weekId,
      categories_processed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attention ingest error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWeeklySnapshot(supabase: any, weekId: string, results: any[]) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  // Sort by combined score
  const sorted = [...results].sort((a, b) => {
    const scoreA = a.attention * 0.4 + a.engagement * 0.3 + a.worthiness * 0.3;
    const scoreB = b.attention * 0.4 + b.engagement * 0.3 + b.worthiness * 0.3;
    return scoreB - scoreA;
  });

  // Identify sport categories
  const sportCodes = ['RUGBY', 'CRICKET', 'SOCCER'];
  const fragilityResults = sorted.filter(r => !sportCodes.includes(r.code));
  const sportResults = sorted.filter(r => sportCodes.includes(r.code));

  // Recommend markets (max 30% sport)
  const recommendations: any[] = [];
  let sportCount = 0;
  const maxSport = 2; // Max 2 out of 5 recommendations

  for (const result of sorted) {
    if (recommendations.length >= 5) break;
    
    const isSport = sportCodes.includes(result.code);
    if (isSport && sportCount >= maxSport) continue;
    
    if (isSport) sportCount++;
    recommendations.push({
      category_code: result.code,
      combined_score: result.attention * 0.4 + result.engagement * 0.3 + result.worthiness * 0.3,
      reason: isSport ? 'High liquidity potential' : 'Strong attention + clear outcomes',
    });
  }

  // Deprioritised topics (bottom 3)
  const deprioritised = sorted.slice(-3).map(r => ({
    category_code: r.code,
    reason: 'Low attention or poor market characteristics',
  }));

  // Generate summary
  let summaryMd = `## Weekly Attention Summary: ${weekId}\n\n`;
  summaryMd += `### Top Categories\n`;
  sorted.slice(0, 3).forEach((r, i) => {
    summaryMd += `${i + 1}. **${r.code}**: Attention ${r.attention.toFixed(0)}% | Engagement ${r.engagement.toFixed(0)}%\n`;
  });
  summaryMd += `\n### Sport vs Fragility\n`;
  const avgFragility = fragilityResults.reduce((sum, r) => sum + r.attention, 0) / fragilityResults.length;
  const avgSport = sportResults.reduce((sum, r) => sum + r.attention, 0) / sportResults.length;
  summaryMd += `- Fragility avg attention: ${avgFragility.toFixed(0)}%\n`;
  summaryMd += `- Sport avg attention: ${avgSport.toFixed(0)}%\n`;

  const sportPercentage = recommendations.filter(r => sportCodes.includes(r.category_code)).length / recommendations.length * 100;

  // Upsert snapshot
  const { error } = await supabase
    .from('attention_snapshots')
    .upsert({
      week_id: weekId,
      summary_md: summaryMd,
      recommended_markets: recommendations,
      deprioritised_topics: deprioritised,
      sport_percentage: sportPercentage,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'week_id',
    });

  if (error) {
    console.error('Error saving snapshot:', error);
  } else {
    console.log(`Snapshot saved for ${weekId}`);
  }
}
