import { useCallback } from 'react';
import { isWeb3ModalAvailable, appKit } from '@/lib/web3';

/**
 * Safe wrapper for useAppKit that doesn't throw when AppKit is not initialized.
 * Use this instead of useAppKit from @reown/appkit/react
 */
export function useAppKitSafe() {
  const isAvailable = isWeb3ModalAvailable();

  const open = useCallback(async () => {
    if (isAvailable && appKit) {
      try {
        await appKit.open();
      } catch (error) {
        console.warn('Failed to open AppKit modal:', error);
      }
    } else {
      console.warn('AppKit is not available. Set VITE_WALLETCONNECT_PROJECT_ID to enable wallet connection.');
    }
  }, [isAvailable]);

  const close = useCallback(async () => {
    if (isAvailable && appKit) {
      try {
        await appKit.close();
      } catch (error) {
        console.warn('Failed to close AppKit modal:', error);
      }
    }
  }, [isAvailable]);

  return {
    open,
    close,
    isAvailable,
  };
}
