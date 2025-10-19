'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, MyERC20_ABI } from '../../utils/contracts';
import { formatUnits, isAddress, parseUnits } from 'viem';
import TokenBalance from '../../components/TokenBalance';

/**
 * Token Page
 * Interact with MyERC20 token contract
 * - View balance
 * - Transfer tokens
 * - Approve spending
 */
export default function TokenPage() {
  const { address, isConnected } = useAccount();
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [lastAction, setLastAction] = useState<'transfer' | 'approve' | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Clear errors and reset state when wallet address changes or disconnects
  useEffect(() => {
    setTransferError(null);
    setApproveError(null);
    setLastAction(null);
    setTransferTo('');
    setTransferAmount('');
    setApproveSpender('');
    setApproveAmount('');
  }, [address, isConnected]);

  // Read balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
    abi: MyERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Handle transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (!transferTo || !transferAmount) {
      setTransferError('Please enter both recipient address and amount.');
      return;
    }

    if (!isAddress(transferTo)) {
      setTransferError('Please enter a valid recipient address.');
      return;
    }

    let amount: bigint;
    try {
      amount = parseUnits(transferAmount, 18);
    } catch (err) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }

    if (amount <= BigInt(0)) {
      setTransferError('Amount must be greater than 0.');
      return;
    }

    try {
      setLastAction('transfer');
      writeContract({
        address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
        abi: MyERC20_ABI,
        functionName: 'transfer',
        args: [transferTo as `0x${string}`, amount],
      });
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferError(error instanceof Error ? error.message : 'Transfer failed. Please try again.');
    }
  };

  // Handle approve
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setApproveError(null);

    if (!approveSpender || !approveAmount) {
      setApproveError('Please enter both spender address and amount.');
      return;
    }

    if (!isAddress(approveSpender)) {
      setApproveError('Please enter a valid spender address.');
      return;
    }

    let amount: bigint;
    try {
      amount = parseUnits(approveAmount, 18);
    } catch (err) {
      setApproveError('Please enter a valid approval amount.');
      return;
    }

    if (amount <= BigInt(0)) {
      setApproveError('Amount must be greater than 0.');
      return;
    }

    try {
      setLastAction('approve');
      writeContract({
        address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
        abi: MyERC20_ABI,
        functionName: 'approve',
        args: [approveSpender as `0x${string}`, amount],
      });
    } catch (error) {
      console.error('Approve error:', error);
      setApproveError(error instanceof Error ? error.message : 'Approval failed. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Token Management</h1>
          <p className="text-lg text-gray-600">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MyERC20 Token</h1>

        {/* Balance Display */}
        <TokenBalance />

        {/* Transfer Section */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transfer Tokens</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => {
                  setTransferTo(e.target.value);
                  if (transferError) setTransferError(null);
                }}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => {
                  setTransferAmount(e.target.value);
                  if (transferError) setTransferError(null);
                }}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Transfer'}
            </button>
          </form>
          {transferError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{transferError}</p>
            </div>
          )}
          {isConfirmed && lastAction === 'transfer' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-bold">✅ Transfer Confirmed!</p>
              {hash && (
                <p className="text-sm text-green-600 mt-1 break-all">
                  Hash: {hash}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Approve Section */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Approve Spending</h2>
          <form onSubmit={handleApprove} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spender Address
              </label>
              <input
                type="text"
                value={approveSpender}
                onChange={(e) => {
                  setApproveSpender(e.target.value);
                  if (approveError) setApproveError(null);
                }}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Approve
              </label>
              <input
                type="number"
                value={approveAmount}
                onChange={(e) => {
                  setApproveAmount(e.target.value);
                  if (approveError) setApproveError(null);
                }}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Approve'}
            </button>
          </form>
          {approveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{approveError}</p>
            </div>
          )}
          {isConfirmed && lastAction === 'approve' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-bold">✅ Approval Confirmed!</p>
              {hash && (
                <p className="text-sm text-green-600 mt-1 break-all">
                  Hash: {hash}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Info</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Token Name:</strong> MyERC20</p>
            <p><strong>Symbol:</strong> MERC20</p>
            <p><strong>Decimals:</strong> 18</p>
            <p><strong>Contract:</strong> <code className="text-xs bg-white px-2 py-1 rounded">{CONTRACT_ADDRESSES.MyERC20}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

