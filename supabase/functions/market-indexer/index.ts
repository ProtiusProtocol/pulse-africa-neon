import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Algorand TestNet node
const ALGOD_URL = "https://testnet-api.algonode.cloud";

/**
 * Fetch global state from an Algorand application
 */
async function fetchAppState(appId: number): Promise<{
  yesTotal: number;
  noTotal: number;
  status: number;
  outcomeRef: string | null;
} | null> {
  try {
    console.log(`Fetching state for app ${appId}...`);
    
    const response = await fetch(`${ALGOD_URL}/v2/applications/${appId}`);
    if (!response.ok) {
      console.log(`App ${appId} not found or error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const globalState = data.params?.["global-state"] || [];

    let yesTotal = 0;
    let noTotal = 0;
    let status = 0;
    let outcomeRef: string | null = null;

    for (const item of globalState) {
      // Decode base64 key to string
      const keyBytes = Uint8Array.from(atob(item.key), (c) => c.charCodeAt(0));
      const key = new TextDecoder().decode(keyBytes);

      switch (key) {
        case "yesTotal":
          yesTotal = item.value.uint || 0;
          break;
        case "noTotal":
          noTotal = item.value.uint || 0;
          break;
        case "status":
          status = item.value.uint || 0;
          break;
        case "outcomeRef":
          // outcomeRef is stored as bytes in the contract
          // The Algorand API returns it as a string in the "bytes" field
          // It's NOT base64 encoded - it's the raw string value
          if (item.value.bytes) {
            outcomeRef = item.value.bytes;
          }
          break;
      }
    }

    console.log(`App ${appId}: yesTotal=${yesTotal}, noTotal=${noTotal}, status=${status}, outcomeRef=${outcomeRef}`);
    return { yesTotal, noTotal, status, outcomeRef };
  } catch (error) {
    console.error(`Error fetching app ${appId}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting market sync from blockchain...");

    // Fetch all active markets from Supabase
    const { data: markets, error: marketsError } = await supabase
      .from("markets")
      .select("id, app_id, title, yes_total, no_total, status")
      .eq("status", "active");

    if (marketsError) {
      throw new Error(`Failed to fetch markets: ${marketsError.message}`);
    }

    console.log(`Found ${markets?.length || 0} active markets`);

    const results: Array<{ id: string; success: boolean; appId: string; error?: string }> = [];

    for (const market of markets || []) {
      // Parse app_id - handle various formats like "market-power-system-01" or numeric IDs
      const appIdStr = market.app_id;
      let appId: number | null = null;

      // Try to parse as number first
      const numericMatch = appIdStr?.match(/^\d+$/);
      if (numericMatch) {
        appId = parseInt(appIdStr, 10);
      }

      // For now, if it's not a numeric app ID, skip (contracts not deployed yet)
      if (!appId || appId === 0) {
        console.log(`Market ${market.id} (${market.title}): No numeric app_id yet, skipping`);
        results.push({
          id: market.id,
          appId: appIdStr,
          success: false,
          error: "Contract not deployed - app_id is placeholder",
        });
        continue;
      }

      // Fetch on-chain state
      const state = await fetchAppState(appId);

      if (state) {
        // Convert microAlgos to ALGO for display (state is in microAlgos)
        // Also sync outcomeRef if available from chain
        // Note: outcome_ref is NOT synced from chain - it's a database-only
        // stable identifier maintained manually for cross-network migration
        const updateData: Record<string, unknown> = {
          yes_total: state.yesTotal,
          no_total: state.noTotal,
          updated_at: new Date().toISOString(),
        };
        
        const { error: updateError } = await supabase
          .from("markets")
          .update(updateData)
          .eq("id", market.id);

        if (updateError) {
          console.error(`Failed to update market ${market.id}:`, updateError);
          results.push({
            id: market.id,
            appId: appIdStr,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`Updated market ${market.id}: yes=${state.yesTotal}, no=${state.noTotal}`);
          results.push({
            id: market.id,
            appId: appIdStr,
            success: true,
          });
        }
      } else {
        results.push({
          id: market.id,
          appId: appIdStr,
          success: false,
          error: "Failed to fetch on-chain state",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`Sync complete: ${successCount}/${results.length} markets updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${successCount}/${results.length} markets`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in market-indexer:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
