import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, polygon, optimism, arbitrum, bsc } from 'wagmi/chains';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'f8c84e1e3c6e8d6b3f2a9b1c5d4e3f2a'; // Demo project ID

// 2. Create wagmiConfig
const metadata = {
  name: 'FUN Planet',
  description: 'Play games and earn crypto!',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, polygon, optimism, arbitrum, bsc] as const;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// 3. Create modal
export const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: false,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#8B46FF',
  }
});
