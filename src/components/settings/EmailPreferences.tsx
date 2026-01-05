import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Calendar, Megaphone, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function EmailPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    email_weekly_summary: true,
    email_marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email_weekly_summary, email_marketing")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_weekly_summary: data.email_weekly_summary ?? true,
          email_marketing: data.email_marketing ?? false,
        });
      }
    } catch (error) {
      console.error("Load email preferences error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: "email_weekly_summary" | "email_marketing", value: boolean) => {
    if (!user) return;
    
    setSaving(key);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("id", user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, [key]: value }));
      toast.success("Đã lưu cài đặt email!");
    } catch (error) {
      console.error("Update email preference error:", error);
      toast.error("Không thể lưu cài đặt");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-4 border-primary/30 shadow-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-primary/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-fredoka text-foreground">
          <Mail className="h-5 w-5 text-primary" />
          Cài đặt Email
        </CardTitle>
        <CardDescription className="font-comic">
          Quản lý các email bạn nhận được từ FunPlanet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Summary */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border-2 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-base font-fredoka text-foreground cursor-pointer">
                Báo cáo tuần
              </Label>
              <p className="text-sm text-muted-foreground font-comic">
                Nhận báo cáo hoạt động hàng tuần qua email
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.email_weekly_summary}
            onCheckedChange={(v) => updatePreference("email_weekly_summary", v)}
            disabled={saving === "email_weekly_summary"}
          />
        </div>
        
        {/* Marketing Emails */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border-2 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Megaphone className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <Label className="text-base font-fredoka text-foreground cursor-pointer">
                Tin tức & Ưu đãi
              </Label>
              <p className="text-sm text-muted-foreground font-comic">
                Nhận thông báo về game mới và ưu đãi đặc biệt
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.email_marketing}
            onCheckedChange={(v) => updatePreference("email_marketing", v)}
            disabled={saving === "email_marketing"}
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
          <p className="text-sm font-comic text-muted-foreground text-center">
            📧 Bạn luôn nhận được các email quan trọng về tài khoản
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
