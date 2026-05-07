// Server-side gate for all paper-trading writes.
// Uses SERVICE_ROLE to bypass RLS while enforcing business rules.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TENANT_ID = "soccer-laduma";
const STARTING_POINTS = 1000;
const PREDICTION_STAKE = 50;
const REFERRAL_BONUS = 100;

const RARITY_WEIGHTS: Record<string, number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

interface Body {
  action: string;
  session_id: string;
  // optional per-action fields
  market_id?: string;
  side?: "yes" | "no";
  display_name?: string;
  referral_code?: string;
  card_id?: string;
  bonus_points?: number;
}

function isUuid(s: unknown): s is string {
  return typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  if (!body || typeof body.action !== "string" || !isUuid(body.session_id)) {
    return json(400, { error: "invalid_body" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const sessionId = body.session_id;

  // Helper: ensure leaderboard row exists, return it
  async function ensureLeaderboard() {
    const { data: existing } = await supabase
      .from("paper_leaderboard")
      .select("*")
      .eq("session_id", sessionId)
      .eq("tenant_id", TENANT_ID)
      .maybeSingle();
    if (existing) return existing;
    const { data: created, error } = await supabase
      .from("paper_leaderboard")
      .insert({
        session_id: sessionId,
        tenant_id: TENANT_ID,
        total_points: STARTING_POINTS,
        display_name: "Anonymous Fan",
      })
      .select("*")
      .single();
    if (error) throw error;
    return created;
  }

  try {
    switch (body.action) {
      case "make_prediction": {
        if (!isUuid(body.market_id) || (body.side !== "yes" && body.side !== "no")) {
          return json(400, { error: "invalid_prediction" });
        }
        const lb = await ensureLeaderboard();
        if ((lb.total_points ?? 0) < PREDICTION_STAKE) {
          return json(400, { error: "insufficient_points" });
        }
        // Prevent duplicate prediction on the same market
        const { data: dup } = await supabase
          .from("paper_predictions")
          .select("id")
          .eq("session_id", sessionId)
          .eq("market_id", body.market_id)
          .eq("tenant_id", TENANT_ID)
          .maybeSingle();
        if (dup) return json(409, { error: "already_predicted" });

        const { error: updErr } = await supabase
          .from("paper_leaderboard")
          .update({
            total_points: lb.total_points - PREDICTION_STAKE,
            predictions_made: (lb.predictions_made ?? 0) + 1,
          })
          .eq("id", lb.id);
        if (updErr) throw updErr;

        const { data: pred, error: insErr } = await supabase
          .from("paper_predictions")
          .insert({
            session_id: sessionId,
            tenant_id: TENANT_ID,
            market_id: body.market_id,
            side: body.side,
            points_staked: PREDICTION_STAKE,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        return json(200, { prediction: pred });
      }

      case "update_display_name": {
        const name = (body.display_name ?? "").trim();
        if (name.length < 2 || name.length > 30) {
          return json(400, { error: "invalid_name" });
        }
        await ensureLeaderboard();
        const { error } = await supabase
          .from("paper_leaderboard")
          .update({ display_name: name })
          .eq("session_id", sessionId)
          .eq("tenant_id", TENANT_ID);
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "add_bonus_points": {
        // Demo-only: bounded bonus
        const amount = Number(body.bonus_points);
        if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
          return json(400, { error: "invalid_amount" });
        }
        const lb = await ensureLeaderboard();
        const { error } = await supabase
          .from("paper_leaderboard")
          .update({ total_points: (lb.total_points ?? 0) + amount })
          .eq("id", lb.id);
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "claim_daily_card": {
        const lb = await ensureLeaderboard();
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        if (lb.last_card_claim) {
          const last = new Date(lb.last_card_claim).toISOString().split("T")[0];
          if (last === today) return json(409, { error: "already_claimed_today" });
        }
        const { data: cards, error: cardsErr } = await supabase
          .from("fan_cards")
          .select("*")
          .eq("is_active", true);
        if (cardsErr) throw cardsErr;
        if (!cards || cards.length === 0) return json(500, { error: "no_cards" });
        const weighted: any[] = [];
        for (const c of cards) {
          const w = RARITY_WEIGHTS[c.rarity as string] ?? 1;
          for (let i = 0; i < w; i++) weighted.push(c);
        }
        const selected = weighted[Math.floor(Math.random() * weighted.length)];

        let newStreak = 1;
        let streakBonus = 0;
        if (lb.last_card_claim) {
          const hours = (now.getTime() - new Date(lb.last_card_claim).getTime()) / 3_600_000;
          if (hours < 48) {
            newStreak = (lb.card_streak_current ?? 0) + 1;
            streakBonus = Math.min(newStreak * 5, 50);
          }
        }
        const cpEarned = (selected.cp_value ?? 0) + streakBonus;
        const newCardPoints = (lb.card_points ?? 0) + cpEarned;
        const newStreakBest = Math.max(newStreak, lb.card_streak_best ?? 0);

        const { error: updErr } = await supabase
          .from("paper_leaderboard")
          .update({
            card_points: newCardPoints,
            card_streak_current: newStreak,
            card_streak_best: newStreakBest,
            last_card_claim: now.toISOString(),
          })
          .eq("id", lb.id);
        if (updErr) throw updErr;

        const { error: cardErr } = await supabase
          .from("user_cards")
          .insert({
            session_id: sessionId,
            card_id: selected.id,
            tenant_id: TENANT_ID,
          });
        if (cardErr) throw cardErr;

        return json(200, {
          card: selected,
          cpEarned,
          streakBonus,
          newStreak,
          isNewStreakBest: newStreak > (lb.card_streak_best ?? 0),
        });
      }

      case "mark_cards_seen": {
        const { error } = await supabase
          .from("user_cards")
          .update({ is_new: false })
          .eq("session_id", sessionId)
          .eq("tenant_id", TENANT_ID)
          .eq("is_new", true);
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "demo_claim_card": {
        // Demo-only: bypasses daily limit. Caller supplies streak bonus.
        const streakBonus = Math.max(0, Math.min(50, Number(body.bonus_points) || 0));
        const lb = await ensureLeaderboard();
        const { data: cards, error: cardsErr } = await supabase
          .from("fan_cards").select("*").eq("is_active", true);
        if (cardsErr) throw cardsErr;
        if (!cards || cards.length === 0) return json(500, { error: "no_cards" });
        const weighted: any[] = [];
        for (const c of cards) {
          const w = RARITY_WEIGHTS[c.rarity as string] ?? 1;
          for (let i = 0; i < w; i++) weighted.push(c);
        }
        const selected = weighted[Math.floor(Math.random() * weighted.length)];
        const cpEarned = (selected.cp_value ?? 0) + streakBonus;
        await supabase
          .from("paper_leaderboard")
          .update({
            card_points: (lb.card_points ?? 0) + cpEarned,
            card_streak_best: Math.max(lb.card_streak_best ?? 0, lb.card_streak_current ?? 0),
            last_card_claim: new Date().toISOString(),
          })
          .eq("id", lb.id);
        await supabase.from("user_cards").insert({
          session_id: sessionId, card_id: selected.id, tenant_id: TENANT_ID,
        });
        return json(200, { card: selected, cpEarned, streakBonus });
      }

      case "demo_reset_cards": {
        await supabase.from("user_cards").delete()
          .eq("session_id", sessionId).eq("tenant_id", TENANT_ID);
        await supabase.from("paper_leaderboard").update({
          card_points: 0,
          card_streak_current: 0,
          last_card_claim: null,
        }).eq("session_id", sessionId).eq("tenant_id", TENANT_ID);
        return json(200, { ok: true });
      }

      case "ensure_referral_code": {
        const lb = await ensureLeaderboard();
        if (lb.referral_code) {
          return json(200, { referral_code: lb.referral_code, referral_count: lb.referral_count ?? 0 });
        }
        const code = sessionId.substring(0, 8).toUpperCase();
        const { error } = await supabase
          .from("paper_leaderboard")
          .update({ referral_code: code })
          .eq("id", lb.id);
        if (error) throw error;
        return json(200, { referral_code: code, referral_count: lb.referral_count ?? 0 });
      }

      case "apply_referral_code": {
        const code = (body.referral_code ?? "").trim().toUpperCase();
        if (code.length < 4 || code.length > 16) return json(400, { error: "invalid_code" });

        const { data: existing } = await supabase
          .from("referrals")
          .select("id")
          .eq("referee_session_id", sessionId)
          .maybeSingle();
        if (existing) return json(409, { error: "already_referred" });

        const { data: referrer } = await supabase
          .from("paper_leaderboard")
          .select("id, session_id, total_points, referral_count")
          .eq("referral_code", code)
          .eq("tenant_id", TENANT_ID)
          .maybeSingle();
        if (!referrer) return json(404, { error: "invalid_code" });
        if (referrer.session_id === sessionId) return json(400, { error: "self_referral" });

        const { error: refErr } = await supabase
          .from("referrals")
          .insert({
            referrer_session_id: referrer.session_id,
            referee_session_id: sessionId,
            referral_code: code,
            tenant_id: TENANT_ID,
            bonus_awarded: true,
          });
        if (refErr) throw refErr;

        await supabase
          .from("paper_leaderboard")
          .update({
            total_points: (referrer.total_points ?? 0) + REFERRAL_BONUS,
            referral_count: (referrer.referral_count ?? 0) + 1,
          })
          .eq("id", referrer.id);

        const me = await ensureLeaderboard();
        await supabase
          .from("paper_leaderboard")
          .update({
            total_points: (me.total_points ?? 0) + REFERRAL_BONUS,
            referred_by: code,
          })
          .eq("id", me.id);

        return json(200, { bonus: REFERRAL_BONUS });
      }

      default:
        return json(400, { error: "unknown_action" });
    }
  } catch (e) {
    console.error("paper-trading-write error", e);
    return json(500, { error: "server_error", detail: String(e?.message ?? e) });
  }
});
