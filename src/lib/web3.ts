import { createConfig, http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID - Optional, app works without it using only injected wallets
// Get your own at https://cloud.walletconnect.com/
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

// CAMLY Token Contract on BSC Mainnet
export const CAMLY_CONTRACT_ADDRESS = '0x0910320181889feFDE0BB1Ca63962b0A8882e413';

// Dedicated Donation Wallet for FUN Planet (BSC)
// This wallet receives on-chain CAMLY token donations
export const DONATION_WALLET_ADDRESS = '0xabeb558cc6d34e56eadb53d248872bed1e7b77be';

// Reward amounts
export const REWARDS = {
  FIRST_WALLET_CONNECT: 50000,
  FIRST_GAME_PLAY: 10000,      // First time playing each game
  DAILY_CHECKIN: 5000,
  UPLOAD_GAME: 500000,
  NFT_MINT_COST: 1000,
};

// CAMLY Token ABI (ERC20 + Airdrop functions)
export const CAMLY_ABI = [
  // ERC20 Standard
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  // Airdrop Functions
  {
    constant: false,
    inputs: [],
    name: 'claimAirdrop',
    outputs: [],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'account', type: 'address' }],
    name: 'hasClaimedAirdrop',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'address' }],
    name: 'hasClaimed',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'remainingAirdropPool',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'AIRDROP_AMOUNT',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'AirdropClaimed',
    type: 'event',
  },
] as const;

// Rewards Claim Contract ABI
export const REWARDS_CLAIM_ABI = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'remainingPool',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'claimedAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'nonce', type: 'bytes32' }],
    name: 'isNonceUsed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'totalClaimed', type: 'uint256' },
    ],
    name: 'RewardsClaimed',
    type: 'event',
  },
] as const;

// Create wagmi config with BSC mainnet
// Includes injected wallets (MetaMask, Trust Wallet) and optionally WalletConnect
export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: walletConnectProjectId 
    ? [
        // Generic injected connector - works with MetaMask, Trust Wallet, Coinbase, etc.
        injected(),
        // WalletConnect for mobile QR code scanning (only if Project ID is configured)
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: 'FUN Planet',
            description: 'Play games, earn CAMLY tokens',
            url: 'https://planet.fun.rich',
            icons: ['https://planet.fun.rich/favicon.ico'],
          },
        }),
      ]
    : [
        // Only injected connector when WalletConnect is not configured
        injected(),
      ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
  },
});

// Check if WalletConnect QR scanning is available
export const isWalletConnectConfigured = (): boolean => {
  return !!walletConnectProjectId;
};

// Helper to format CAMLY amount
export const formatCamly = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
};

// Helper to shorten address
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper to check if an injected wallet is available
export const isWalletAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
};
