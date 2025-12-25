// Admin wallet whitelist configuration
// Add wallet addresses that have admin access to the dashboard
export const ADMIN_WALLETS = [
  '0x0910320181889fefde0bb1ca63962b0a8882e413', // Default admin wallet
  // Add your wallet address here
] as const;

// Funny redirect message when non-admin tries to access
export const ADMIN_ACCESS_DENIED_MESSAGE = "This page is managed by Father Universe, baby! 🌟";

// BscScan base URL for wallet links
export const BSCSCAN_ADDRESS_URL = 'https://bscscan.com/address/';
export const BSCSCAN_TX_URL = 'https://bscscan.com/tx/';

// Check if wallet is admin
export const isAdminWallet = (walletAddress: string | null | undefined): boolean => {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.some(
    (admin) => admin.toLowerCase() === walletAddress.toLowerCase()
  );
};

// Format wallet address for display
export const formatWalletAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

// Get BscScan link for address
export const getBscScanAddressLink = (address: string): string => {
  return `${BSCSCAN_ADDRESS_URL}${address}`;
};

// Get BscScan link for transaction
export const getBscScanTxLink = (txHash: string): string => {
  return `${BSCSCAN_TX_URL}${txHash}`;
};
