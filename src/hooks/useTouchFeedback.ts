import { useCallback } from 'react';
import { haptics } from '@/utils/haptics';

/**
 * 🎮 Fun Planet Touch Feedback Hook
 * Provides unified touch feedback with haptics for mobile interactions
 */

type FeedbackType = 
  | 'light' 
  | 'medium' 
  | 'strong' 
  | 'success' 
  | 'error' 
  | 'selection' 
  | 'gameAction' 
  | 'achievement' 
  | 'reward' 
  | 'notification'
  | 'impact'
  | 'ripple'
  | 'burst';

interface UseTouchFeedbackOptions {
  /**
   * Type of haptic feedback
   */
  type?: FeedbackType;
  /**
   * Whether haptic feedback is enabled
   */
  enabled?: boolean;
}

export const useTouchFeedback = (options: UseTouchFeedbackOptions = {}) => {
  const { type = 'light', enabled = true } = options;

  /**
   * Trigger haptic feedback
   */
  const triggerFeedback = useCallback((feedbackType?: FeedbackType) => {
    if (!enabled) return;
    
    const actualType = feedbackType || type;
    
    switch (actualType) {
      case 'light':
        haptics.light();
        break;
      case 'medium':
        haptics.medium();
        break;
      case 'strong':
        haptics.strong();
        break;
      case 'success':
        haptics.success();
        break;
      case 'error':
        haptics.error();
        break;
      case 'selection':
        haptics.selection();
        break;
      case 'gameAction':
        haptics.gameAction();
        break;
      case 'achievement':
        haptics.achievement();
        break;
      case 'reward':
        haptics.reward();
        break;
      case 'notification':
        haptics.notification();
        break;
      case 'impact':
        haptics.impact();
        break;
      case 'ripple':
        haptics.ripple();
        break;
      case 'burst':
        haptics.burst();
        break;
      default:
        haptics.light();
    }
  }, [enabled, type]);

  /**
   * Create an onClick handler with haptic feedback
   */
  const withFeedback = useCallback(<T extends (...args: any[]) => any>(
    handler: T,
    feedbackType?: FeedbackType
  ): ((...args: Parameters<T>) => ReturnType<T>) => {
    return (...args: Parameters<T>) => {
      triggerFeedback(feedbackType);
      return handler(...args);
    };
  }, [triggerFeedback]);

  /**
   * Touch event handlers for ripple effect elements
   */
  const touchHandlers = {
    onTouchStart: () => triggerFeedback(),
  };

  return {
    triggerFeedback,
    withFeedback,
    touchHandlers,
    isSupported: haptics.isSupported(),
  };
};

export default useTouchFeedback;
