'use client';

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, MyERC20_ABI } from '../utils/contracts';
import { formatUnits } from 'viem';

/**
 * TokenBalance Component
 * Displays the MyERC20 token balance for the connected wallet
 */
export default function TokenBalance() {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
    abi: MyERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">Your MERC20 Balance</p>
      {isLoading ? (
        <p className="text-2xl font-bold text-blue-600">Loading...</p>
      ) : (
        <p className="text-2xl font-bold text-blue-600">
          {balance ? formatUnits(balance as bigint, 18) : '0'} MERC20
        </p>
      )}
    </div>
  );
}

