import { useCallback, useMemo } from 'react';
import { useConnect } from 'wagmi';

/**
 * Safe wrapper for wallet connection using wagmi's injected connector.
 * Supports MetaMask, Trust Wallet, and other injected wallets.
 */
export function useAppKitSafe() {
  const { connectAsync, connectors } = useConnect();

  const injectedConnector = useMemo(
    () => connectors.find((c) => 
      c.id === 'injected' || c.id === 'metaMask' || c.id.includes('injected')
    ),
    [connectors]
  );

  const isWalletAvailable = useMemo(
    () => typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined',
    []
  );

  const open = useCallback(async () => {
    if (!isWalletAvailable) {
      throw new Error('NO_WALLET_DETECTED');
    }

    if (!injectedConnector) {
      throw new Error('NO_INJECTED_WALLET');
    }

    await connectAsync({ connector: injectedConnector });
  }, [connectAsync, injectedConnector, isWalletAvailable]);

  const close = useCallback(async () => {
    // No-op: wallet disconnect is handled via useDisconnect in UI.
  }, []);

  return {
    open,
    close,
    isAvailable: isWalletAvailable && Boolean(injectedConnector),
  };
}
