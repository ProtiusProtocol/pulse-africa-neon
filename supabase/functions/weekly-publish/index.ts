import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { week_id, report_type } = await req.json();
    
    if (!week_id) {
      return new Response(JSON.stringify({ error: "week_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build query
    let query = supabase
      .from("weekly_reports")
      .update({ 
        status: "published",
        published_at: new Date().toISOString()
      })
      .eq("week_id", week_id);
    
    // If report_type specified, only publish that one
    if (report_type) {
      query = query.eq("report_type", report_type);
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Published ${data?.length || 0} report(s) for week ${week_id}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      published: data?.length || 0,
      message: `Published reports for week ${week_id}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in weekly-publish:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
