import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a preview request
    let isPreview = false;
    try {
      const body = await req.json();
      isPreview = body?.preview === true;
    } catch {
      // No body or invalid JSON, continue with normal flow
    }

    console.log(`Starting weekly summary ${isPreview ? "preview" : "generation"}...`);

    // Calculate week range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Get all active users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users to process`);

    const summaries = [];

    for (const profile of profiles || []) {
      try {
        // Count games played in last 7 days
        const { count: gamesPlayed } = await supabase
          .from("user_game_plays")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .gte("played_at", weekStart.toISOString());

        // Get CAMLY earned (from daily_play_rewards)
        const { data: rewards } = await supabase
          .from("daily_play_rewards")
          .select("time_rewards_earned, new_game_rewards_earned")
          .eq("user_id", profile.id)
          .gte("reward_date", weekStartStr);

        const camlyEarned = rewards?.reduce((sum, r) => 
          sum + (r.time_rewards_earned || 0) + (r.new_game_rewards_earned || 0), 0
        ) || 0;

        // Count new achievements unlocked
        const { count: newAchievements } = await supabase
          .from("game_achievements")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .gte("unlocked_at", weekStart.toISOString());

        // Only create summary if user has any activity
        if ((gamesPlayed || 0) > 0 || camlyEarned > 0 || (newAchievements || 0) > 0) {
          // If preview mode, just collect the summary data without sending
          if (isPreview) {
            summaries.push({
              user_id: profile.id,
              username: profile.username,
              games_played: gamesPlayed || 0,
              camly_earned: camlyEarned,
              new_achievements: newAchievements || 0,
            });
            continue;
          }

          // Insert weekly summary log
          const { error: insertError } = await supabase
            .from("weekly_summary_logs")
            .upsert({
              user_id: profile.id,
              week_start: weekStartStr,
              games_played: gamesPlayed || 0,
              camly_earned: camlyEarned,
              new_achievements: newAchievements || 0,
              sent_at: now.toISOString(),
            }, {
              onConflict: "user_id,week_start",
            });

          if (insertError) {
            console.error(`Error inserting summary for ${profile.id}:`, insertError);
            continue;
          }

          // Create in-app notification
          const message = `🎮 Tuần qua bạn đã chơi ${gamesPlayed || 0} game, kiếm được ${camlyEarned.toLocaleString()} CAMLY${(newAchievements || 0) > 0 ? ` và unlock ${newAchievements} achievement mới!` : "!"}`;

          await supabase.from("admin_realtime_notifications").insert({
            notification_type: "weekly_summary",
            title: "📊 Tổng kết tuần của bạn",
            message,
            priority: "normal",
            data: {
              user_id: profile.id,
              games_played: gamesPlayed || 0,
              camly_earned: camlyEarned,
              new_achievements: newAchievements || 0,
              week_start: weekStartStr,
            },
          });

          // Also send to user's personal notifications
          await supabase.from("user_notifications").insert({
            user_id: profile.id,
            notification_type: "weekly_summary",
            title: "📊 Tổng kết tuần của bạn",
            message,
            data: {
              games_played: gamesPlayed || 0,
              camly_earned: camlyEarned,
              new_achievements: newAchievements || 0,
              week_start: weekStartStr,
            },
            is_read: false,
          });

          summaries.push({
            user_id: profile.id,
            username: profile.username,
            games_played: gamesPlayed || 0,
            camly_earned: camlyEarned,
            new_achievements: newAchievements || 0,
          });
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
      }
    }

    console.log(`Generated ${summaries.length} weekly summaries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${summaries.length} weekly summaries`,
        summaries,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-weekly-summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
