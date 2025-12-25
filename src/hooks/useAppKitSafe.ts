import { useCallback, useMemo } from 'react';
import { useConnect } from 'wagmi';

/**
 * Safe wrapper kept for backwards compatibility with the old modal-based flow.
 * Now it simply triggers an injected-wallet connection (MetaMask/Trust Wallet...).
 */
export function useAppKitSafe() {
  const { connectAsync, connectors } = useConnect();

  const injectedConnector = useMemo(
    () => connectors.find((c) => c.id === 'injected'),
    [connectors]
  );

  const open = useCallback(async () => {
    if (!injectedConnector) {
      // Caller components already show a toast; keep hook side-effect free.
      throw new Error('NO_INJECTED_WALLET');
    }

    await connectAsync({ connector: injectedConnector });
  }, [connectAsync, injectedConnector]);

  const close = useCallback(async () => {
    // No-op: wallet disconnect is handled via useDisconnect in UI.
  }, []);

  return {
    open,
    close,
    isAvailable: Boolean(injectedConnector),
  };
}
