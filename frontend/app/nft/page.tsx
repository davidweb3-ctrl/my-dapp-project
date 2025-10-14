'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, MyNFT_ABI } from '../../utils/contracts';

interface NFT {
  tokenId: number;
  uri: string;
}

/**
 * NFT Page
 * Interact with MyNFT contract
 * - View owned NFTs
 * - Mint new NFTs (owner only)
 */
export default function NFTPage() {
  const { address, isConnected } = useAccount();
  const [mintTo, setMintTo] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [nftList, setNftList] = useState<NFT[]>([]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Refresh data when mint transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      // Refresh total supply and balance
      refetchTotalSupply();
      refetchBalance();
    }
  }, [isConfirmed, refetchTotalSupply, refetchBalance]);

  // Read total supply
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
    abi: MyNFT_ABI,
    functionName: 'totalSupply',
  });

  // Read user's NFT balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
    abi: MyNFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read token URI
  const { data: tokenURIData } = useReadContract({
    address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
    abi: MyNFT_ABI,
    functionName: 'tokenURI',
    args: selectedTokenId ? [BigInt(selectedTokenId)] : undefined,
    query: {
      enabled: !!selectedTokenId,
    },
  });

  // Handle mint
  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintTo || !tokenURI) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
        abi: MyNFT_ABI,
        functionName: 'mint',
        args: [mintTo as `0x${string}`, tokenURI],
      });
    } catch (error) {
      console.error('Mint error:', error);
    }
  };

  // Load token URI
  const handleLoadTokenURI = (e: React.FormEvent) => {
    e.preventDefault();
    // Token URI will be loaded automatically via useReadContract
  };

  if (!isConnected) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">NFT Manager</h1>
          <p className="text-lg text-gray-600">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MyNFT Collection</h1>
          <button
            onClick={() => {
              refetchTotalSupply();
              refetchBalance();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Your NFTs</p>
            <p className="text-2xl font-bold text-purple-600">
              {balance ? balance.toString() : '0'}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Total Minted</p>
            <p className="text-2xl font-bold text-indigo-600">
              {totalSupply ? totalSupply.toString() : '0'}
            </p>
          </div>
        </div>

        {/* Mint NFT Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mint NFT (Owner Only)</h2>
          <form onSubmit={handleMint} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token URI (Metadata URL)
              </label>
              <input
                type="text"
                value={tokenURI}
                onChange={(e) => setTokenURI(e.target.value)}
                placeholder="ipfs://... or https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint NFT'}
            </button>
          </form>
          {isConfirmed && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-bold">✅ NFT Minted Successfully!</p>
              {hash && (
                <p className="text-sm text-green-600 mt-1 break-all">
                  Hash: {hash}
                </p>
              )}
            </div>
          )}
        </div>

        {/* View Token URI */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">View Token Metadata</h2>
          <form onSubmit={handleLoadTokenURI} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID
              </label>
              <input
                type="number"
                value={selectedTokenId}
                onChange={(e) => setSelectedTokenId(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {tokenURIData && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Token URI:</p>
                <p className="text-sm text-blue-800 break-all">{tokenURIData as string}</p>
              </div>
            )}
          </form>
        </div>

        {/* Quick Actions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">NFT Info</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Collection Name:</strong> MyNFT</p>
            <p><strong>Symbol:</strong> MNFT</p>
            <p><strong>Contract:</strong> <code className="text-xs bg-white px-2 py-1 rounded">{CONTRACT_ADDRESSES.MyNFT}</code></p>
            <p className="mt-4 text-xs text-gray-500">
              Note: Only the contract owner can mint new NFTs. You can view and transfer NFTs you own.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

