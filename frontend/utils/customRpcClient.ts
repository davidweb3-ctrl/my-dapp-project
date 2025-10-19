import { createPublicClient, http, parseAbi } from 'viem';
import { hardhat } from 'viem/chains';

// Create a custom RPC client that bypasses Wagmi's automatic detection
export const customRpcClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545', {
    batch: false,
    retryCount: 0,
    timeout: 10000,
  }),
});

// Contract addresses
export const CONTRACT_ADDRESSES = {
  MyERC20: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TokenBank: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  MyNFT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  NFTMarket: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  MockPermit2: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
} as const;

// Basic ERC20 ABI for balance checking
export const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
]);

// TokenBank ABI
export const TOKEN_BANK_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

// MockPermit2 ABI
export const MOCK_PERMIT2_ABI = parseAbi([
  'function nonces(address owner) view returns (uint256)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
]);

// Helper functions
export async function getTokenBalance(address: `0x${string}`): Promise<bigint> {
  try {
    return await customRpcClient.readContract({
      address: CONTRACT_ADDRESSES.MyERC20,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0n;
  }
}

export async function getBankBalance(address: `0x${string}`): Promise<bigint> {
  try {
    return await customRpcClient.readContract({
      address: CONTRACT_ADDRESSES.TokenBank,
      abi: TOKEN_BANK_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
  } catch (error) {
    console.error('Error getting bank balance:', error);
    return 0n;
  }
}

export async function getPermit2Nonce(address: `0x${string}`): Promise<bigint> {
  try {
    return await customRpcClient.readContract({
      address: CONTRACT_ADDRESSES.MockPermit2,
      abi: MOCK_PERMIT2_ABI,
      functionName: 'nonces',
      args: [address],
    });
  } catch (error) {
    console.error('Error getting permit2 nonce:', error);
    return 0n;
  }
}
