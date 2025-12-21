import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from '@reown/appkit/networks';
import { http, createConfig } from 'wagmi';
import { bsc } from 'wagmi/chains';

// Reown Cloud Project ID - use env var or empty string to disable
// The old hardcoded ID 'a01e309e8e50a5c1e4cc4f9f05e0d5a1' causes 403 errors
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// CAMLY Token Contract on BSC Mainnet
export const CAMLY_CONTRACT_ADDRESS = '0x0910320181889feFDE0BB1Ca63962b0A8882e413';

// Reward amounts
export const REWARDS = {
  FIRST_WALLET_CONNECT: 50000,
  GAME_COMPLETE: 10000,
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

// App metadata
const metadata = {
  name: 'FUN Planet',
  description: 'Build Your Planet – Play & Earn Joy! 🌍',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://funplanet.app',
  icons: ['https://funplanet.app/pwa-512x512.png'],
};

// BSC Mainnet configuration (Chain ID 56)
const bscNetwork = defineChain({
  id: 56,
  caipNetworkId: 'eip155:56',
  chainNamespace: 'eip155',
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: [
        'https://bsc-dataseed.binance.org',
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed2.binance.org',
        'https://bsc-dataseed3.binance.org',
        'https://bsc-dataseed4.binance.org',
      ],
    },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
  testnet: false,
});

// Create Wagmi Adapter - only if projectId is configured
export const wagmiAdapter = projectId ? new WagmiAdapter({
  networks: [bscNetwork],
  projectId,
  ssr: false,
}) : null;

// Fallback wagmi config for when no project ID is set
// This ensures wagmi hooks still work without WalletConnect
const fallbackWagmiConfig = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
  },
});

// Export wagmi config for provider - always provide a valid config
export const wagmiConfig = wagmiAdapter?.wagmiConfig ?? fallbackWagmiConfig;

// Create AppKit modal - only if projectId is configured and valid
// COMPLETELY disable all external API calls to avoid 403 errors on pulse.walletconnect.org and api.web3modal.org
// Setting projectId to empty string or falsy value will disable all WalletConnect cloud features
const hasValidProjectId = Boolean(projectId && projectId.length > 10 && projectId !== 'undefined');

export const appKit = hasValidProjectId ? createAppKit({
  adapters: wagmiAdapter ? [wagmiAdapter] : [],
  networks: [bscNetwork],
  defaultNetwork: bscNetwork,
  projectId,
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#FF6B00',
    '--w3m-border-radius-master': '16px',
  },
  features: {
    analytics: false, // Disable pulse.walletconnect.org calls
    email: false,
    socials: false, // Use false instead of empty array
    onramp: false,
    swaps: false,
    history: false, // Disable transaction history API calls
    allWallets: false, // Disable fetching wallet list from API
  },
  enableWalletGuide: false,
  allowUnsupportedChain: true,
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
}) : null;

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

// Export web3Modal for backwards compatibility
export const web3Modal = appKit;

// Helper to check if Web3Modal is available
export const isWeb3ModalAvailable = (): boolean => {
  return Boolean(hasValidProjectId && appKit);
};
