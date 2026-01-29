import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FragilitySignal {
  id: string;
  signal_code: string;
  name: string;
  description: string;
  current_direction: string;
  why_it_matters: string;
  region: string;
  core_components: unknown[];
  weekly_update_md: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch fragility signals with elevated direction
    const { data: elevatedSignals, error: signalsError } = await supabase
      .from("fragility_signals")
      .select("*")
      .eq("current_direction", "elevated");

    if (signalsError) {
      throw new Error(`Failed to fetch fragility signals: ${signalsError.message}`);
    }

    if (!elevatedSignals || elevatedSignals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No elevated fragility signals found", 
          suggestionsCreated: 0 
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${elevatedSignals.length} elevated fragility signals`);

    // Check existing suggestions to avoid duplicates
    const { data: existingSuggestions } = await supabase
      .from("market_suggestions")
      .select("signal_code, suggested_outcome_ref")
      .in("status", ["pending", "approved"]);

    const existingRefs = new Set(existingSuggestions?.map(s => s.suggested_outcome_ref) || []);
    const existingSignalCodes = new Set(existingSuggestions?.map(s => s.signal_code) || []);

    let suggestionsCreated = 0;

    for (const signal of elevatedSignals as FragilitySignal[]) {
      // Skip if we already have a pending/approved suggestion for this signal
      if (existingSignalCodes.has(signal.signal_code)) {
        console.log(`Skipping ${signal.signal_code} - already has pending suggestion`);
        continue;
      }

      // Generate market suggestion using AI
      const systemPrompt = `You are an expert in African political economy and prediction markets. Your task is to suggest binary prediction markets based on fragility signals.

A good prediction market has:
1. A clear, binary YES/NO outcome
2. An objective resolution criteria
3. A specific deadline
4. A unique outcome reference ID (CamelCase, no spaces, max 40 chars)

Outcome reference ID rules:
- Use category prefixes: SAEnergy, SAPolitic, SAEcon, SAClimate, SAFDI, etc.
- Use descriptive suffixes: Stage6PlusBy30Jun26, CabinetReshuffleBy31Dec25
- No special characters except alphanumeric
- CamelCase format

You must respond with a JSON object using the suggest_market function.`;

      const userPrompt = `Based on this elevated fragility signal, suggest ONE specific prediction market:

Signal Code: ${signal.signal_code}
Signal Name: ${signal.name}
Description: ${signal.description}
Why It Matters: ${signal.why_it_matters}
Region: ${signal.region}
Core Components: ${JSON.stringify(signal.core_components)}
${signal.weekly_update_md ? `Recent Update: ${signal.weekly_update_md}` : ''}

Generate a market that:
1. Captures the most likely near-term outcome from this elevated fragility
2. Has a deadline within 3-12 months from now
3. Can be objectively resolved with public data
4. Has a unique outcome_ref following our naming conventions`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "suggest_market",
                  description: "Suggest a new prediction market based on the fragility signal",
                  parameters: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string", 
                        description: "The market question as a YES/NO binary outcome" 
                      },
                      outcome_ref: { 
                        type: "string", 
                        description: "Unique identifier, CamelCase, max 40 chars, e.g. SAEnergyStage6PlusBy30Jun26" 
                      },
                      category: { 
                        type: "string", 
                        enum: ["Energy", "Politics", "Economy", "Climate", "Infrastructure", "Sport", "Tourism"],
                        description: "Market category" 
                      },
                      deadline: { 
                        type: "string", 
                        description: "ISO date string for resolution deadline" 
                      },
                      resolution_criteria: { 
                        type: "string", 
                        description: "Clear, objective criteria for YES/NO resolution" 
                      },
                      reasoning: { 
                        type: "string", 
                        description: "Why this market is relevant given the elevated fragility signal" 
                      }
                    },
                    required: ["title", "outcome_ref", "category", "deadline", "resolution_criteria", "reasoning"],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "suggest_market" } }
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API error for ${signal.signal_code}:`, aiResponse.status, errorText);
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall?.function?.arguments) {
          console.error(`No tool call response for ${signal.signal_code}`);
          continue;
        }

        const suggestion = JSON.parse(toolCall.function.arguments);
        
        // Validate outcome_ref uniqueness
        if (existingRefs.has(suggestion.outcome_ref)) {
          console.log(`Duplicate outcome_ref ${suggestion.outcome_ref}, modifying...`);
          suggestion.outcome_ref = `${suggestion.outcome_ref}V2`;
        }

        // Insert suggestion
        const { error: insertError } = await supabase
          .from("market_suggestions")
          .insert({
            signal_code: signal.signal_code,
            suggested_title: suggestion.title,
            suggested_outcome_ref: suggestion.outcome_ref,
            suggested_category: suggestion.category,
            suggested_region: signal.region,
            suggested_deadline: suggestion.deadline,
            suggested_resolution_criteria: suggestion.resolution_criteria,
            ai_reasoning: suggestion.reasoning,
            source_signal_direction: "elevated",
            status: "pending"
          });

        if (insertError) {
          console.error(`Failed to insert suggestion for ${signal.signal_code}:`, insertError);
          continue;
        }

        console.log(`Created market suggestion for ${signal.signal_code}: ${suggestion.outcome_ref}`);
        suggestionsCreated++;
        existingRefs.add(suggestion.outcome_ref);
        existingSignalCodes.add(signal.signal_code);

      } catch (aiError) {
        console.error(`AI processing error for ${signal.signal_code}:`, aiError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fragility market suggestions generated`,
        elevatedSignals: elevatedSignals.length,
        suggestionsCreated,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in fragility-market-suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
