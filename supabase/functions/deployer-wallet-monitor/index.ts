// Deployer-wallet balance monitor.
// Runs from pg_cron every 6 hours. Emails admins (admin_email_allowlist)
// when the Algorand deployer wallet drops below DEPLOYER_LOW_BALANCE_ALGO (default 5).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import algosdk from "https://esm.sh/algosdk@2.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THRESHOLD_ALGO = Number(Deno.env.get("DEPLOYER_LOW_BALANCE_ALGO") ?? "5");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const mnemonic = Deno.env.get("ALGORAND_DEPLOYER_MNEMONIC");
    if (!mnemonic) {
      return json({ error: "ALGORAND_DEPLOYER_MNEMONIC not set" }, 500);
    }
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const address = account.addr;

    const algod = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
    const info = await algod.accountInformation(address).do();
    const balanceAlgo = Number(info.amount) / 1_000_000;

    const lowBalance = balanceAlgo < THRESHOLD_ALGO;
    console.log(
      `[wallet-monitor] address=${address} balance=${balanceAlgo} threshold=${THRESHOLD_ALGO} low=${lowBalance}`
    );

    if (!lowBalance) {
      return json({ ok: true, balanceAlgo, threshold: THRESHOLD_ALGO, alerted: false });
    }

    // Fetch admin emails
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: admins, error } = await supabase
      .from("admin_email_allowlist")
      .select("email");
    if (error) throw error;

    const recipients = (admins ?? []).map((r: { email: string }) => r.email).filter(Boolean);
    if (recipients.length === 0) {
      return json({ ok: true, balanceAlgo, alerted: false, reason: "no admin emails" });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({ ok: false, error: "RESEND_API_KEY missing", balanceAlgo }, 500);
    }

    const subject = `⚠️ Augurion deployer wallet low: ${balanceAlgo.toFixed(4)} ALGO`;
    const html = `
      <h2>Deployer wallet balance is low</h2>
      <p>The Algorand deployer wallet used to auto-deploy markets has dropped below the alert threshold.</p>
      <ul>
        <li><strong>Address:</strong> <code>${address}</code></li>
        <li><strong>Balance:</strong> ${balanceAlgo.toFixed(4)} ALGO</li>
        <li><strong>Threshold:</strong> ${THRESHOLD_ALGO} ALGO</li>
        <li><strong>Network:</strong> testnet</li>
      </ul>
      <p>Fund the wallet via the <a href="https://lora.algokit.io/testnet/account/${address}">Lora explorer</a>
      or the official <a href="https://bank.testnet.algorand.network/">TestNet dispenser</a> before new
      market deployments start failing (~0.6 ALGO is consumed per deploy).</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Augurion Alerts <alerts@augurionpulse.com>",
        to: recipients,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[wallet-monitor] resend error", res.status, text);
      return json({ ok: false, error: text, balanceAlgo }, 500);
    }

    return json({ ok: true, balanceAlgo, alerted: true, recipients: recipients.length });
  } catch (e) {
    console.error("[wallet-monitor] error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
