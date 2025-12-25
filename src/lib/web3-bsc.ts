// Re-export everything from the main web3 module
// This file is kept for backwards compatibility
export {
  CAMLY_CONTRACT_ADDRESS,
  REWARDS,
  CAMLY_ABI,
  wagmiConfig,
  formatCamly,
  shortenAddress,
  isWalletAvailable,
} from './web3';

// Backwards compatible exports (deprecated)
export const wagmiAdapter = null; // Deprecated, use wagmiConfig directly
export const wagmiConfigBSC = undefined; // Deprecated, use wagmiConfig
export const web3ModalBSC = undefined; // Deprecated
export const appKit = null; // Deprecated
export const web3Modal = null; // Deprecated
export const isWeb3ModalAvailable = (): boolean => false; // Deprecated
