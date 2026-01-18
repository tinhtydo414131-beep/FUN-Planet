import { useCallback, useEffect, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  /** Enable focus trap within container */
  trapFocus?: boolean;
  /** Enable arrow key navigation for grid/list */
  arrowNavigation?: boolean;
  /** Close callback when Escape is pressed */
  onEscape?: () => void;
  /** Custom key handlers */
  customHandlers?: Record<string, (e: KeyboardEvent) => void>;
  /** Auto-focus first element on mount */
  autoFocus?: boolean;
  /** Direction for arrow navigation */
  direction?: 'horizontal' | 'vertical' | 'grid';
  /** Number of columns for grid navigation */
  columns?: number;
}

/**
 * Hook for managing keyboard navigation and focus
 * Supports focus trapping, arrow key navigation, and escape handling
 */
export function useKeyboardNavigation<T extends HTMLElement = HTMLDivElement>(
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    trapFocus = false,
    arrowNavigation = false,
    onEscape,
    customHandlers = {},
    autoFocus = false,
    direction = 'vertical',
    columns = 1,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors));
  }, []);

  const focusElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
      element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, []);

  const getCurrentIndex = useCallback((): number => {
    const elements = getFocusableElements();
    const activeElement = document.activeElement as HTMLElement;
    return elements.indexOf(activeElement);
  }, [getFocusableElements]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      focusElement(elements[0]);
    }
  }, [getFocusableElements, focusElement]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      focusElement(elements[elements.length - 1]);
    }
  }, [getFocusableElements, focusElement]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = getCurrentIndex();
    const nextIndex = (currentIndex + 1) % elements.length;
    focusElement(elements[nextIndex]);
  }, [getFocusableElements, getCurrentIndex, focusElement]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = getCurrentIndex();
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    focusElement(elements[prevIndex]);
  }, [getFocusableElements, getCurrentIndex, focusElement]);

  const focusUp = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = getCurrentIndex();
    const upIndex = currentIndex - columns;
    if (upIndex >= 0) {
      focusElement(elements[upIndex]);
    }
  }, [getFocusableElements, getCurrentIndex, focusElement, columns]);

  const focusDown = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = getCurrentIndex();
    const downIndex = currentIndex + columns;
    if (downIndex < elements.length) {
      focusElement(elements[downIndex]);
    }
  }, [getFocusableElements, getCurrentIndex, focusElement, columns]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Custom handlers first
    if (customHandlers[e.key]) {
      customHandlers[e.key](e);
      return;
    }

    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;

      case 'Tab':
        if (trapFocus) {
          const elements = getFocusableElements();
          if (elements.length === 0) return;

          const firstElement = elements[0];
          const lastElement = elements[elements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            focusElement(lastElement);
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            focusElement(firstElement);
          }
        }
        break;

      case 'ArrowDown':
        if (arrowNavigation) {
          e.preventDefault();
          if (direction === 'grid') {
            focusDown();
          } else if (direction === 'vertical') {
            focusNext();
          }
        }
        break;

      case 'ArrowUp':
        if (arrowNavigation) {
          e.preventDefault();
          if (direction === 'grid') {
            focusUp();
          } else if (direction === 'vertical') {
            focusPrevious();
          }
        }
        break;

      case 'ArrowRight':
        if (arrowNavigation) {
          e.preventDefault();
          if (direction === 'horizontal' || direction === 'grid') {
            focusNext();
          }
        }
        break;

      case 'ArrowLeft':
        if (arrowNavigation) {
          e.preventDefault();
          if (direction === 'horizontal' || direction === 'grid') {
            focusPrevious();
          }
        }
        break;

      case 'Home':
        if (arrowNavigation) {
          e.preventDefault();
          focusFirst();
        }
        break;

      case 'End':
        if (arrowNavigation) {
          e.preventDefault();
          focusLast();
        }
        break;
    }
  }, [
    arrowNavigation,
    customHandlers,
    direction,
    focusDown,
    focusElement,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusUp,
    getFocusableElements,
    onEscape,
    trapFocus,
  ]);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    
    // Store previous focus and optionally auto-focus
    if (trapFocus || autoFocus) {
      previousActiveElement.current = document.activeElement;
      if (autoFocus) {
        focusFirst();
      }
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when unmounting
      if (trapFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [handleKeyDown, trapFocus, autoFocus, focusFirst]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements,
  };
}

/**
 * Simple hook just for handling Escape key
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
