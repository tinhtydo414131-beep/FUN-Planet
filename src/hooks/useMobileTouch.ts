import { useCallback, useRef, useEffect } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  isDragging: boolean;
  velocity: { x: number; y: number };
}

interface UseMobileTouchOptions {
  onDrag?: (deltaX: number, deltaY: number, velocity: { x: number; y: number }) => void;
  onTap?: (x: number, y: number) => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  sensitivity?: number;
  inertia?: boolean;
}

export function useMobileTouch(
  elementRef: React.RefObject<HTMLElement>,
  options: UseMobileTouchOptions = {}
) {
  const {
    onDrag,
    onTap,
    onPinch,
    onRotate,
    sensitivity = 1,
    inertia = true
  } = options;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
    velocity: { x: 0, y: 0 }
  });

  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchAngle = useRef<number | null>(null);
  const inertiaFrame = useRef<number>();
  const lastMoveTime = useRef<number>(0);

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getAngle = useCallback((touch1: Touch, touch2: Touch) => {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    );
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const state = touchState.current;
    
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
    state.isDragging = false;
    state.velocity = { x: 0, y: 0 };
    lastMoveTime.current = Date.now();

    if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
      lastTouchAngle.current = getAngle(e.touches[0], e.touches[1]);
    }

    if (inertiaFrame.current) {
      cancelAnimationFrame(inertiaFrame.current);
    }
  }, [getDistance, getAngle]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault(); // Prevent scroll
    
    const touch = e.touches[0];
    const state = touchState.current;
    const now = Date.now();
    const dt = Math.max(1, now - lastMoveTime.current);
    
    const deltaX = (touch.clientX - state.lastX) * sensitivity;
    const deltaY = (touch.clientY - state.lastY) * sensitivity;
    
    // Calculate velocity for inertia
    state.velocity = {
      x: deltaX / dt * 16,
      y: deltaY / dt * 16
    };
    
    // Check if it's a drag (moved more than 5 pixels)
    const totalDeltaX = touch.clientX - state.startX;
    const totalDeltaY = touch.clientY - state.startY;
    if (Math.abs(totalDeltaX) > 5 || Math.abs(totalDeltaY) > 5) {
      state.isDragging = true;
    }
    
    if (state.isDragging && onDrag) {
      onDrag(deltaX, deltaY, state.velocity);
    }
    
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
    lastMoveTime.current = now;

    // Handle pinch zoom
    if (e.touches.length === 2 && onPinch) {
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      if (lastTouchDistance.current !== null) {
        const scale = newDistance / lastTouchDistance.current;
        onPinch(scale);
      }
      lastTouchDistance.current = newDistance;
    }

    // Handle rotation
    if (e.touches.length === 2 && onRotate) {
      const newAngle = getAngle(e.touches[0], e.touches[1]);
      if (lastTouchAngle.current !== null) {
        const deltaAngle = newAngle - lastTouchAngle.current;
        onRotate(deltaAngle);
      }
      lastTouchAngle.current = newAngle;
    }
  }, [sensitivity, onDrag, onPinch, onRotate, getDistance, getAngle]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const state = touchState.current;
    
    // If it wasn't a drag, it's a tap
    if (!state.isDragging && onTap && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      onTap(touch.clientX, touch.clientY);
    }
    
    // Apply inertia
    if (inertia && state.isDragging && onDrag) {
      const applyInertia = () => {
        const { velocity } = state;
        const friction = 0.95;
        
        velocity.x *= friction;
        velocity.y *= friction;
        
        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
          onDrag(velocity.x, velocity.y, velocity);
          inertiaFrame.current = requestAnimationFrame(applyInertia);
        }
      };
      
      inertiaFrame.current = requestAnimationFrame(applyInertia);
    }
    
    state.isDragging = false;
    lastTouchDistance.current = null;
    lastTouchAngle.current = null;
  }, [onTap, onDrag, inertia]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use passive: false to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (inertiaFrame.current) {
        cancelAnimationFrame(inertiaFrame.current);
      }
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isDragging: touchState.current.isDragging,
    velocity: touchState.current.velocity
  };
}

// Optimized touch event handler for 3D scenes
export function useOptimized3DTouch(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onCameraMove: (deltaX: number, deltaY: number) => void,
  onCameraZoom: (delta: number) => void
) {
  const frameRef = useRef<number>();
  const pendingMove = useRef({ x: 0, y: 0 });

  const throttledMove = useCallback(() => {
    if (pendingMove.current.x !== 0 || pendingMove.current.y !== 0) {
      onCameraMove(pendingMove.current.x, pendingMove.current.y);
      pendingMove.current = { x: 0, y: 0 };
    }
    frameRef.current = undefined;
  }, [onCameraMove]);

  const handleDrag = useCallback((deltaX: number, deltaY: number) => {
    pendingMove.current.x += deltaX;
    pendingMove.current.y += deltaY;
    
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(throttledMove);
    }
  }, [throttledMove]);

  const handlePinch = useCallback((scale: number) => {
    const zoomDelta = (scale - 1) * 50;
    onCameraZoom(zoomDelta);
  }, [onCameraZoom]);

  useMobileTouch(canvasRef, {
    onDrag: handleDrag,
    onPinch: handlePinch,
    sensitivity: 0.5,
    inertia: true
  });

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
}
