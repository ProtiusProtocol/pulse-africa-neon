// Admin-only: resolve a market on-chain (via deployer mnemonic) and pay winners directly.
// Designed for Testnet convenience – pays pro-rata net of 2% fee directly from deployer wallet
// to each winning trader's wallet, then marks DB trades as claimed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import algosdk from "https://esm.sh/algosdk@2.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALGOD = "https://testnet-api.algonode.cloud";

// Contract ABI selector for resolve_market(uint64)->string
const RESOLVE_SELECTOR = new Uint8Array([
  // sha512_256("resolve_market(uint64)string")[0..4] – computed at runtime below
]);

async function methodSelector(sig: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(sig);
  // algosdk has ABIMethod for this
  const m = new algosdk.ABIMethod({
    name: sig.split("(")[0],
    args: [{ type: "uint64", name: "winningSide" }],
    returns: { type: "string" },
  });
  return m.getSelector();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const marketId: string = body.market_id;
    const winningSide: string = (body.winning_side || "").toUpperCase();
    const force: boolean = !!body.force;
    if (!marketId || (winningSide !== "YES" && winningSide !== "NO")) {
      return json({ error: "market_id and winning_side (YES|NO) required" }, 400);
    }

    const mnemonic = Deno.env.get("ALGORAND_DEPLOYER_MNEMONIC");
    if (!mnemonic) return json({ error: "ALGORAND_DEPLOYER_MNEMONIC not set" }, 500);
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const algod = new algosdk.Algodv2("", ALGOD, "");

    // Load market
    const { data: market, error: mErr } = await admin
      .from("markets")
      .select("*")
      .eq("id", marketId)
      .single();
    if (mErr || !market) return json({ error: "Market not found" }, 404);

    // Deadline guard — markets resolve only after deadline unless admin forces it
    if (market.deadline) {
      const deadlineMs = new Date(market.deadline).getTime();
      if (Number.isFinite(deadlineMs) && deadlineMs > Date.now() && !force) {
        return json({
          error: `Market deadline not yet reached (${new Date(deadlineMs).toISOString()}). Pass force=true to override.`,
        }, 400);
      }
    }

    const steps: string[] = [];
    if (force && market.deadline && new Date(market.deadline).getTime() > Date.now()) {
      steps.push(`⚠️ FORCED early resolution by ${userData.user.email || userData.user.id}`);
    }
    let resolveTxId: string | null = null;

    // 1) On-chain resolve_market (if app_id exists and not a demo)
    const appId = Number(market.app_id);
    if (appId && Number.isFinite(appId) && appId > 0) {
      try {
        const sp = await algod.getTransactionParams().do();
        sp.fee = 1000;
        sp.flatFee = true;
        const selector = await methodSelector("resolve_market(uint64)string");
        const appCall = algosdk.makeApplicationCallTxnFromObject({
          appIndex: appId,
          onComplete: algosdk.OnApplicationComplete.NoOpOC,
          sender: account.addr,
          suggestedParams: sp,
          appArgs: [selector, algosdk.encodeUint64(winningSide === "YES" ? 1 : 2)],
        });
        const signed = appCall.signTxn(account.sk);
        const { txid } = await algod.sendRawTransaction(signed).do();
        await algosdk.waitForConfirmation(algod, txid, 4);
        resolveTxId = txid;
        steps.push(`on-chain resolve_market OK (tx ${txid})`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // If already resolved on-chain, continue with payouts
        if (msg.toLowerCase().includes("already") || msg.includes("status")) {
          steps.push(`on-chain resolve skipped: ${msg}`);
        } else {
          steps.push(`on-chain resolve FAILED: ${msg} – continuing with DB + payouts`);
        }
      }
    } else {
      steps.push("no app_id – DB-only resolution (demo market)");
    }

    // 2) Update DB (trigger auto-marks user_trades as claimed/lost)
    const { error: updErr } = await admin
      .from("markets")
      .update({ status: "resolved", resolved_outcome: winningSide })
      .eq("id", marketId);
    if (updErr) return json({ error: `DB update failed: ${updErr.message}`, steps }, 500);
    steps.push(`DB resolved_outcome=${winningSide}, status=resolved`);

    // 3) Compute payouts from DB trades and pay winners directly
    const { data: trades } = await admin
      .from("user_trades")
      .select("*")
      .eq("market_id", marketId);

    const yesPool = (trades || [])
      .filter((t) => t.side?.toLowerCase() === "yes")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const noPool = (trades || [])
      .filter((t) => t.side?.toLowerCase() === "no")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const winningPool = winningSide === "YES" ? yesPool : noPool;
    const losingPool = winningSide === "YES" ? noPool : yesPool;
    const feeBps = Number(market.fee_bps || 200);

    const payouts: Array<{ trade_id: string; wallet: string; amount: number; tx_id?: string; error?: string }> = [];

    if (winningPool > 0) {
      const winners = (trades || []).filter(
        (t) => t.side?.toLowerCase() === winningSide.toLowerCase()
      );
      for (const t of winners) {
        const stake = Number(t.amount);
        // Net payout = stake + share_of_losing_pool * (1 - fee)
        const grossWinnings = (stake / winningPool) * losingPool;
        const netWinnings = grossWinnings * (1 - feeBps / 10000);
        const payoutAlgo = stake + netWinnings;
        // amounts in DB assumed to be ALGO units; convert to microAlgos
        const amountMicro = Math.round(payoutAlgo * 1_000_000);
        if (amountMicro <= 0) continue;
        try {
          const sp = await algod.getTransactionParams().do();
          sp.fee = 1000;
          sp.flatFee = true;
          const pay = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: account.addr,
            receiver: t.wallet_address,
            amount: amountMicro,
            suggestedParams: sp,
            note: new TextEncoder().encode(`Augurion payout ${marketId.slice(0, 8)}`),
          });
          const signed = pay.signTxn(account.sk);
          const { txid } = await algod.sendRawTransaction(signed).do();
          await algosdk.waitForConfirmation(algod, txid, 4);
          // Record on trade row (best-effort)
          await admin
            .from("user_trades")
            .update({ tx_id: txid, status: "claimed" })
            .eq("id", t.id);
          payouts.push({ trade_id: t.id, wallet: t.wallet_address, amount: payoutAlgo, tx_id: txid });
        } catch (e) {
          payouts.push({
            trade_id: t.id,
            wallet: t.wallet_address,
            amount: payoutAlgo,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      steps.push(`paid ${payouts.filter((p) => p.tx_id).length}/${winners.length} winners`);
    } else {
      steps.push("no winning trades to pay");
    }

    return json({ success: true, resolveTxId, steps, payouts }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
