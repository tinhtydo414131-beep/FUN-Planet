/// <reference types="vite/client" />

// Global type declarations for window.ethereum
// Provides typing for MetaMask and other wallet providers
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    isTrust?: boolean;
    on?: (event: string, callback: (...args: any[]) => void) => void;
    removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    removeAllListeners?: (event: string) => void;
    request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  };
}
