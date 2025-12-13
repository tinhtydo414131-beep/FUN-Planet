import { motion } from "framer-motion";
import { Bell, Volume2, Sparkles, Wand2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNotificationPreferences, NOTIFICATION_THEMES, NotificationPosition, NotificationTheme } from "@/hooks/useNotificationPreferences";
import { cn } from "@/lib/utils";

export function RewardNotificationSettings() {
  const { preferences, updatePreferences, resetPreferences } = useNotificationPreferences();

  const positionOptions: { id: NotificationPosition; label: string; icon: string }[] = [
    { id: 'top-right', label: 'Trên phải', icon: '↗' },
    { id: 'top-left', label: 'Trên trái', icon: '↖' },
  ];

  return (
    <Card className="w-full max-w-lg mx-auto border-2 border-primary/20 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Thông báo xu
          </span>
          <Bell className="w-6 h-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Thông báo xu
          </span>
          <span>💰</span>
        </CardTitle>
        <CardDescription>
          Tùy chỉnh thông báo khi nhận xu và token
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable Notifications */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">Bật thông báo</p>
              <p className="text-sm text-muted-foreground">Hiển thị thông báo khi nhận xu</p>
            </div>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(enabled) => updatePreferences({ enabled })}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Sound Settings */}
        <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">Âm thanh</p>
                <p className="text-sm text-muted-foreground">Phát nhạc khi nhận xu</p>
              </div>
            </div>
            <Switch
              checked={preferences.soundEnabled}
              onCheckedChange={(soundEnabled) => updatePreferences({ soundEnabled })}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {preferences.soundEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Âm lượng</span>
                <span className="font-semibold text-primary">{preferences.volume}%</span>
              </div>
              <Slider
                value={[preferences.volume]}
                onValueChange={([volume]) => updatePreferences({ volume })}
                max={100}
                step={5}
                className="w-full"
              />
            </motion.div>
          )}
        </div>

        {/* Confetti Effect */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">Hiệu ứng confetti</p>
              <p className="text-sm text-muted-foreground">Hiệu ứng pháo hoa màu sắc</p>
            </div>
          </div>
          <Switch
            checked={preferences.confettiEnabled}
            onCheckedChange={(confettiEnabled) => updatePreferences({ confettiEnabled })}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Animation Effect */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">Hiệu ứng animation</p>
              <p className="text-sm text-muted-foreground">Animation xuất hiện và biến mất</p>
            </div>
          </div>
          <Switch
            checked={preferences.animationsEnabled}
            onCheckedChange={(animationsEnabled) => updatePreferences({ animationsEnabled })}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Position Selection */}
        <div className="space-y-3">
          <div>
            <p className="font-semibold">Vị trí thông báo</p>
            <p className="text-sm text-muted-foreground">Chọn vị trí hiển thị thông báo trên màn hình</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {positionOptions.map((option) => (
              <Button
                key={option.id}
                variant={preferences.position === option.id ? "default" : "outline"}
                onClick={() => updatePreferences({ position: option.id })}
                className={cn(
                  "h-12 font-semibold transition-all",
                  preferences.position === option.id 
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg" 
                    : "hover:border-primary/50"
                )}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <div>
            <p className="font-semibold">Giao diện thông báo</p>
            <p className="text-sm text-muted-foreground">Chọn màu sắc yêu thích</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(NOTIFICATION_THEMES) as [NotificationTheme, typeof NOTIFICATION_THEMES[NotificationTheme]][]).map(([key, theme]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updatePreferences({ theme: key })}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all",
                  `bg-gradient-to-r ${theme.gradient}`,
                  preferences.theme === key 
                    ? "border-foreground ring-2 ring-foreground/20 shadow-lg" 
                    : "border-transparent hover:border-white/50"
                )}
              >
                <div className="text-center">
                  <span className="text-lg">{theme.icon}</span>
                  <p className="text-xs font-semibold text-white mt-1 drop-shadow">{theme.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Duration Slider */}
        <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Thời gian hiển thị</p>
              <p className="text-sm text-muted-foreground">Thông báo hiển thị trong bao lâu</p>
            </div>
            <span className="font-bold text-primary">{preferences.duration}s</span>
          </div>
          <Slider
            value={[preferences.duration]}
            onValueChange={([duration]) => updatePreferences({ duration })}
            min={2}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetPreferences}
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Đặt lại mặc định
        </Button>
      </CardContent>
    </Card>
  );
}
