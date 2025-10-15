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
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
  },
  ssr: true,
});

