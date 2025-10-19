import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Configure chains - Use hardhat (localhost) as primary for development
export const chains = [hardhat, sepolia] as const;

// Configure Wagmi with minimal setup to avoid RainbowKit issues
export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [
    injected(), // Only use injected wallet (MetaMask)
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545', {
      // Disable all automatic features
      batch: false,
      retryCount: 0,
      timeout: 10000,
    }),
    [sepolia.id]: http(),
  },
  ssr: true,
  // Completely disable all automatic features
  batch: {
    multicall: false,
  },
  // Disable all caching and polling
  cacheTime: 0,
  pollingInterval: undefined,
  // Disable all automatic contract detection
  contracts: {
    multicall: false,
  },
});

