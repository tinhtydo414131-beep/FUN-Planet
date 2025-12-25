import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Settings, 
  Save,
  AlertTriangle,
  Shield,
  Coins
} from "lucide-react";

export function AdminSettingsTab() {
  const [settings, setSettings] = useState({
    dailyClaimLimit: 5000000,
    approvalThreshold: 100000,
    maxDailyDistribution: 50000000,
    enableAutoFraudScan: true,
    requireApprovalForLargeClaims: true,
    blockNewUsersFromClaiming: false,
    minAccountAgeForClaim: 1
  });

  const handleSave = async () => {
    try {
      // In a real app, you would save these to a settings table
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Claim Limit per User (CAMLY)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={settings.dailyClaimLimit}
                onChange={(e) => setSettings(s => ({ ...s, dailyClaimLimit: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum CAMLY a user can claim per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalThreshold">Approval Threshold (CAMLY)</Label>
              <Input
                id="approvalThreshold"
                type="number"
                value={settings.approvalThreshold}
                onChange={(e) => setSettings(s => ({ ...s, approvalThreshold: Number(e.target.value) }))}
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
                value={settings.maxDailyDistribution}
                onChange={(e) => setSettings(s => ({ ...s, maxDailyDistribution: Number(e.target.value) }))}
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
                value={settings.minAccountAgeForClaim}
                onChange={(e) => setSettings(s => ({ ...s, minAccountAgeForClaim: Number(e.target.value) }))}
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
              checked={settings.enableAutoFraudScan}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, enableAutoFraudScan: checked }))}
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
              checked={settings.requireApprovalForLargeClaims}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, requireApprovalForLargeClaims: checked }))}
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
              checked={settings.blockNewUsersFromClaiming}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, blockNewUsersFromClaiming: checked }))}
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
              <p className="font-medium">Pause All Claims</p>
              <p className="text-sm text-muted-foreground">
                Temporarily disable all CAMLY claims globally
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Pause Claims
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
            <div>
              <p className="font-medium">Reset All Pending Rewards</p>
              <p className="text-sm text-muted-foreground">
                Clear all pending rewards (cannot be undone)
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Reset Pending
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
