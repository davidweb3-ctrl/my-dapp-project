import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Configure chains - Use hardhat (localhost) as primary for development
export const chains = [hardhat, sepolia] as const;

// Configure Wagmi with RainbowKit
export const config = getDefaultConfig({
  appName: 'My DApp',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
  },
  ssr: true,
});

