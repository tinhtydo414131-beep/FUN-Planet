/**
 * 🎮 Fun Planet Haptic Feedback System
 * Enhanced vibration utility for mobile touch interactions
 */

// Check if haptics are supported
const isHapticsSupported = (): boolean => {
  return 'vibrate' in navigator;
};

// Safely trigger vibration
const vibrate = (pattern: number | number[]): boolean => {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate(pattern);
      return true;
    } catch (e) {
      console.log('Haptics not available');
      return false;
    }
  }
  return false;
};

export const haptics = {
  /**
   * ✨ Light tap - for buttons, toggles, selections
   */
  light: () => vibrate(8),

  /**
   * 👆 Medium tap - for card presses, navigation
   */
  medium: () => vibrate(15),

  /**
   * 💪 Strong tap - for important actions, confirmations
   */
  strong: () => vibrate(40),

  /**
   * 🎉 Success pattern - celebration double tap
   */
  success: () => vibrate([20, 40, 20]),

  /**
   * ❌ Error pattern - strong warning
   */
  error: () => vibrate([80]),

  /**
   * 🔘 Selection - minimal tap for list items
   */
  selection: () => vibrate(5),

  /**
   * 🎮 Game action - quick responsive tap
   */
  gameAction: () => vibrate(12),

  /**
   * 🏆 Achievement unlocked - celebration pattern
   */
  achievement: () => vibrate([30, 60, 30, 60, 50]),

  /**
   * 💰 Reward received - gentle celebration
   */
  reward: () => vibrate([15, 30, 15]),

  /**
   * 📱 Notification - attention grabber
   */
  notification: () => vibrate([20, 50, 20, 50]),

  /**
   * 🎯 Impact - for game collisions, heavy interactions
   */
  impact: () => vibrate(35),

  /**
   * 🌊 Ripple - subtle wave effect
   */
  ripple: () => vibrate([8, 20, 8]),

  /**
   * ⚡ Quick burst - instant feedback
   */
  burst: () => vibrate(6),

  /**
   * 🔄 Long press feedback
   */
  longPress: () => vibrate([10, 30, 50]),

  /**
   * Check if haptics are available
   */
  isSupported: isHapticsSupported,
};
