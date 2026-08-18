// Admin-only bulk cleanup of expired markets (DB-only resolution, demo/TestNet safe).
// Actions:
//  - preview: list expired-but-open markets with prediction/trade counts
//  - settle : resolve a batch of markets to YES/NO in the DB, settle paper predictions + leaderboard
//  - void   : cancel a batch of markets, refund staked paper points, mark trades refunded
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TENANT_ID = "soccer-laduma";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const asUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: userData } = await asUser.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!userData?.user) return json({ error: "Unauthorized" }, 401);
  const { data: isAdmin } = await asUser.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "preview");

  try {
    if (action === "preview") {
      const { data: markets, error } = await admin
        .from("markets")
        .select("id, title, category, region, status, deadline, prior_yes_pct, yes_total, no_total, app_id, resolved_outcome, researched_outcome, researched_source")
        .is("resolved_outcome", null)
        .not("status", "in", '("resolved","cancelled")')
        .lt("deadline", new Date().toISOString())
        .order("deadline", { ascending: true });
      if (error) throw error;

      const ids = (markets ?? []).map((m) => m.id);
      const preds: Record<string, number> = {};
      const trades: Record<string, number> = {};
      if (ids.length) {
        const { data: p } = await admin
          .from("paper_predictions")
          .select("market_id")
          .in("market_id", ids)
          .eq("status", "pending");
        (p ?? []).forEach((r) => { preds[r.market_id] = (preds[r.market_id] ?? 0) + 1; });
        const { data: t } = await admin
          .from("user_trades")
          .select("market_id, wallet_address")
          .in("market_id", ids);
        (t ?? []).forEach((r) => {
          if (r.wallet_address !== "SEED_DATA") trades[r.market_id] = (trades[r.market_id] ?? 0) + 1;
        });
      }

      return json({
        markets: (markets ?? []).map((m) => ({
          ...m,
          pending_predictions: preds[m.id] ?? 0,
          real_trades: trades[m.id] ?? 0,
        })),
      });
    }

    if (action !== "settle" && action !== "void") {
      return json({ error: "invalid_action" }, 400);
    }

    const items: Array<{ market_id: string; outcome?: string }> = Array.isArray(body.items)
      ? body.items
      : [];
    if (!items.length || items.length > 200) return json({ error: "items required (1-200)" }, 400);
    for (const it of items) {
      if (!isUuid(it?.market_id)) return json({ error: "invalid market_id" }, 400);
      if (action === "settle") {
        const o = String(it.outcome ?? "").toUpperCase();
        if (o !== "YES" && o !== "NO") return json({ error: "outcome must be YES or NO" }, 400);
      }
    }

    const results: Array<{ market_id: string; ok: boolean; detail: string }> = [];
    const touchedSessions = new Set<string>();

    for (const it of items) {
      const marketId = it.market_id;
      const outcome = String(it.outcome ?? "").toUpperCase();

      const { data: market } = await admin
        .from("markets")
        .select("id, title, status, resolved_outcome")
        .eq("id", marketId)
        .maybeSingle();
      if (!market) {
        results.push({ market_id: marketId, ok: false, detail: "not found" });
        continue;
      }
      if (market.resolved_outcome || market.status === "cancelled") {
        results.push({ market_id: marketId, ok: false, detail: "already closed" });
        continue;
      }

      // 1) Market row (trg_auto_settle_trades settles user_trades on resolve)
      const marketUpdate = action === "settle"
        ? { status: "resolved", resolved_outcome: outcome }
        : { status: "cancelled" };
      const { error: mErr } = await admin.from("markets").update(marketUpdate).eq("id", marketId);
      if (mErr) {
        results.push({ market_id: marketId, ok: false, detail: mErr.message });
        continue;
      }

      // 2) On-chain trades: refunded on void (DB flag only – TestNet demo funds)
      if (action === "void") {
        await admin
          .from("user_trades")
          .update({ status: "refunded" })
          .eq("market_id", marketId)
          .not("status", "in", '("claimed","lost","refunded")');
      }

      // 3) Paper predictions
      const { data: preds } = await admin
        .from("paper_predictions")
        .select("*")
        .eq("market_id", marketId)
        .eq("status", "pending");

      let settled = 0;
      for (const p of preds ?? []) {
        const stake = Number(p.points_staked ?? 50);
        const { data: lb } = await admin
          .from("paper_leaderboard")
          .select("*")
          .eq("session_id", p.session_id)
          .eq("tenant_id", p.tenant_id ?? TENANT_ID)
          .maybeSingle();

        if (action === "void") {
          await admin
            .from("paper_predictions")
            .update({ status: "void", points_won: stake, resolved_at: new Date().toISOString() })
            .eq("id", p.id);
          if (lb) {
            await admin
              .from("paper_leaderboard")
              .update({
                total_points: Number(lb.total_points ?? 0) + stake,
                predictions_made: Math.max(0, Number(lb.predictions_made ?? 0) - 1),
              })
              .eq("id", lb.id);
          }
        } else {
          const won = String(p.side ?? "").toLowerCase() === outcome.toLowerCase();
          const payout = won ? stake * 2 : 0;
          await admin
            .from("paper_predictions")
            .update({
              status: won ? "won" : "lost",
              points_won: payout,
              resolved_at: new Date().toISOString(),
            })
            .eq("id", p.id);
          if (lb) {
            const wins = Number(lb.predictions_won ?? 0) + (won ? 1 : 0);
            const losses = Number(lb.predictions_lost ?? 0) + (won ? 0 : 1);
            const streak = won ? Number(lb.streak_current ?? 0) + 1 : 0;
            await admin
              .from("paper_leaderboard")
              .update({
                total_points: Number(lb.total_points ?? 0) + payout,
                weekly_points: Number(lb.weekly_points ?? 0) + (won ? stake : -stake),
                predictions_won: wins,
                predictions_lost: losses,
                accuracy_pct: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : null,
                streak_current: streak,
                streak_best: Math.max(Number(lb.streak_best ?? 0), streak),
                xp_total: Number(lb.xp_total ?? 0) + (won ? 25 : 5),
              })
              .eq("id", lb.id);
          }
        }
        touchedSessions.add(p.session_id);
        settled++;
      }

      results.push({
        market_id: marketId,
        ok: true,
        detail: action === "settle"
          ? `resolved ${outcome}, ${settled} prediction(s) settled`
          : `cancelled, ${settled} prediction(s) refunded`,
      });
    }

    // 4) Recompute all-time ranks for the tenant
    const { data: board } = await admin
      .from("paper_leaderboard")
      .select("id, total_points")
      .eq("tenant_id", TENANT_ID)
      .order("total_points", { ascending: false });
    let rank = 0;
    for (const row of board ?? []) {
      rank++;
      await admin.from("paper_leaderboard").update({ all_time_rank: rank }).eq("id", row.id);
    }

    return json({
      success: true,
      action,
      processed: results.filter((r) => r.ok).length,
      skipped: results.filter((r) => !r.ok).length,
      sessions_affected: touchedSessions.size,
      results,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
