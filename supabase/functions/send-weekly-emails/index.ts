import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailsRequest {
  week_id: string;
  report_type?: "trader_pulse" | "executive_brief" | "both";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { week_id, report_type = "both" }: SendEmailsRequest = await req.json();

    console.log(`Sending weekly emails for ${week_id}, type: ${report_type}`);

    // Fetch active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      throw subError;
    }

    console.log(`Found ${subscribers?.length || 0} active subscribers`);

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active subscribers", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch published reports for this week
    const reportTypes = report_type === "both" 
      ? ["trader_pulse", "executive_brief"] 
      : [report_type];

    const { data: reports, error: repError } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("week_id", week_id)
      .eq("status", "published")
      .in("report_type", reportTypes);

    if (repError) {
      console.error("Error fetching reports:", repError);
      throw repError;
    }

    if (!reports || reports.length === 0) {
      return new Response(
        JSON.stringify({ message: "No published reports found for this week", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch week dates
    const { data: digest } = await supabase
      .from("weekly_digest")
      .select("week_start, week_end")
      .eq("week_id", week_id)
      .single();

    const weekRange = digest 
      ? `${new Date(digest.week_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(digest.week_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : week_id;

    let sentCount = 0;
    const errors: string[] = [];

    // Send emails to each subscriber
    for (const subscriber of subscribers) {
      const subscribedReports = reports.filter(r => 
        subscriber.subscribed_to.includes(r.report_type)
      );

      if (subscribedReports.length === 0) continue;

      const reportLinks = subscribedReports.map(r => {
        const path = r.report_type === "trader_pulse" ? "pulse" : "brief";
        return `<li><a href="https://pulse-africa-neon.lovable.app/${path}?week=${week_id}" style="color: #10b981;">${r.report_type === "trader_pulse" ? "Trader Pulse" : "Executive Brief"}</a></li>`;
      }).join("");

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #171717; border-radius: 12px; padding: 32px; border: 1px solid #262626; }
            h1 { color: #10b981; margin-bottom: 8px; }
            .week-badge { display: inline-block; background: #10b981; color: #0a0a0a; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
            p { line-height: 1.6; color: #a3a3a3; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            a { color: #10b981; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #262626; font-size: 12px; color: #737373; }
            .cta { display: inline-block; background: #10b981; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 Weekly Intelligence Report</h1>
            <span class="week-badge">${weekRange}</span>
            
            <p>Hi${subscriber.name ? ` ${subscriber.name}` : ""},</p>
            
            <p>Your weekly intelligence reports are ready:</p>
            
            <ul>${reportLinks}</ul>
            
            <a href="https://pulse-africa-neon.lovable.app/intelligence" class="cta">View All Reports</a>
            
            <p>These reports provide insights on Southern Africa's political risk landscape to help inform your decisions.</p>
            
            <div class="footer">
              <p>You're receiving this because you subscribed to Augurion intelligence updates.</p>
              <p><a href="https://pulse-africa-neon.lovable.app/unsubscribe?email=${encodeURIComponent(subscriber.email)}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const { error: sendError } = await resend.emails.send({
          from: "Augurion <onboarding@resend.dev>",
          to: [subscriber.email],
          subject: `📊 Weekly Intelligence Report – ${weekRange}`,
          html: emailHtml,
        });

        if (sendError) {
          console.error(`Error sending to ${subscriber.email}:`, sendError);
          errors.push(`${subscriber.email}: ${sendError.message}`);
        } else {
          sentCount++;
          console.log(`Sent email to ${subscriber.email}`);
        }
      } catch (e) {
        console.error(`Exception sending to ${subscriber.email}:`, e);
        errors.push(`${subscriber.email}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    console.log(`Completed: ${sentCount} emails sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${sentCount} emails`, 
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-weekly-emails:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});