import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeRequest {
  email: string;
  subscriptions?: string[]; // Optional: specific subscriptions to remove, or remove all if not provided
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, subscriptions }: UnsubscribeRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing unsubscribe for ${email}`);

    // Find the subscriber
    const { data: subscriber, error: fetchError } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching subscriber:", fetchError);
      throw fetchError;
    }

    if (!subscriber) {
      return new Response(
        JSON.stringify({ error: "Email not found in our subscriber list" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updateData: { is_active?: boolean; unsubscribed_at?: string; subscribed_to?: string[] };

    if (subscriptions && subscriptions.length > 0) {
      // Remove specific subscriptions
      const newSubscriptions = subscriber.subscribed_to.filter(
        (s: string) => !subscriptions.includes(s)
      );
      
      if (newSubscriptions.length === 0) {
        // No subscriptions left, mark as inactive
        updateData = {
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
          subscribed_to: [],
        };
      } else {
        updateData = {
          subscribed_to: newSubscriptions,
        };
      }
    } else {
      // Unsubscribe from all
      updateData = {
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      };
    }

    const { error: updateError } = await supabase
      .from("email_subscribers")
      .update(updateData)
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("Error updating subscriber:", updateError);
      throw updateError;
    }

    console.log(`Successfully unsubscribed ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: subscriptions 
          ? `Unsubscribed from ${subscriptions.join(", ")}` 
          : "Successfully unsubscribed from all emails"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in unsubscribe:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
