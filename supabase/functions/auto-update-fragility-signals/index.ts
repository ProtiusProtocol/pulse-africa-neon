import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALERT_EMAILS = ["giorgiomauro63@gmail.com", "petroscali@yahoo.co.uk"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const admin = createClient(supabaseUrl, serviceKey);

    // If invoked by a user, require admin (cron uses service key, no user → skip check)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader && !authHeader.includes(serviceKey)) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (u?.user) {
        const { data: ok } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
        if (!ok) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: signals, error: sErr } = await admin
      .from("fragility_signals")
      .select("*");
    if (sErr) throw sErr;
    if (!signals?.length) {
      return new Response(JSON.stringify({ success: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a senior geopolitical & risk analyst maintaining a portfolio of fragility signals.
For EACH signal, assess its current trajectory based on its existing context and any meaningful real-world developments you reasonably know about in the past 7 days.
Return for each:
- signal_code (echo)
- new_direction: "stable" | "elevated" | "declining"
- weekly_update_md: 2-4 sentence markdown note. Separate FACTS from INTERPRETATION.
- meaningful_event: true ONLY if a notable, market-moving development occurred
- event_summary: short headline if meaningful_event=true, else empty string
Be conservative: most weeks most signals are "stable" with no meaningful event.`;

    const userPrompt = `Today: ${new Date().toISOString().slice(0,10)}

Signals:
${signals.map((s: any) => `---
signal_code: ${s.signal_code}
name: ${s.name}
region: ${s.region}
current_direction: ${s.current_direction}
description: ${s.description}
why_it_matters: ${s.why_it_matters}
last_weekly_note: ${s.weekly_update_md ?? "(none)"}`).join("\n")}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "update_signals",
            description: "Return weekly updates for all signals",
            parameters: {
              type: "object",
              properties: {
                updates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      signal_code: { type: "string" },
                      new_direction: { type: "string", enum: ["stable", "elevated", "declining"] },
                      weekly_update_md: { type: "string" },
                      meaningful_event: { type: "boolean" },
                      event_summary: { type: "string" },
                    },
                    required: ["signal_code", "new_direction", "weekly_update_md", "meaningful_event", "event_summary"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["updates"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "update_signals" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 429) throw new Error("Rate limited by AI gateway");
      if (aiResp.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error ${aiResp.status}: ${t}`);
    }
    const aiData = await aiResp.json();
    const argsStr = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("AI returned no updates");
    const { updates } = JSON.parse(argsStr) as {
      updates: Array<{ signal_code: string; new_direction: string; weekly_update_md: string; meaningful_event: boolean; event_summary: string }>;
    };

    let updated = 0;
    const alerts: Array<{ code: string; name: string; from: string; to: string; summary: string; note: string }> = [];

    for (const u of updates) {
      const sig = signals.find((s: any) => s.signal_code === u.signal_code);
      if (!sig) continue;
      const directionChanged = sig.current_direction !== u.new_direction;
      const escalated = directionChanged && u.new_direction === "elevated";

      const { error: upErr } = await admin
        .from("fragility_signals")
        .update({
          current_direction: u.new_direction,
          weekly_update_md: u.weekly_update_md,
          last_updated: new Date().toISOString(),
        })
        .eq("id", sig.id);
      if (!upErr) updated++;

      if (escalated || u.meaningful_event) {
        alerts.push({
          code: sig.signal_code,
          name: sig.name,
          from: sig.current_direction,
          to: u.new_direction,
          summary: u.event_summary || "(direction change)",
          note: u.weekly_update_md,
        });
      }
    }

    // Trigger market suggestions for any newly-elevated signals
    let marketsTriggered = 0;
    if (alerts.some((a) => a.to === "elevated")) {
      const r = await fetch(`${supabaseUrl}/functions/v1/fragility-market-suggestions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: "{}",
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        marketsTriggered = j?.suggestionsCreated ?? 0;
      }
    }

    // Email admin if there are alerts
    if (alerts.length && resendKey) {
      const html = `
<h2>Fragility Signals — Weekly Auto-Update</h2>
<p>${updated} signal(s) refreshed. ${alerts.length} meaningful event(s) flagged.</p>
${alerts.map((a) => `
  <div style="border-left:3px solid #84cc16;padding:8px 12px;margin:12px 0;background:#0a0a0a;color:#e5e5e5;">
    <div><strong>${a.code} — ${a.name}</strong></div>
    <div style="font-size:12px;color:#a3a3a3;">Direction: ${a.from} → <strong>${a.to}</strong></div>
    <div style="margin-top:6px;"><em>${a.summary}</em></div>
    <div style="margin-top:6px;font-size:13px;">${a.note.replace(/\n/g, "<br/>")}</div>
  </div>`).join("")}
<p style="font-size:12px;color:#737373;">Review &amp; override in Admin → Fragility Signals.</p>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Augurion Pulse <alerts@augurionpulse.com>",
          to: [ALERT_EMAIL],
          subject: `[Augurion] ${alerts.length} fragility signal alert(s) this week`,
          html,
        }),
      }).catch((e) => console.error("Resend failed:", e));
    }

    return new Response(JSON.stringify({
      success: true, updated, alerts: alerts.length, marketsTriggered,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("auto-update-fragility-signals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
