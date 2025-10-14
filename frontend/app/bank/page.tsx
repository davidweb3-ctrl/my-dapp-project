'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData, useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES, TokenBank_ABI, MyERC20_ABI } from '../../utils/contracts';
import { formatUnits, parseUnits, Address } from 'viem';

/**
 * Bank Page
 * Interact with TokenBank contract
 * - Deposit tokens (traditional approve + deposit)
 * - Permit Deposit (gasless EIP-2612 signature + deposit in one transaction)
 * - Withdraw tokens
 * - View deposited balance
 */
export default function BankPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [permitAmount, setPermitAmount] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();

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

  // Read nonce for permit
  const { data: nonce } = useReadContract({
    address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
    abi: MyERC20_ABI,
    functionName: 'nonces',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Handle traditional deposit
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

  // Handle Permit Deposit (EIP-2612)
  const handlePermitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permitAmount || !address) return;

    try {
      const amount = parseUnits(permitAmount, 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

      // Sign EIP-2612 permit
      const signature = await signTypedDataAsync({
        domain: {
          name: 'MyERC20',
          version: '1',
          chainId: chainId,
          verifyingContract: CONTRACT_ADDRESSES.MyERC20 as Address,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: CONTRACT_ADDRESSES.TokenBank as Address,
          value: amount,
          nonce: nonce || BigInt(0),
          deadline: deadline,
        },
      });

      // Split signature into v, r, s
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);

      // Call permitDeposit with signature
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBank_ABI,
        functionName: 'permitDeposit',
        args: [address, amount, deadline, v, r, s],
      });
    } catch (error) {
      console.error('Permit deposit error:', error);
      alert('Permit deposit failed. Please try again.');
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

        {/* Permit Deposit Section (EIP-2612) - NEW! */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">⚡ Gasless Permit Deposit</h2>
            <span className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
              EIP-2612
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Sign once and deposit in a single transaction - no separate approval needed!
          </p>
          <form onSubmit={handlePermitDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Deposit
              </label>
              <input
                type="number"
                value={permitAmount}
                onChange={(e) => setPermitAmount(e.target.value)}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {isPending ? 'Signing...' : isConfirming ? 'Processing...' : '⚡ Sign & Deposit (One Step)'}
            </button>
          </form>
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-xs text-purple-800">
              <strong>💡 How it works:</strong> You sign a message to approve the deposit, then the contract 
              uses this signature to authorize and deposit in a single transaction - saving gas and time!
            </p>
          </div>
        </div>

        {/* Traditional Deposit Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Traditional Deposit</h2>
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
            <p className="text-green-800">✅ Transaction confirmed!</p>
            {hash && (
              <p className="text-sm text-green-600 mt-1 break-all">
                Hash: {hash}
              </p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Deposit Methods</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong className="text-purple-600">⚡ Permit Deposit (Recommended):</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Sign a message to approve (no gas)</li>
                <li>Deposit happens in same transaction</li>
                <li>Uses EIP-2612 standard</li>
                <li>More efficient and user-friendly</li>
              </ul>
            </div>
            <div>
              <strong className="text-indigo-600">Traditional Method:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Step 1: Approve the bank contract (costs gas)</li>
                <li>Step 2: Deposit tokens (costs gas)</li>
                <li>Requires two separate transactions</li>
              </ul>
            </div>
            <div>
              <strong className="text-green-600">Withdraw:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Withdraw your deposited tokens anytime</li>
                <li>No approval needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
