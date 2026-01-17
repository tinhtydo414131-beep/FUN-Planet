import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { toast } from "sonner";
import { 
  Save,
  AlertTriangle,
  Shield,
  Coins,
  Loader2,
  Play,
  Pause,
  Wallet
} from "lucide-react";

const AdminSettingsTab = forwardRef<HTMLDivElement>((_, ref) => {
  const { 
    settings, 
    setSettings, 
    loading, 
    saving, 
    saveSettings,
    pauseClaims,
    resumeClaims 
  } = useAdminSettings();

  const handleSave = async () => {
    await saveSettings(settings);
  };

  const updateRewardSetting = (key: keyof typeof settings.rewardSettings, value: number) => {
    setSettings({
      ...settings,
      rewardSettings: { ...settings.rewardSettings, [key]: value }
    });
  };

  const updateSecuritySetting = (key: keyof typeof settings.securitySettings, value: boolean) => {
    setSettings({
      ...settings,
      securitySettings: { ...settings.securitySettings, [key]: value }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      {/* Reward Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Reward Settings
          </CardTitle>
          <CardDescription>
            Configure daily limits and thresholds for CAMLY rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Daily Limit Display */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Giới hạn rút tiền hiện tại:
                </span>
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-base sm:text-lg px-3 py-1 w-fit">
                {settings.rewardSettings.dailyClaimLimit.toLocaleString()} CAMLY/ngày
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Claim Limit per User (CAMLY)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={settings.rewardSettings.dailyClaimLimit}
                onChange={(e) => updateRewardSetting('dailyClaimLimit', Number(e.target.value))}
                className="w-full"
              />
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                {[100000, 200000, 250000, 500000, 1000000].map(preset => (
                  <Button
                    key={preset}
                    variant={settings.rewardSettings.dailyClaimLimit === preset ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2 py-1 h-7"
                    onClick={() => {
                      updateRewardSetting('dailyClaimLimit', preset);
                      toast.info(`Đã chọn ${preset.toLocaleString()} CAMLY - Nhớ bấm Save!`);
                    }}
                  >
                    {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum CAMLY a user can claim per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalThreshold">Approval Threshold (CAMLY)</Label>
              <Input
                id="approvalThreshold"
                type="number"
                value={settings.rewardSettings.approvalThreshold}
                onChange={(e) => updateRewardSetting('approvalThreshold', Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Claims above this amount require manual approval
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDaily">Max Daily Distribution (CAMLY)</Label>
              <Input
                id="maxDaily"
                type="number"
                value={settings.rewardSettings.maxDailyDistribution}
                onChange={(e) => updateRewardSetting('maxDailyDistribution', Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Total CAMLY that can be distributed in one day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAge">Min Account Age for Claim (days)</Label>
              <Input
                id="minAge"
                type="number"
                value={settings.rewardSettings.minAccountAgeForClaim}
                onChange={(e) => updateRewardSetting('minAccountAgeForClaim', Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Minimum account age before user can claim rewards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure fraud detection and security measures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto Fraud Scan</Label>
              <p className="text-xs text-muted-foreground">
                Automatically scan for suspicious activities hourly
              </p>
            </div>
            <Switch
              checked={settings.securitySettings.enableAutoFraudScan}
              onCheckedChange={(checked) => updateSecuritySetting('enableAutoFraudScan', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval for Large Claims</Label>
              <p className="text-xs text-muted-foreground">
                Claims above threshold need admin approval
              </p>
            </div>
            <Switch
              checked={settings.securitySettings.requireApprovalForLargeClaims}
              onCheckedChange={(checked) => updateSecuritySetting('requireApprovalForLargeClaims', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Block New Users from Claiming</Label>
              <p className="text-xs text-muted-foreground">
                Prevent brand new accounts from claiming rewards
              </p>
            </div>
            <Switch
              checked={settings.securitySettings.blockNewUsersFromClaiming}
              onCheckedChange={(checked) => updateSecuritySetting('blockNewUsersFromClaiming', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Critical actions that affect the entire system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
            <div>
              <p className="font-medium">
                {settings.systemSettings.claimsPaused ? 'Claims Paused' : 'Pause All Claims'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.systemSettings.claimsPaused 
                  ? 'Claims are currently paused. Click to resume.'
                  : 'Temporarily disable all CAMLY claims globally'}
              </p>
            </div>
            {settings.systemSettings.claimsPaused ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={resumeClaims}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Resume Claims
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={pauseClaims}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                Pause Claims
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
});

AdminSettingsTab.displayName = "AdminSettingsTab";

export { AdminSettingsTab };
