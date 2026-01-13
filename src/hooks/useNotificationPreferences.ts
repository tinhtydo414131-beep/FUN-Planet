import { useState, useEffect } from "react";

export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type NotificationTheme = 'sunset' | 'ocean' | 'forest' | 'galaxy' | 'candy' | 'golden';
export type NotificationSound = 'rich-reward' | 'coin-bling' | 'magic-sparkle' | 'level-up' | 'success-chime' | 'custom';

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  volume: number;
  confettiEnabled: boolean;
  animationsEnabled: boolean;
  position: NotificationPosition;
  duration: number; // in seconds
  theme: NotificationTheme;
  selectedSound: NotificationSound;
  customSoundUrl: string;
}

export const NOTIFICATION_THEMES: Record<NotificationTheme, { name: string; gradient: string; icon: string }> = {
  sunset: { name: 'Hoàng hôn', gradient: 'from-yellow-400 via-orange-400 to-red-400', icon: '🌅' },
  ocean: { name: 'Đại dương', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', icon: '🌊' },
  forest: { name: 'Rừng xanh', gradient: 'from-green-400 via-emerald-500 to-teal-500', icon: '🌲' },
  galaxy: { name: 'Ngân hà', gradient: 'from-purple-500 via-pink-500 to-rose-500', icon: '🌌' },
  candy: { name: 'Kẹo ngọt', gradient: 'from-pink-400 via-fuchsia-400 to-purple-400', icon: '🍬' },
  golden: { name: 'Vàng kim', gradient: 'from-amber-400 via-yellow-500 to-orange-400', icon: '✨' },
};

export const NOTIFICATION_SOUNDS: Record<NotificationSound, { name: string; nameEn: string; url: string; icon: string }> = {
  'rich-reward': { 
    name: 'Phần thưởng lớn', 
    nameEn: 'Rich Reward',
    url: '/audio/rich-reward.mp3', 
    icon: '💰' 
  },
  'coin-bling': { 
    name: 'Tiếng xu', 
    nameEn: 'Coin Bling',
    url: 'https://pub-cb953c014b4d44f980fbe6e051a12745.r2.dev/audio/coin-reward.mp3', 
    icon: '🪙' 
  },
  'magic-sparkle': { 
    name: 'Phép thuật', 
    nameEn: 'Magic Sparkle',
    url: 'https://pub-cb953c014b4d44f980fbe6e051a12745.r2.dev/audio/magic-sparkle.mp3', 
    icon: '✨' 
  },
  'level-up': { 
    name: 'Lên cấp', 
    nameEn: 'Level Up',
    url: 'https://pub-cb953c014b4d44f980fbe6e051a12745.r2.dev/audio/level-up.mp3', 
    icon: '🚀' 
  },
  'success-chime': { 
    name: 'Thành công', 
    nameEn: 'Success Chime',
    url: 'https://pub-cb953c014b4d44f980fbe6e051a12745.r2.dev/audio/success-chime.mp3', 
    icon: '🔔' 
  },
  'custom': { 
    name: 'Tùy chỉnh', 
    nameEn: 'Custom',
    url: '', 
    icon: '🎶' 
  },
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  volume: 50,
  confettiEnabled: true,
  animationsEnabled: true,
  position: 'top-right',
  duration: 5,
  theme: 'sunset',
  selectedSound: 'rich-reward',
  customSoundUrl: '',
};

const STORAGE_KEY = "coin_notification_preferences";

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  // Play the selected notification sound
  const playNotificationSound = () => {
    if (!preferences.soundEnabled) return;

    const soundConfig = NOTIFICATION_SOUNDS[preferences.selectedSound];
    
    if (preferences.selectedSound === 'custom' && preferences.customSoundUrl) {
      const audio = new Audio(preferences.customSoundUrl);
      audio.volume = preferences.volume / 100;
      audio.play().catch(console.error);
    } else if (soundConfig.url) {
      const audio = new Audio(soundConfig.url);
      audio.volume = preferences.volume / 100;
      audio.play().catch(console.error);
    }
  };

  // Preview a sound without changing preferences
  const previewSound = (soundKey: NotificationSound, customUrl?: string) => {
    if (soundKey === 'custom' && customUrl) {
      const audio = new Audio(customUrl);
      audio.volume = preferences.volume / 100;
      audio.play().catch(console.error);
    } else {
      const soundConfig = NOTIFICATION_SOUNDS[soundKey];
      if (soundConfig.url) {
        const audio = new Audio(soundConfig.url);
        audio.volume = preferences.volume / 100;
        audio.play().catch(console.error);
      }
    }
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    playNotificationSound,
    previewSound,
  };
}
