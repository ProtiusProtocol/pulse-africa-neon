import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Market {
  id: string;
  title: string;
  deadline: string;
  category: string;
  status: string;
  yes_total: number | null;
  no_total: number | null;
  outcome_ref: string;
}

interface Trade {
  wallet_address: string;
  market_id: string;
  side: string;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Fetch active markets with deadlines within 3 days
    const { data: markets, error: marketsError } = await supabase
      .from("markets")
      .select("id, title, deadline, category, status, yes_total, no_total, outcome_ref")
      .eq("status", "active")
      .not("deadline", "is", null)
      .lte("deadline", threeDaysFromNow.toISOString())
      .gt("deadline", now.toISOString())
      .order("deadline", { ascending: true });

    if (marketsError) {
      throw new Error(`Failed to fetch markets: ${marketsError.message}`);
    }

    if (!markets || markets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No markets approaching deadline", emailsSent: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Categorize markets by urgency
    const urgentMarkets: Market[] = []; // < 1 day
    const approachingMarkets: Market[] = []; // 1-3 days

    for (const market of markets) {
      const deadline = new Date(market.deadline);
      if (deadline <= oneDayFromNow) {
        urgentMarkets.push(market);
      } else {
        approachingMarkets.push(market);
      }
    }

    const allAlertMarkets = [...urgentMarkets, ...approachingMarkets];
    const marketIds = allAlertMarkets.map(m => m.id);

    if (marketIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No markets need alerts", emailsSent: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch all trades for these markets (excluding SEED_DATA)
    const { data: trades, error: tradesError } = await supabase
      .from("user_trades")
      .select("wallet_address, market_id, side, amount")
      .in("market_id", marketIds)
      .neq("wallet_address", "SEED_DATA");

    if (tradesError) {
      throw new Error(`Failed to fetch trades: ${tradesError.message}`);
    }

    if (!trades || trades.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No traders with positions in expiring markets", emailsSent: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Group trades by wallet address
    const traderMarkets: Record<string, { markets: Market[]; trades: Trade[] }> = {};
    
    for (const trade of trades) {
      const wallet = trade.wallet_address;
      if (!traderMarkets[wallet]) {
        traderMarkets[wallet] = { markets: [], trades: [] };
      }
      traderMarkets[wallet].trades.push(trade);
      
      const market = allAlertMarkets.find(m => m.id === trade.market_id);
      if (market && !traderMarkets[wallet].markets.find(m => m.id === market.id)) {
        traderMarkets[wallet].markets.push(market);
      }
    }

    // Try to find email addresses for wallets
    // Check early_access_signups and email_subscribers for associated emails
    const { data: earlyAccess } = await supabase
      .from("early_access_signups")
      .select("email, whatsapp");

    const { data: subscribers } = await supabase
      .from("email_subscribers")
      .select("email")
      .eq("is_active", true);

    // For now, we'll send alerts to all active subscribers who have positions
    // In production, you'd map wallet addresses to user accounts
    
    let emailsSent = 0;

    // Format market row for email
    const formatMarketRow = (market: Market, trade: Trade | undefined, isUrgent: boolean) => {
      const deadline = new Date(market.deadline);
      const hoursLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
      const daysLeft = Math.floor(hoursLeft / 24);
      const timeLeft = daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`;
      
      const yesTotal = market.yes_total || 0;
      const noTotal = market.no_total || 0;
      const total = yesTotal + noTotal;
      const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
      
      const urgencyBadge = isUrgent 
        ? '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">URGENT</span>'
        : '<span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">3 Days Left</span>';

      const positionInfo = trade 
        ? `<br><span style="color:#22c55e;font-size:12px;">Your position: ${trade.side.toUpperCase()} - ${(trade.amount / 1000000).toFixed(2)} ALGO</span>`
        : '';

      return `
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:12px;vertical-align:top;">
            ${urgencyBadge}<br>
            <strong style="color:#fff;font-size:14px;">${market.title}</strong>
            ${positionInfo}
          </td>
          <td style="padding:12px;text-align:center;color:#888;font-size:13px;">
            ${market.category}
          </td>
          <td style="padding:12px;text-align:center;">
            <span style="color:${isUrgent ? '#ef4444' : '#f59e0b'};font-weight:bold;">${timeLeft}</span>
          </td>
          <td style="padding:12px;text-align:center;">
            <span style="color:#22c55e;">${yesPercent}%</span> / <span style="color:#ef4444;">${100 - yesPercent}%</span>
          </td>
        </tr>
      `;
    };

    // For each wallet with trades, try to send an email
    // Since we don't have a direct wallet-to-email mapping, we'll notify all subscribers
    // about markets that are expiring (generic alert approach)
    
    if (subscribers && subscribers.length > 0) {
      const allMarketsHtml = allAlertMarkets.map(m => {
        const isUrgent = urgentMarkets.some(um => um.id === m.id);
        return formatMarketRow(m, undefined, isUrgent);
      }).join("");

      for (const subscriber of subscribers) {
        try {
          const urgentCount = urgentMarkets.length;
          const approachingCount = approachingMarkets.length;
          
          let subject = "";
          if (urgentCount > 0) {
            subject = `🚨 ${urgentCount} market(s) expiring within 24h - Check your positions!`;
          } else {
            subject = `📅 ${approachingCount} market(s) expiring within 3 days`;
          }

          await resend.emails.send({
            from: "Augurion Alerts <alerts@augurion.africa>",
            to: [subscriber.email],
            subject,
            html: `
              <div style="background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:32px;max-width:700px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:24px;">
                  <h1 style="color:${urgentCount > 0 ? '#ef4444' : '#f59e0b'};margin:0;font-size:24px;">
                    ${urgentCount > 0 ? '⚠️ Market Resolution Alert' : '📅 Upcoming Market Deadlines'}
                  </h1>
                  <p style="color:#888;margin:8px 0 0;">Markets you may have positions in are approaching resolution</p>
                </div>
                
                <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#1a1a1a;">
                      <th style="padding:12px;text-align:left;color:#888;font-weight:500;">Market</th>
                      <th style="padding:12px;text-align:center;color:#888;font-weight:500;">Category</th>
                      <th style="padding:12px;text-align:center;color:#888;font-weight:500;">Time Left</th>
                      <th style="padding:12px;text-align:center;color:#888;font-weight:500;">Odds</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allMarketsHtml}
                  </tbody>
                </table>
                
                <div style="margin-top:24px;text-align:center;">
                  <a href="https://pulse-africa-neon.lovable.app/dashboard" 
                     style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:12px;">
                    View Your Dashboard
                  </a>
                  <a href="https://pulse-africa-neon.lovable.app/markets" 
                     style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    Browse Markets
                  </a>
                </div>
                
                <p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">
                  This is an automated alert from Augurion Africa. Markets will resolve at their deadline and payouts will be processed automatically.
                </p>
                
                <p style="color:#444;font-size:11px;text-align:center;margin-top:16px;">
                  <a href="https://pulse-africa-neon.lovable.app/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color:#666;">Unsubscribe from alerts</a>
                </p>
              </div>
            `,
          });
          emailsSent++;
          console.log(`Sent trader deadline alert to ${subscriber.email}`);
        } catch (emailError) {
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Trader deadline alerts sent`,
        emailsSent,
        urgentMarkets: urgentMarkets.length,
        approachingMarkets: approachingMarkets.length,
        tradersWithPositions: Object.keys(traderMarkets).length,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in trader-deadline-alerts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
