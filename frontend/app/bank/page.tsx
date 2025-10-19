'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignTypedData, useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES, TokenBank_ABI, MyERC20_ABI, MockPermit2_ABI } from '../../utils/contracts';
import { formatUnits, parseUnits, Address } from 'viem';
import { Permit2Utils, BatchDepositItem, DepositError, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../utils/permit2';
import { getTokenBalance, getBankBalance, getPermit2Nonce } from '../../utils/customRpcClient';
import DepositTypeSelector, { DepositType } from '../../components/DepositTypeSelector';
import Permit2DepositForm from '../../components/Permit2DepositForm';
import BatchDepositForm from '../../components/BatchDepositForm';
import SignatureModal from '../../components/SignatureModal';

/**
 * Enhanced Bank Page with Permit2 Support
 * Features:
 * - Traditional deposit (approve + deposit)
 * - Permit2 single deposit (signature + deposit)
 * - Batch Permit2 deposits (multiple amounts, one signature)
 * - Comprehensive error handling and user feedback
 */
export default function BankPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [depositType, setDepositType] = useState<DepositType>('permit2');
  const [lastAction, setLastAction] = useState<'deposit' | 'withdraw' | 'permitDeposit' | 'permit2Deposit' | 'batchDeposit' | 'approve' | null>(null);
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Modal states
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureModalData, setSignatureModalData] = useState<{
    title: string;
    message: string;
    amount?: string;
    expiration?: number;
    type: 'permit2' | 'batch';
  } | null>(null);
  
  // Error states
  const [error, setError] = useState<DepositError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();

  // Clear state when wallet address changes or disconnects
  useEffect(() => {
    setLastAction(null);
    setDepositAmount('');
    setWithdrawAmount('');
    setError(null);
    setSuccessMessage(null);
  }, [address, isConnected]);

  // State for balances and nonce
  const [walletBalance, setWalletBalance] = useState<bigint>(0n);
  const [bankBalance, setBankBalance] = useState<bigint>(0n);
  const [permit2Nonce, setPermit2Nonce] = useState<bigint>(0n);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch balances and nonce using custom RPC client
  const fetchBalances = async () => {
    if (!address) return;
    
    setIsLoadingBalances(true);
    try {
      const [tokenBalance, depositBalance, nonce] = await Promise.all([
        getTokenBalance(address),
        getBankBalance(address),
        getPermit2Nonce(address),
      ]);
      
      setWalletBalance(tokenBalance);
      setBankBalance(depositBalance);
      setPermit2Nonce(nonce);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && hash) {
      // Refresh balances after successful transaction
      fetchBalances();
      
      // Set success message based on last action
      if (lastAction === 'permit2Deposit') {
        setSuccessMessage(SUCCESS_MESSAGES.PERMIT2_DEPOSIT);
      } else if (lastAction === 'batchDeposit') {
        setSuccessMessage(SUCCESS_MESSAGES.BATCH_DEPOSIT);
      } else if (lastAction === 'deposit') {
        setSuccessMessage(SUCCESS_MESSAGES.DEPOSIT);
      } else if (lastAction === 'withdraw') {
        setSuccessMessage(SUCCESS_MESSAGES.WITHDRAW);
      }
      
      // Clear last action
      setLastAction(null);
    }
  }, [isConfirmed, hash, lastAction]);

  // Fetch balances when address changes
  useEffect(() => {
    fetchBalances();
  }, [address]);

  // Refetch nonce function
  const refetchNonce = async () => {
    if (!address) return;
    try {
      const nonce = await getPermit2Nonce(address);
      setPermit2Nonce(nonce);
    } catch (error) {
      console.error('Error refetching nonce:', error);
    }
  };

  // Handle traditional deposit
  const handleTraditionalDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    try {
      setError(null);
      setLastAction('deposit');
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBank_ABI,
        functionName: 'deposit',
        args: [parseUnits(depositAmount, 18)],
      });
    } catch (error) {
      console.error('Deposit error:', error);
      setError({
        type: 'transaction',
        message: ERROR_MESSAGES.TRANSACTION_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle approve
  const handleApprove = async () => {
    if (!depositAmount) return;

    try {
      setError(null);
      setLastAction('approve');
      writeContract({
        address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
        abi: MyERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.TokenBank as `0x${string}`, parseUnits(depositAmount, 18)],
      });
    } catch (error) {
      console.error('Approve error:', error);
      setError({
        type: 'transaction',
        message: ERROR_MESSAGES.TRANSACTION_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle Permit2 single deposit
  const handlePermit2Deposit = async (amount: string) => {
    if (!address) return;

    if (isPending) {
      setError({ type: 'transaction', message: 'Transaction already in progress' });
      return;
    }

    try {
      setError(null);
      
      // Refresh nonce before starting deposit
      await refetchNonce();
      
      const expiration = Permit2Utils.getDefaultExpiration();
      const nonce = Number(permit2Nonce || BigInt(0));

      // Set up signature modal
      setSignatureModalData({
        title: 'Sign Permit2 Authorization',
        message: 'Sign this message to authorize the deposit. This signature allows TokenBank to transfer your tokens without requiring a separate approval transaction.',
        amount,
        expiration,
        type: 'permit2',
      });
      setIsSignatureModalOpen(true);

    } catch (error) {
      console.error('Permit2 deposit error:', error);
      setIsSignatureModalOpen(false);
      
      if (error instanceof Error && error.message.includes('User rejected')) {
        setError({
          type: 'signature',
          message: ERROR_MESSAGES.SIGNATURE_REJECTED,
          suggestion: 'Please try again and approve the signature request',
        });
      } else {
        setError({
          type: 'signature',
          message: ERROR_MESSAGES.PERMIT2_ERROR,
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  // Handle batch Permit2 deposit
  const handleBatchDeposit = async (items: BatchDepositItem[]) => {
    if (!address || items.length === 0) return;

    if (isPending) {
      setError({ type: 'transaction', message: 'Transaction already in progress' });
      return;
    }

    try {
      setError(null);
      
      // Refresh nonce before starting batch deposit
      await refetchNonce();
      
      const totalAmount = Permit2Utils.calculateBatchTotal(items);
      const expiration = Permit2Utils.getDefaultExpiration();

      // Set up signature modal
      setSignatureModalData({
        title: 'Sign Batch Permit2 Authorization',
        message: `Sign this message to authorize ${items.length} deposits totaling ${totalAmount} MERC20 tokens. This single signature will authorize all deposits.`,
        amount: totalAmount,
        expiration,
        type: 'batch',
      });
      setIsSignatureModalOpen(true);

    } catch (error) {
      console.error('Batch deposit error:', error);
      setIsSignatureModalOpen(false);
      
      if (error instanceof Error && error.message.includes('User rejected')) {
        setError({
          type: 'signature',
          message: ERROR_MESSAGES.SIGNATURE_REJECTED,
          suggestion: 'Please try again and approve the signature request',
        });
      } else {
        setError({
          type: 'signature',
          message: ERROR_MESSAGES.PERMIT2_ERROR,
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  // Handle withdraw
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount) return;

    try {
      setError(null);
      setLastAction('withdraw');
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBank_ABI,
        functionName: 'withdraw',
        args: [parseUnits(withdrawAmount, 18)],
      });
    } catch (error) {
      console.error('Withdraw error:', error);
      setError({
        type: 'transaction',
        message: ERROR_MESSAGES.TRANSACTION_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle signature modal
  const handleSignatureModalSign = async () => {
    if (!address || !signatureModalData) return;

    try {
      setError(null);
      
      // Refresh nonce before signing
      await refetchNonce();
      
      const expiration = Permit2Utils.getDefaultExpiration();
      const nonce = Number(permit2Nonce || BigInt(0));

      // Generate signature
      const typedData = Permit2Utils.getPermit2TypedData(
        address,
        CONTRACT_ADDRESSES.TokenBank as Address,
        signatureModalData.amount || '0',
        CONTRACT_ADDRESSES.MyERC20 as Address,
        expiration,
        Number(nonce),
        chainId
      );

      const signature = await signTypedDataAsync(typedData);
      const { v, r, s } = Permit2Utils.splitSignature(signature);

      // Close modal
      setIsSignatureModalOpen(false);

      // Execute deposit based on type
      if (signatureModalData.type === 'batch') {
        setLastAction('batchDeposit');
      } else {
        setLastAction('permit2Deposit');
      }
      
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBank_ABI,
        functionName: 'depositWithPermit2',
        args: [address, parseUnits(signatureModalData.amount || '0', 18) as bigint, expiration, nonce, v, r, s],
      });

    } catch (error) {
      console.error('Permit2 deposit error:', error);
      setIsSignatureModalOpen(false);
      
      if (error instanceof Error && error.message.includes('User rejected')) {
        setError({
          type: 'signature',
          message: ERROR_MESSAGES.SIGNATURE_REJECTED,
          suggestion: 'Please try again and approve the signature request',
        });
      } else {
        setError({
          type: 'signature',
          message: ERROR_MESSAGES.PERMIT2_ERROR,
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  // Show success message when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && lastAction) {
      switch (lastAction) {
        case 'permit2Deposit':
          setSuccessMessage(SUCCESS_MESSAGES.DEPOSIT_SUCCESS);
          break;
        case 'batchDeposit':
          setSuccessMessage(SUCCESS_MESSAGES.BATCH_DEPOSIT_SUCCESS);
          break;
        case 'deposit':
        case 'withdraw':
        case 'approve':
          setSuccessMessage('Transaction completed successfully');
          break;
      }
    }
  }, [isConfirmed, lastAction]);

  if (!isConnected) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Token Bank</h1>
          <p className="text-lg text-gray-600">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Token Bank</h1>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <p className="text-red-800 font-medium">{error.message}</p>
                {error.details && (
                  <p className="text-red-700 text-sm mt-1">{error.details}</p>
                )}
                {error.suggestion && (
                  <p className="text-red-600 text-sm mt-1">
                    💡 {error.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
            <p className="text-2xl font-bold text-blue-600">
              {isLoadingBalances ? 'Loading...' : `${formatUnits(walletBalance, 18)} MERC20`}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Bank Balance</p>
            <p className="text-2xl font-bold text-green-600">
              {isLoadingBalances ? 'Loading...' : `${formatUnits(bankBalance, 18)} MERC20`}
            </p>
          </div>
        </div>

        {/* Deposit Type Selector */}
        <div className="mb-8">
          <DepositTypeSelector
            value={depositType}
            onChange={setDepositType}
            disabled={isPending || isConfirming}
          />
        </div>

        {/* Deposit Forms */}
        <div className="space-y-8">
          {/* Permit2 Single Deposit */}
          {depositType === 'permit2' && (
            <div className="bg-white shadow rounded-lg p-6">
              <Permit2DepositForm
                onDeposit={handlePermit2Deposit}
                maxBalance={walletBalance}
                isLoading={isPending || isConfirming}
              />
            </div>
          )}

          {/* Batch Permit2 Deposit */}
          {depositType === 'batch' && (
            <div className="bg-white shadow rounded-lg p-6">
              <BatchDepositForm
                onDeposit={handleBatchDeposit}
                maxBalance={walletBalance}
                isLoading={isPending || isConfirming}
              />
            </div>
          )}

          {/* Traditional Deposit */}
          {depositType === 'normal' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Traditional Deposit</h2>
              <form onSubmit={handleTraditionalDeposit} className="space-y-4">
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
          )}
        </div>

        {/* Withdraw Section */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
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

        {/* Signature Modal */}
        {signatureModalData && (
          <SignatureModal
            isOpen={isSignatureModalOpen}
            onClose={() => setIsSignatureModalOpen(false)}
            onSign={handleSignatureModalSign}
            title={signatureModalData.title}
            message={signatureModalData.message}
            amount={signatureModalData.amount}
            expiration={signatureModalData.expiration}
            type={signatureModalData.type}
            isLoading={isPending}
            error={error?.message}
          />
        )}

        {/* Info Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit Methods Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-indigo-600 mb-2">Traditional Method</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Step 1: Approve the bank contract (costs gas)</li>
                <li>Step 2: Deposit tokens (costs gas)</li>
                <li>Requires two separate transactions</li>
                <li>Standard ERC20 approval process</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Permit2 Method</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Sign a message to approve (no gas)</li>
                <li>Deposit happens in same transaction</li>
                <li>Uses Permit2 standard</li>
                <li>More efficient and user-friendly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-600 mb-2">Batch Permit2</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Multiple deposits with one signature</li>
                <li>Maximum gas efficiency</li>
                <li>Perfect for bulk operations</li>
                <li>Single transaction for multiple amounts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}