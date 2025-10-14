'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TokenBank_ABI, MyERC20_ABI } from '../../utils/contracts';
import { formatUnits, parseUnits } from 'viem';

/**
 * Bank Page
 * Interact with TokenBank contract
 * - Deposit tokens
 * - Withdraw tokens
 * - View deposited balance
 */
export default function BankPage() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read wallet token balance
  const { data: walletBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
    abi: MyERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read bank deposit balance
  const { data: bankBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
    abi: TokenBank_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Handle deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBank_ABI,
        functionName: 'deposit',
        args: [parseUnits(depositAmount, 18)],
      });
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  // Handle withdraw
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBank_ABI,
        functionName: 'withdraw',
        args: [parseUnits(withdrawAmount, 18)],
      });
    } catch (error) {
      console.error('Withdraw error:', error);
    }
  };

  // Approve bank to spend tokens
  const handleApprove = async () => {
    if (!depositAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
        abi: MyERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.TokenBank as `0x${string}`, parseUnits(depositAmount, 18)],
      });
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Token Bank</h1>
          <p className="text-lg text-gray-600">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Token Bank</h1>

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
            <p className="text-2xl font-bold text-blue-600">
              {walletBalance ? formatUnits(walletBalance as bigint, 18) : '0'} MERC20
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Bank Balance</p>
            <p className="text-2xl font-bold text-green-600">
              {bankBalance ? formatUnits(bankBalance as bigint, 18) : '0'} MERC20
            </p>
          </div>
        </div>

        {/* Deposit Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit Tokens</h2>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Deposit
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending || isConfirming}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                1. Approve
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                2. Deposit
              </button>
            </div>
          </form>
        </div>

        {/* Withdraw Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdraw Tokens</h2>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Withdraw
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </div>

        {/* Transaction Status */}
        {isConfirmed && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Transaction confirmed!</p>
            {hash && (
              <p className="text-sm text-green-600 mt-1 break-all">
                Hash: {hash}
              </p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>First approve the bank contract to spend your tokens</li>
            <li>Then deposit tokens into the bank</li>
            <li>Withdraw anytime to get your tokens back</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

