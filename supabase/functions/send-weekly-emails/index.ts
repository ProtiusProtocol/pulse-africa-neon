import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailsRequest {
  week_id?: string;
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

    // Parse body safely - handle empty body
    let week_id: string | undefined;
    let report_type: "trader_pulse" | "executive_brief" | "both" = "both";
    
    try {
      const body = await req.text();
      if (body && body.trim()) {
        const parsed = JSON.parse(body) as SendEmailsRequest;
        week_id = parsed.week_id;
        report_type = parsed.report_type || "both";
      }
    } catch {
      // Empty or invalid body, will auto-detect week
    }

    // If no week_id provided, find the latest published report's week
    if (!week_id) {
      console.log("No week_id provided, finding latest published week...");
      const { data: latestReport, error: latestError } = await supabase
        .from("weekly_reports")
        .select("week_id")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error("Error finding latest report:", latestError);
        throw latestError;
      }

      if (!latestReport) {
        return new Response(
          JSON.stringify({ success: false, message: "No published reports found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      week_id = latestReport.week_id;
      console.log(`Auto-detected week_id: ${week_id}`);
    }

    console.log(`Sending weekly emails for ${week_id}, type: ${report_type}`);

    // Fetch active email subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("email_subscribers")
      .select("email, name, subscribed_to")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      throw subError;
    }

    // Fetch early access signups
    const { data: earlyAccessSignups, error: eaError } = await supabase
      .from("early_access_signups")
      .select("email, name");

    if (eaError) {
      console.error("Error fetching early access signups:", eaError);
      throw eaError;
    }

    // Fetch authenticated users from auth.users
    const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      // Don't throw - continue with other sources
    }

    const authUsers = authUsersData?.users || [];
    console.log(`Found ${subscribers?.length || 0} email subscribers, ${earlyAccessSignups?.length || 0} early access signups, ${authUsers.length} authenticated users`);

    // Combine and deduplicate by email
    const emailMap = new Map<string, { email: string; name: string | null; subscribed_to: string[]; source: string }>();

    // Add email subscribers first (they have preferences)
    for (const sub of subscribers || []) {
      emailMap.set(sub.email.toLowerCase(), {
        email: sub.email,
        name: sub.name,
        subscribed_to: sub.subscribed_to || ["trader_pulse", "executive_brief"],
        source: "subscriber",
      });
    }

    // Add early access signups (send both reports by default, don't overwrite existing subscribers)
    for (const ea of earlyAccessSignups || []) {
      const emailKey = ea.email.toLowerCase();
      if (!emailMap.has(emailKey)) {
        emailMap.set(emailKey, {
          email: ea.email,
          name: ea.name,
          subscribed_to: ["trader_pulse", "executive_brief"],
          source: "early_access",
        });
      }
    }

    // Add authenticated users (don't overwrite existing entries)
    for (const user of authUsers) {
      if (!user.email) continue;
      const emailKey = user.email.toLowerCase();
      if (!emailMap.has(emailKey)) {
        emailMap.set(emailKey, {
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          subscribed_to: ["trader_pulse", "executive_brief"],
          source: "auth_user",
        });
      }
    }

    const allRecipients = Array.from(emailMap.values());
    console.log(`Total unique recipients: ${allRecipients.length}`);

    if (allRecipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No recipients found", emailsSent: 0 }),
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
        JSON.stringify({ success: false, message: "No published reports found for this week", emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch week dates
    const { data: digest } = await supabase
      .from("weekly_digest")
      .select("week_start, week_end")
      .eq("week_id", week_id)
      .maybeSingle();

    const weekRange = digest 
      ? `${new Date(digest.week_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(digest.week_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : week_id;

    let sentCount = 0;
    const errors: string[] = [];

    // Send emails to each recipient
    for (const recipient of allRecipients) {
      const recipientReports = reports.filter(r => 
        recipient.subscribed_to.includes(r.report_type)
      );

      if (recipientReports.length === 0) continue;

      const reportLinks = recipientReports.map(r => {
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
            .cta-secondary { display: inline-block; background: transparent; color: #f59e0b; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin: 8px 8px 8px 0; border: 1px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 Weekly Intelligence Report</h1>
            <span class="week-badge">${weekRange}</span>
            
            <p>Hi${recipient.name ? ` ${recipient.name}` : ""},</p>
            
            <p>Your weekly intelligence reports are ready:</p>
            
            <ul>${reportLinks}</ul>
            
            <a href="https://pulse-africa-neon.lovable.app/intelligence" class="cta">View All Reports</a>
            <a href="https://pulse-africa-neon.lovable.app/markets" class="cta-secondary">Trade Now →</a>
            
            <p>These reports provide insights on Southern Africa's political risk landscape. Ready to act on your insights? <strong>Place a trade</strong> on our prediction markets.</p>
            
            <div class="footer">
              <p>You're receiving this because you signed up for Augurion updates.</p>
              <p><a href="https://pulse-africa-neon.lovable.app/unsubscribe?email=${encodeURIComponent(recipient.email)}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const { error: sendError } = await resend.emails.send({
          from: "Augurion <onboarding@resend.dev>",
          to: [recipient.email],
          subject: `📊 Weekly Intelligence Report – ${weekRange}`,
          html: emailHtml,
        });

        if (sendError) {
          console.error(`Error sending to ${recipient.email}:`, sendError);
          errors.push(`${recipient.email}: ${sendError.message}`);
        } else {
          sentCount++;
          console.log(`Sent email to ${recipient.email} (${recipient.source})`);
        }
      } catch (e) {
        console.error(`Exception sending to ${recipient.email}:`, e);
        errors.push(`${recipient.email}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    console.log(`Completed: ${sentCount} emails sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sent ${sentCount} emails`, 
        emailsSent: sentCount,
        weekId: week_id,
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