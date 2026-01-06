import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { render } from "https://esm.sh/@react-email/render@0.0.12";
import React from "https://esm.sh/react@18.3.1";
import { AchievementUnlockedEmail } from "./_templates/achievement-unlocked.tsx";
import { DailyReminderEmail } from "./_templates/daily-reminder.tsx";
import { NewGameAnnouncementEmail } from "./_templates/new-game-announcement.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "achievement" | "daily_reminder" | "announcement";
  userId?: string;
  email?: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { type, userId, email, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to userId=${userId}, email=${email}`);

    // Get recipient email
    let recipientEmail = email;
    let recipientProfile = null;

    if (userId && !email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, email, email_marketing")
        .eq("id", userId)
        .single();

      if (!profile?.email) {
        console.error("User not found or no email:", userId);
        return new Response(
          JSON.stringify({ error: "User email not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check marketing preference for non-transactional emails
      if (type !== "achievement" && profile.email_marketing === false) {
        console.log(`User ${userId} opted out of marketing emails`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "User opted out" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      recipientEmail = profile.email;
      recipientProfile = profile;
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No recipient email provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email ID for tracking
    const emailId = crypto.randomUUID();
    const trackingBaseUrl = `${supabaseUrl}/functions/v1/track-email`;

    let html: string;
    let subject: string;

    switch (type) {
      case "achievement": {
        subject = `🏆 Bạn đã mở khóa: ${data.achievementName}!`;
        html = render(
          React.createElement(AchievementUnlockedEmail, {
            username: recipientProfile?.username || data.username as string || "User",
            achievementName: data.achievementName as string,
            achievementDescription: data.achievementDescription as string,
            achievementIcon: data.achievementIcon as string,
            rewardAmount: data.rewardAmount as number || 0,
            emailId,
            trackingBaseUrl,
          })
        );
        break;
      }

      case "daily_reminder": {
        subject = `⏰ Đừng quên nhận thưởng hàng ngày!`;
        html = render(
          React.createElement(DailyReminderEmail, {
            username: recipientProfile?.username || data.username as string || "User",
            currentStreak: data.currentStreak as number || 0,
            potentialReward: data.potentialReward as number || 100,
            hoursLeft: data.hoursLeft as number || 12,
            emailId,
            trackingBaseUrl,
          })
        );
        break;
      }

      case "announcement": {
        subject = `🎮 Game mới: ${data.gameName} đã ra mắt!`;
        html = render(
          React.createElement(NewGameAnnouncementEmail, {
            username: recipientProfile?.username || data.username as string || "User",
            gameName: data.gameName as string,
            gameDescription: data.gameDescription as string,
            gameImage: data.gameImage as string,
            launchDate: data.launchDate as string,
            bonusReward: data.bonusReward as number || 0,
            emailId,
            trackingBaseUrl,
          })
        );
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown email type" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    // Log to email_analytics before sending
    const { error: analyticsError } = await supabase
      .from("email_analytics")
      .insert({
        email_id: emailId,
        recipient_email: recipientEmail,
        user_id: userId || null,
        email_type: type,
        subject,
        metadata: data,
      });

    if (analyticsError) {
      console.error("Error logging email analytics:", analyticsError);
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "FunPlanet <noreply@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Email ${type} sent successfully to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId,
        recipient: recipientEmail,
        type 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in send-notification-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
