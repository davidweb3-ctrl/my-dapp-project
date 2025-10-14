import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia, hardhat } from 'viem/chains';

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: hardhat, // Change to sepolia for testnet
  transport: http('http://127.0.0.1:8545'),
});

// Wallet client for signing transactions (browser wallet)
export const getWalletClient = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: hardhat, // Change to sepolia for testnet
      transport: custom(window.ethereum),
    });
  }
  return null;
};

