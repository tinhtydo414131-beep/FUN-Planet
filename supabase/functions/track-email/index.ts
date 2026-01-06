import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
  0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const emailId = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // 'open' or 'click'
    const redirectUrl = url.searchParams.get("redirect");

    console.log(`Email tracking: id=${emailId}, action=${action}, redirect=${redirectUrl}`);

    if (!emailId) {
      console.log("Missing email ID");
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "open") {
      // Track email open
      const { error } = await supabase
        .from("email_analytics")
        .update({
          opened_at: new Date().toISOString(),
          tracking_pixel_loaded: true,
        })
        .eq("email_id", emailId)
        .is("opened_at", null); // Only update if not already opened

      if (error) {
        console.error("Error updating open tracking:", error);
      } else {
        console.log(`Email ${emailId} opened successfully`);
      }

      // Return tracking pixel
      return new Response(TRACKING_PIXEL, {
        headers: { 
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...corsHeaders 
        },
      });

    } else if (action === "click") {
      // Track email click
      const { data: existing, error: fetchError } = await supabase
        .from("email_analytics")
        .select("click_count")
        .eq("email_id", emailId)
        .single();

      if (fetchError) {
        console.error("Error fetching click count:", fetchError);
      } else {
        const newClickCount = (existing?.click_count || 0) + 1;
        const updateData: Record<string, unknown> = {
          click_count: newClickCount,
        };

        // Set clicked_at only on first click
        if (!existing?.click_count || existing.click_count === 0) {
          updateData.clicked_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from("email_analytics")
          .update(updateData)
          .eq("email_id", emailId);

        if (updateError) {
          console.error("Error updating click tracking:", updateError);
        } else {
          console.log(`Email ${emailId} click tracked (count: ${newClickCount})`);
        }
      }

      // Redirect to destination URL
      const destination = redirectUrl || "https://funplanet.vn";
      return Response.redirect(destination, 302);

    } else {
      // Unknown action, just return pixel
      console.log(`Unknown action: ${action}`);
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif", ...corsHeaders },
      });
    }

  } catch (error) {
    console.error("Error in track-email:", error);
    // Always return pixel to prevent email client errors
    return new Response(TRACKING_PIXEL, {
      headers: { "Content-Type": "image/gif", ...corsHeaders },
    });
  }
});
