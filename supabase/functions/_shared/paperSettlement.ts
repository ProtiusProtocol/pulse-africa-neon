// Shared settlement for Soccer Laduma paper predictions.
// Two concerns are deliberately separated:
//   1) OUTCOME RECORDING (always): prediction marked won/lost/void, wins/losses,
//      accuracy, streaks, XP — this is what feeds reputation & reward eligibility.
//   2) REWARD POLICY (swappable): what, if anything, is paid back in points.
// Policies:
//   - "legacy_points"  : current live mechanic (stake returned x2 on a win, stake refunded on void).
//   - "credit_access"  : one credit = one prediction. No points paid back; the result
//                        only updates reputation. Void returns nothing (credit model TBD).
// Switch the policy here (or via the PAPER_REWARD_POLICY secret) — resolution code does not change.
// deno-lint-ignore-file no-explicit-any

export type RewardPolicy = "legacy_points" | "credit_access";

export const DEFAULT_TENANT = "soccer-laduma";

export function currentPolicy(): RewardPolicy {
  const v = (globalThis as any).Deno?.env?.get("PAPER_REWARD_POLICY");
  return v === "credit_access" ? "credit_access" : "legacy_points";
}

function rewardFor(policy: RewardPolicy, kind: "won" | "lost" | "void", stake: number) {
  if (policy === "credit_access") return { pointsBack: 0, weeklyDelta: 0 };
  if (kind === "won") return { pointsBack: stake * 2, weeklyDelta: stake };
  if (kind === "lost") return { pointsBack: 0, weeklyDelta: -stake };
  return { pointsBack: stake, weeklyDelta: 0 };
}

/** Settle all pending paper predictions for a market. outcome = "YES" | "NO" | null (void). */
export async function settlePaperPredictions(
  admin: any,
  marketId: string,
  outcome: string | null,
  policy: RewardPolicy = currentPolicy(),
): Promise<{ settled: number; sessions: Set<string>; tenants: Set<string> }> {
  const sessions = new Set<string>();
  const tenants = new Set<string>();
  const { data: preds } = await admin
    .from("paper_predictions")
    .select("*")
    .eq("market_id", marketId)
    .eq("status", "pending");

  let settled = 0;
  const now = new Date().toISOString();
  for (const p of preds ?? []) {
    const tenant = p.tenant_id ?? DEFAULT_TENANT;
    const stake = Number(p.points_staked ?? 0);
    const kind: "won" | "lost" | "void" = outcome === null
      ? "void"
      : String(p.side ?? "").toLowerCase() === outcome.toLowerCase() ? "won" : "lost";
    const { pointsBack, weeklyDelta } = rewardFor(policy, kind, stake);

    await admin
      .from("paper_predictions")
      .update({ status: kind, points_won: pointsBack, resolved_at: now })
      .eq("id", p.id);

    const { data: lb } = await admin
      .from("paper_leaderboard")
      .select("*")
      .eq("session_id", p.session_id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (lb) {
      if (kind === "void") {
        await admin.from("paper_leaderboard").update({
          total_points: Number(lb.total_points ?? 0) + pointsBack,
          predictions_made: Math.max(0, Number(lb.predictions_made ?? 0) - 1),
        }).eq("id", lb.id);
      } else {
        const won = kind === "won";
        const wins = Number(lb.predictions_won ?? 0) + (won ? 1 : 0);
        const losses = Number(lb.predictions_lost ?? 0) + (won ? 0 : 1);
        const streak = won ? Number(lb.streak_current ?? 0) + 1 : 0;
        await admin.from("paper_leaderboard").update({
          total_points: Number(lb.total_points ?? 0) + pointsBack,
          weekly_points: Number(lb.weekly_points ?? 0) + weeklyDelta,
          predictions_won: wins,
          predictions_lost: losses,
          accuracy_pct: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : null,
          streak_current: streak,
          streak_best: Math.max(Number(lb.streak_best ?? 0), streak),
          xp_total: Number(lb.xp_total ?? 0) + (won ? 25 : 5),
        }).eq("id", lb.id);
      }
    }
    sessions.add(p.session_id);
    tenants.add(tenant);
    settled++;
  }
  return { settled, sessions, tenants };
}

/** Recompute all-time ranks. Under credit_access, rank by accuracy then wins; else by points. */
export async function recomputeRanks(admin: any, tenant: string, policy: RewardPolicy = currentPolicy()) {
  const { data: board } = await admin
    .from("paper_leaderboard")
    .select("id, total_points, accuracy_pct, predictions_won")
    .eq("tenant_id", tenant);
  const rows = [...(board ?? [])].sort((a: any, b: any) =>
    policy === "credit_access"
      ? (Number(b.accuracy_pct ?? 0) - Number(a.accuracy_pct ?? 0)) ||
        (Number(b.predictions_won ?? 0) - Number(a.predictions_won ?? 0))
      : Number(b.total_points ?? 0) - Number(a.total_points ?? 0)
  );
  let rank = 0;
  for (const row of rows) {
    rank++;
    await admin.from("paper_leaderboard").update({ all_time_rank: rank }).eq("id", row.id);
  }
}
