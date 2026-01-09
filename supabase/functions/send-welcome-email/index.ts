import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Augurion <helpdesk@augurionpulse.com>",
      to: [email],
      subject: "Welcome to Augurion Early Access! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; padding: 40px; }
            .logo { color: #c4ff00; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
            h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
            p { color: #aaa; line-height: 1.6; margin-bottom: 16px; }
            .highlight { color: #c4ff00; }
            .ebook-box { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #c4ff00; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
            .ebook-title { color: #fff; font-size: 18px; font-weight: bold; margin-bottom: 12px; }
            .ebook-btn { display: inline-block; background: #c4ff00; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
            .ebook-btn:hover { background: #b3e600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Augurion</div>
            <h1>Welcome aboard, ${name}! 🚀</h1>
            <p>You're now on the <span class="highlight">early access list</span> for Augurion Africa.</p>
            
            <div class="ebook-box">
              <div class="ebook-title">🎁 Your Free Gift: Predictive Markets E-Book</div>
              <p style="color: #ccc; margin-bottom: 16px;">Learn how predictive markets work and how to spot opportunities before they move.</p>
              <a href="https://augurionpulse.lovable.app/ebooks/augurion-predictive-markets-ebook.pdf" class="ebook-btn">📖 Download Your E-Book</a>
            </div>
            
            <p>We're building the continent's first outcome intelligence platform — tracking real-world fragilities before markets move.</p>
            <p>What happens next:</p>
            <ul style="color: #aaa; line-height: 2;">
              <li>We'll contact you on WhatsApp when we launch</li>
              <li>Early access members get first dibs on predictions</li>
              <li>You'll help shape the future of outcome intelligence in Africa</li>
            </ul>
            <p>Stay sharp. The future is predictable.</p>
            <div class="footer">
              <p>© 2025 Augurion. Outcome Intelligence Before Markets Move.</p>
              <p>Africa-first. Outcome-first. Regulation-aligned.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
