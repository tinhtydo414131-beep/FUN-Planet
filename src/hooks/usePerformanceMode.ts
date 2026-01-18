import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from './use-mobile';

interface PerformanceMode {
  /** Whether to reduce animations (mobile, low-end, or reduced motion preference) */
  shouldReduceAnimations: boolean;
  /** Whether device is mobile */
  isMobile: boolean;
  /** User prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Device has low hardware capabilities */
  isLowEndDevice: boolean;
  /** Animation budget (0-2) based on device capabilities */
  animationBudget: 0 | 1 | 2;
  /** Whether to use blur placeholders for images */
  shouldUseBlurPlaceholder: boolean;
  /** Recommended animation duration multiplier */
  durationMultiplier: number;
  /** Whether device supports backdrop-filter */
  supportsBackdropFilter: boolean;
}

export const usePerformanceMode = (): PerformanceMode => {
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [supportsBackdropFilter, setSupportsBackdropFilter] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Detect low-end devices (rough heuristic based on hardware concurrency)
    const cores = navigator.hardwareConcurrency || 4;
    const isLowEnd = cores < 4;
    setIsLowEndDevice(isLowEnd);

    // Check backdrop-filter support
    const supportsBlur = CSS.supports('backdrop-filter', 'blur(10px)') || 
                         CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
    setSupportsBackdropFilter(supportsBlur);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const performanceMetrics = useMemo(() => {
    const shouldReduceAnimations = isMobile || prefersReducedMotion || isLowEndDevice;
    
    // Animation budget: 0 = no animations, 1 = essential only, 2 = full
    let animationBudget: 0 | 1 | 2 = 2;
    if (prefersReducedMotion) {
      animationBudget = 0;
    } else if (isLowEndDevice || isMobile) {
      animationBudget = 1;
    }

    // Duration multiplier for animations
    let durationMultiplier = 1;
    if (prefersReducedMotion) {
      durationMultiplier = 0.01; // Near-instant
    } else if (isLowEndDevice) {
      durationMultiplier = 0.5; // Faster animations
    }

    // Use blur placeholders on capable devices only
    const shouldUseBlurPlaceholder = !isLowEndDevice && supportsBackdropFilter;

    return {
      shouldReduceAnimations,
      animationBudget,
      shouldUseBlurPlaceholder,
      durationMultiplier,
    };
  }, [isMobile, prefersReducedMotion, isLowEndDevice, supportsBackdropFilter]);

  return {
    ...performanceMetrics,
    isMobile,
    prefersReducedMotion,
    isLowEndDevice,
    supportsBackdropFilter,
  };
};
