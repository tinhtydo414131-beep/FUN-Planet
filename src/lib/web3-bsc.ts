// Re-export everything from the main web3 module
// This file is kept for backwards compatibility
export {
  CAMLY_CONTRACT_ADDRESS,
  REWARDS,
  CAMLY_ABI,
  wagmiAdapter,
  wagmiConfig,
  appKit,
  formatCamly,
  shortenAddress,
  web3Modal,
} from './web3';

// Backwards compatible exports
export const wagmiConfigBSC = undefined; // Deprecated, use wagmiConfig
export const web3ModalBSC = undefined; // Deprecated, use appKit
