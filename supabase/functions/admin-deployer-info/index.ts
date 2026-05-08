// Returns the Algorand deployer wallet address + balance. Admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import algosdk from "https://esm.sh/algosdk@2.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub as string;
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const mnemonic = Deno.env.get("ALGORAND_DEPLOYER_MNEMONIC");
    if (!mnemonic) {
      return new Response(JSON.stringify({ error: "ALGORAND_DEPLOYER_MNEMONIC not set" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const address = account.addr;

    // Fetch testnet balance (best-effort)
    let balanceAlgo: number | null = null;
    let network = "testnet";
    try {
      const algod = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const info = await algod.accountInformation(address).do();
      balanceAlgo = Number(info.amount) / 1_000_000;
    } catch (e) {
      console.error("balance fetch failed", e);
    }

    return new Response(
      JSON.stringify({ address, balanceAlgo, network }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
