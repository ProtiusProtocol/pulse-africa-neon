// Deploy AugurionMarketV4 contract to Algorand TestNet using the project's deployer mnemonic.
// Steps:
//   1) Create the application (bare NoOp) using the precompiled approval/clear bytecode.
//   2) Fund the app account with 1 ALGO so it can satisfy the contract MBR for escrow.
//   3) Call configure_market(outcomeRef, expiryRound, feeBps).
//   4) Call open_market().
//   5) Update the markets row in the DB with the new app_id and set status = 'active'.
//
// All transactions are signed by the deployer wallet whose mnemonic is stored in
// the ALGORAND_DEPLOYER_MNEMONIC secret. The deployer becomes the contract admin.

import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import algosdk from "npm:algosdk@2.9.0";
import contractArtifact from "./AugurionMarketV4.arc56.json" with { type: "json" };

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const FUND_APP_MICROALGOS = 1_000_000; // 1 ALGO for contract MBR

interface DeployRequest {
  market_id: string;
}

interface ContractArtifact {
  byteCode: { approval: string; clear: string };
  state: {
    schema: {
      global: { ints: number; bytes: number };
      local: { ints: number; bytes: number };
    };
  };
  methods: Array<{
    name: string;
    args: Array<{ type: string; name: string }>;
    returns: { type: string };
  }>;
}

const artifact = contractArtifact as ContractArtifact;

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function methodSelector(name: string, args: string[], returns: string): Uint8Array {
  // ARC4 method selector: first 4 bytes of sha512/256 of "name(arg1,arg2)return"
  const sig = `${name}(${args.join(",")})${returns}`;
  const hash = algosdk.encodeObj; // placeholder to satisfy TS
  void hash;
  // Use algosdk's ABIMethod for selector
  const m = new algosdk.ABIMethod({
    name,
    args: args.map((t) => ({ type: t, name: "a" })),
    returns: { type: returns },
  });
  return m.getSelector();
}

async function waitForConfirmation(client: algosdk.Algodv2, txId: string) {
  const status = await client.status().do();
  let lastRound = status["last-round"];
  for (let i = 0; i < 10; i++) {
    const pending = await client.pendingTransactionInformation(txId).do();
    if (pending["confirmed-round"] && pending["confirmed-round"] > 0) return pending;
    lastRound++;
    await client.statusAfterBlock(lastRound).do();
  }
  throw new Error(`Transaction ${txId} not confirmed after 10 rounds`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const mnemonic = Deno.env.get("ALGORAND_DEPLOYER_MNEMONIC");
    if (!mnemonic) {
      return new Response(
        JSON.stringify({ error: "ALGORAND_DEPLOYER_MNEMONIC secret not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as DeployRequest;
    if (!body.market_id || typeof body.market_id !== "string") {
      return new Response(JSON.stringify({ error: "market_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: market, error: fetchErr } = await supabase
      .from("markets")
      .select("id, title, outcome_ref, deadline, fee_bps, app_id")
      .eq("id", body.market_id)
      .single();

    if (fetchErr || !market) {
      return new Response(JSON.stringify({ error: "Market not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (market.app_id && market.app_id !== "PENDING" && !isNaN(Number(market.app_id))) {
      return new Response(
        JSON.stringify({ error: `Market already deployed with app_id ${market.app_id}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Set up Algorand client + signer ---
    const algod = new algosdk.Algodv2("", ALGOD_SERVER, "");
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    console.log("Deployer address:", account.addr);

    // Check deployer balance
    const acctInfo = await algod.accountInformation(account.addr).do();
    const balance = Number(acctInfo.amount);
    console.log("Deployer balance (microAlgo):", balance);
    if (balance < 2_500_000) {
      return new Response(
        JSON.stringify({
          error: `Deployer balance too low (${balance / 1e6} ALGO). Need at least 2.5 ALGO.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const approvalProgram = b64ToBytes(artifact.byteCode.approval);
    const clearProgram = b64ToBytes(artifact.byteCode.clear);
    const schema = artifact.state.schema;

    // === 1) Create application ===
    let sp = await algod.getTransactionParams().do();
    const createTxn = algosdk.makeApplicationCreateTxnFromObject({
      from: account.addr,
      suggestedParams: sp,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      numGlobalInts: schema.global.ints,
      numGlobalByteSlices: schema.global.bytes,
      numLocalInts: schema.local.ints,
      numLocalByteSlices: schema.local.bytes,
    });

    const signedCreate = createTxn.signTxn(account.sk);
    const { txId: createTxId } = await algod.sendRawTransaction(signedCreate).do();
    console.log("Create txId:", createTxId);
    const createConfirm = await waitForConfirmation(algod, createTxId);
    const appId = Number(createConfirm["application-index"]);
    if (!appId) throw new Error("Failed to extract application-index from create confirmation");
    console.log("Created app_id:", appId);

    const appAddress = algosdk.getApplicationAddress(appId);
    console.log("App address:", appAddress);

    // === 2) Fund the app account (1 ALGO for MBR) ===
    sp = await algod.getTransactionParams().do();
    const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: appAddress,
      amount: FUND_APP_MICROALGOS,
      suggestedParams: sp,
    });
    const signedFund = fundTxn.signTxn(account.sk);
    const { txId: fundTxId } = await algod.sendRawTransaction(signedFund).do();
    await waitForConfirmation(algod, fundTxId);
    console.log("Funded app account, tx:", fundTxId);

    // === 3) configure_market(outcomeRef, expiryRound, feeBps) ===
    // The "expiryRound" arg is named that in the ABI but in this contract we pass
    // the deadline as a Unix timestamp (per Lora deployment convention used elsewhere).
    const deadlineUnix = market.deadline
      ? Math.floor(new Date(market.deadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // default: 30d from now
    const feeBps = market.fee_bps ?? 200;

    const configureSelector = methodSelector(
      "configure_market",
      ["byte[]", "uint64", "uint64"],
      "string",
    );
    const outcomeRefBytes = new TextEncoder().encode(market.outcome_ref);
    // ABI byte[] is encoded as length-prefixed (uint16 length || bytes) per ARC-4
    const lenPrefix = new Uint8Array(2);
    new DataView(lenPrefix.buffer).setUint16(0, outcomeRefBytes.length, false);
    const outcomeRefArg = new Uint8Array(lenPrefix.length + outcomeRefBytes.length);
    outcomeRefArg.set(lenPrefix, 0);
    outcomeRefArg.set(outcomeRefBytes, lenPrefix.length);

    const u64 = (n: number) => {
      const buf = new Uint8Array(8);
      const dv = new DataView(buf.buffer);
      dv.setBigUint64(0, BigInt(n), false);
      return buf;
    };

    sp = await algod.getTransactionParams().do();
    const configureTxn = algosdk.makeApplicationCallTxnFromObject({
      from: account.addr,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [configureSelector, outcomeRefArg, u64(deadlineUnix), u64(feeBps)],
      suggestedParams: sp,
    });
    const signedConfigure = configureTxn.signTxn(account.sk);
    const { txId: configureTxId } = await algod.sendRawTransaction(signedConfigure).do();
    await waitForConfirmation(algod, configureTxId);
    console.log("Configured market, tx:", configureTxId);

    // === 4) open_market() ===
    const openSelector = methodSelector("open_market", [], "string");
    sp = await algod.getTransactionParams().do();
    const openTxn = algosdk.makeApplicationCallTxnFromObject({
      from: account.addr,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [openSelector],
      suggestedParams: sp,
    });
    const signedOpen = openTxn.signTxn(account.sk);
    const { txId: openTxId } = await algod.sendRawTransaction(signedOpen).do();
    await waitForConfirmation(algod, openTxId);
    console.log("Opened market, tx:", openTxId);

    // === 5) Update DB ===
    const { error: updateErr } = await supabase
      .from("markets")
      .update({
        app_id: String(appId),
        status: "active",
        oracle_address: account.addr,
        fee_bps: feeBps,
      })
      .eq("id", market.id);

    if (updateErr) {
      console.error("DB update error:", updateErr);
      return new Response(
        JSON.stringify({
          warning: "Contract deployed but DB update failed",
          app_id: appId,
          error: updateErr.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        app_id: appId,
        app_address: appAddress,
        deployer_address: account.addr,
        txns: { create: createTxId, fund: fundTxId, configure: configureTxId, open: openTxId },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Deploy error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
