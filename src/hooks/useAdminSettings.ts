import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface RewardSettings {
  dailyClaimLimit: number;
  approvalThreshold: number;
  maxDailyDistribution: number;
  minAccountAgeForClaim: number;
}

export interface SecuritySettings {
  enableAutoFraudScan: boolean;
  requireApprovalForLargeClaims: boolean;
  blockNewUsersFromClaiming: boolean;
}

export interface SystemSettings {
  claimsPaused: boolean;
}

interface AdminSettings {
  rewardSettings: RewardSettings;
  securitySettings: SecuritySettings;
  systemSettings: SystemSettings;
}

const defaultSettings: AdminSettings = {
  rewardSettings: {
    dailyClaimLimit: 5000000,
    approvalThreshold: 100000,
    maxDailyDistribution: 50000000,
    minAccountAgeForClaim: 1,
  },
  securitySettings: {
    enableAutoFraudScan: true,
    requireApprovalForLargeClaims: true,
    blockNewUsersFromClaiming: false,
  },
  systemSettings: {
    claimsPaused: false,
  },
};

export function useAdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings = { ...defaultSettings };
        
        data.forEach((row) => {
          const value = row.setting_value as Record<string, unknown>;
          if (row.setting_key === 'reward_settings') {
            loadedSettings.rewardSettings = value as unknown as RewardSettings;
          } else if (row.setting_key === 'security_settings') {
            loadedSettings.securitySettings = value as unknown as SecuritySettings;
          } else if (row.setting_key === 'system_settings') {
            loadedSettings.systemSettings = value as unknown as SystemSettings;
          }
        });
        
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings: AdminSettings) => {
    if (!user) return false;

    try {
      setSaving(true);

      // Update reward settings
      const { error: rewardError } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: newSettings.rewardSettings as unknown as Json,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'reward_settings');

      if (rewardError) throw rewardError;

      // Update security settings
      const { error: securityError } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: newSettings.securitySettings as unknown as Json,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'security_settings');

      if (securityError) throw securityError;

      // Update system settings
      const { error: systemError } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: newSettings.systemSettings as unknown as Json,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'system_settings');

      if (systemError) throw systemError;

      // Log the action
      await supabase.from('admin_audit_logs').insert([{
        admin_id: user.id,
        action: 'update_settings',
        details: { 
          changes: newSettings,
          timestamp: new Date().toISOString()
        } as unknown as Json
      }]);

      setSettings(newSettings);
      toast.success('Settings saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving admin settings:', error);
      toast.error('Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const pauseClaims = useCallback(async () => {
    if (!user) return false;

    const newSettings = {
      ...settings,
      systemSettings: { ...settings.systemSettings, claimsPaused: true }
    };
    
    const success = await saveSettings(newSettings);
    if (success) {
      toast.success('All claims have been paused');
    }
    return success;
  }, [user, settings, saveSettings]);

  const resumeClaims = useCallback(async () => {
    if (!user) return false;

    const newSettings = {
      ...settings,
      systemSettings: { ...settings.systemSettings, claimsPaused: false }
    };
    
    const success = await saveSettings(newSettings);
    if (success) {
      toast.success('Claims have been resumed');
    }
    return success;
  }, [user, settings, saveSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    setSettings,
    loading,
    saving,
    saveSettings,
    loadSettings,
    pauseClaims,
    resumeClaims,
  };
}
