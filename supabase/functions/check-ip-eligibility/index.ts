import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (Cloudflare, nginx, or direct)
    const clientIP = 
      req.headers.get("cf-connecting-ip") || 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log("[check-ip-eligibility] Checking IP:", clientIP);

    // Create Supabase client with service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check IP eligibility with max 3 accounts per IP
    const { data, error } = await supabase.rpc("check_ip_eligibility", {
      p_ip_address: clientIP,
      p_max_accounts: 3
    });

    if (error) {
      console.error("[check-ip-eligibility] RPC error:", error);
      throw error;
    }

    console.log("[check-ip-eligibility] RPC result:", data);

    const result = data?.[0] || { 
      is_eligible: true, 
      reason: "OK", 
      existing_accounts: 0,
      is_blacklisted: false
    };

    // Log the decision
    console.log("[check-ip-eligibility] Decision for IP", clientIP, ":", {
      is_eligible: result.is_eligible,
      reason: result.reason,
      existing_accounts: result.existing_accounts,
      is_blacklisted: result.is_blacklisted
    });

    return new Response(
      JSON.stringify({
        ip: clientIP,
        is_eligible: result.is_eligible,
        reason: result.reason,
        existing_accounts: result.existing_accounts,
        is_blacklisted: result.is_blacklisted
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error: any) {
    console.error("[check-ip-eligibility] Error:", error);
    
    // On error, allow signup (don't block legitimate users due to system issues)
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        is_eligible: true,
        reason: "Check failed - allowing signup",
        existing_accounts: 0,
        is_blacklisted: false
      }), 
      { 
        status: 200, // Return 200 so frontend doesn't break
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
