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

interface AlertRecipient {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  alert_types: string[];
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

    // Fetch active alert recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("alert_recipients")
      .select("*")
      .eq("is_active", true);

    if (recipientsError) {
      throw new Error(`Failed to fetch recipients: ${recipientsError.message}`);
    }

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active alert recipients", emailsSent: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter recipients by alert type preference
    const urgentRecipients = recipients.filter((r: AlertRecipient) => 
      r.alert_types.includes("deadline_1day")
    );
    const approachingRecipients = recipients.filter((r: AlertRecipient) => 
      r.alert_types.includes("deadline_3day")
    );

    let emailsSent = 0;

    // Helper to format market for email
    const formatMarketRow = (market: Market, isUrgent: boolean) => {
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
        : '<span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">Approaching</span>';

      return `
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:12px;vertical-align:top;">
            ${urgencyBadge}<br>
            <strong style="color:#fff;font-size:14px;">${market.title}</strong><br>
            <span style="color:#888;font-size:12px;">ID: ${market.outcome_ref}</span>
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

    // Send urgent alerts (1 day)
    if (urgentMarkets.length > 0 && urgentRecipients.length > 0) {
      const marketRows = urgentMarkets.map(m => formatMarketRow(m, true)).join("");
      
      for (const recipient of urgentRecipients) {
        try {
          await resend.emails.send({
            from: "Augurion Alerts <alerts@augurion.africa>",
            to: [recipient.email],
            subject: `🚨 URGENT: ${urgentMarkets.length} market(s) expiring within 24 hours`,
            html: `
              <div style="background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:32px;max-width:700px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:24px;">
                  <h1 style="color:#ef4444;margin:0;font-size:24px;">⚠️ Deadline Alert</h1>
                  <p style="color:#888;margin:8px 0 0;">Markets requiring immediate resolution action</p>
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
                    ${marketRows}
                  </tbody>
                </table>
                
                <div style="margin-top:24px;text-align:center;">
                  <a href="https://pulse-africa-neon.lovable.app/admin" 
                     style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    Open Admin Dashboard
                  </a>
                </div>
                
                <p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">
                  This is an automated alert from Augurion Africa. Markets must be resolved in Lora before their deadline.
                </p>
              </div>
            `,
          });
          emailsSent++;
          console.log(`Sent urgent alert to ${recipient.email}`);
        } catch (emailError) {
          console.error(`Failed to send to ${recipient.email}:`, emailError);
        }
      }
    }

    // Send approaching alerts (3 days) - but only for non-urgent markets
    if (approachingMarkets.length > 0 && approachingRecipients.length > 0) {
      const marketRows = approachingMarkets.map(m => formatMarketRow(m, false)).join("");
      
      for (const recipient of approachingRecipients) {
        try {
          await resend.emails.send({
            from: "Augurion Alerts <alerts@augurion.africa>",
            to: [recipient.email],
            subject: `📅 ${approachingMarkets.length} market(s) expiring within 3 days`,
            html: `
              <div style="background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:32px;max-width:700px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:24px;">
                  <h1 style="color:#f59e0b;margin:0;font-size:24px;">📅 Upcoming Deadlines</h1>
                  <p style="color:#888;margin:8px 0 0;">Markets approaching resolution deadline</p>
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
                    ${marketRows}
                  </tbody>
                </table>
                
                <div style="margin-top:24px;text-align:center;">
                  <a href="https://pulse-africa-neon.lovable.app/admin" 
                     style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                    Open Admin Dashboard
                  </a>
                </div>
                
                <p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">
                  This is an automated alert from Augurion Africa.
                </p>
              </div>
            `,
          });
          emailsSent++;
          console.log(`Sent approaching alert to ${recipient.email}`);
        } catch (emailError) {
          console.error(`Failed to send to ${recipient.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deadline alerts sent`,
        emailsSent,
        urgentMarkets: urgentMarkets.length,
        approachingMarkets: approachingMarkets.length,
        recipients: recipients.length,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in deadline-alerts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
