import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Auth: require admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await admin.rpc("has_role", {
      _user_id: userRes.user.id, _role: "admin",
    });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const topic = String(body?.topic ?? "").trim();
    const context = String(body?.context ?? "").trim();
    const region = String(body?.region ?? "Global").trim() || "Global";
    const autoGenerateMarkets = Boolean(body?.autoGenerateMarkets ?? false);

    if (!topic || topic.length < 5) {
      return new Response(JSON.stringify({ error: "Topic required (min 5 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert in geopolitics, religion, science, economics, and prediction markets.
Generate ONE fragility signal capturing a near-to-medium-term source of uncertainty.
A fragility signal has:
- signal_code: SHORT uppercase code with category prefix (REL, SCI, GEO, ECO, CLI, POL, TECH, HEALTH...) + dash + short name. Max 30 chars. Example: REL-PAPAL-AUTHORITY-2026
- name: human-readable title (max 80 chars)
- description: 1-2 sentence neutral description
- why_it_matters: 1-2 sentences on impact, especially for African / global audiences
- core_components: array of 3-5 short bullet strings (specific drivers/factors)
- current_direction: one of "stable", "elevated", "declining"`;

    const userPrompt = `Admin-suggested topic: ${topic}
${context ? `Additional context: ${context}` : ""}
Region focus: ${region}

Generate the fragility signal as a structured object.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_signal",
            description: "Create a new fragility signal",
            parameters: {
              type: "object",
              properties: {
                signal_code: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                why_it_matters: { type: "string" },
                core_components: { type: "array", items: { type: "string" } },
                current_direction: { type: "string", enum: ["stable", "elevated", "declining"] },
              },
              required: ["signal_code", "name", "description", "why_it_matters", "core_components", "current_direction"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_signal" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI error ${aiResp.status}: ${t}`);
    }
    const aiData = await aiResp.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no signal");
    const signal = JSON.parse(args);

    // Ensure unique signal_code
    let code = String(signal.signal_code).toUpperCase().replace(/[^A-Z0-9-]/g, "-").slice(0, 30);
    const { data: existing } = await admin
      .from("fragility_signals").select("signal_code").eq("signal_code", code).maybeSingle();
    if (existing) code = `${code}-${Date.now().toString().slice(-4)}`.slice(0, 30);

    const { data: inserted, error: insErr } = await admin
      .from("fragility_signals")
      .insert({
        signal_code: code,
        name: signal.name,
        description: signal.description,
        why_it_matters: signal.why_it_matters,
        core_components: signal.core_components,
        current_direction: signal.current_direction,
        region,
        source: "admin",
      })
      .select()
      .single();

    if (insErr) throw new Error(`Insert failed: ${insErr.message}`);

    let marketsTriggered = 0;
    if (autoGenerateMarkets && signal.current_direction === "elevated") {
      // Fire-and-await fragility-market-suggestions
      const trigger = await fetch(`${supabaseUrl}/functions/v1/fragility-market-suggestions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: "{}",
      });
      if (trigger.ok) {
        const r = await trigger.json().catch(() => ({}));
        marketsTriggered = r?.suggestionsCreated ?? 0;
      }
    }

    return new Response(JSON.stringify({ success: true, signal: inserted, marketsTriggered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-suggest-signal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
