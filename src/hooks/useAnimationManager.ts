import { useCallback, useRef, useSyncExternalStore } from 'react';

// Global animation registry - singleton pattern
class AnimationRegistry {
  private activeAnimations = new Set<string>();
  private listeners = new Set<() => void>();
  private readonly MAX_ANIMATIONS = 2;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.activeAnimations.size;

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  register(id: string): boolean {
    if (this.activeAnimations.size >= this.MAX_ANIMATIONS) {
      return false;
    }
    this.activeAnimations.add(id);
    this.notify();
    return true;
  }

  unregister(id: string): void {
    this.activeAnimations.delete(id);
    this.notify();
  }

  canAnimate(): boolean {
    return this.activeAnimations.size < this.MAX_ANIMATIONS;
  }

  getActiveCount(): number {
    return this.activeAnimations.size;
  }
}

const registry = new AnimationRegistry();

/**
 * Hook to manage animation budget - limits concurrent animations to 2
 * 
 * Usage:
 * const { registerAnimation, unregisterAnimation, canAnimate } = useAnimationManager();
 * 
 * useEffect(() => {
 *   const id = 'my-animation';
 *   if (registerAnimation(id)) {
 *     // Start animation
 *     return () => unregisterAnimation(id);
 *   }
 * }, []);
 */
export function useAnimationManager() {
  const idCounter = useRef(0);
  
  const activeCount = useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot,
    registry.getSnapshot
  );

  const generateId = useCallback(() => {
    idCounter.current += 1;
    return `anim_${Date.now()}_${idCounter.current}`;
  }, []);

  const registerAnimation = useCallback((id?: string): string | null => {
    const animId = id || generateId();
    const success = registry.register(animId);
    return success ? animId : null;
  }, [generateId]);

  const unregisterAnimation = useCallback((id: string): void => {
    registry.unregister(id);
  }, []);

  const canAnimate = useCallback((): boolean => {
    return registry.canAnimate();
  }, []);

  return {
    registerAnimation,
    unregisterAnimation,
    canAnimate,
    activeCount,
    animationBudget: 2 - activeCount,
  };
}

/**
 * Hook for a single managed animation
 * Automatically registers/unregisters on mount/unmount
 */
export function useManagedAnimation(animationId?: string) {
  const { registerAnimation, unregisterAnimation, canAnimate } = useAnimationManager();
  const registeredId = useRef<string | null>(null);

  const start = useCallback(() => {
    if (registeredId.current) return true; // Already running
    const id = registerAnimation(animationId);
    if (id) {
      registeredId.current = id;
      return true;
    }
    return false;
  }, [registerAnimation, animationId]);

  const stop = useCallback(() => {
    if (registeredId.current) {
      unregisterAnimation(registeredId.current);
      registeredId.current = null;
    }
  }, [unregisterAnimation]);

  return {
    start,
    stop,
    isRunning: registeredId.current !== null,
    canStart: canAnimate(),
  };
}
