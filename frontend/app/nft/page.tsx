'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, MyNFT_ABI } from '../../utils/contracts';
import { publicClient } from '../../utils/viemClient';

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
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
  const [isLoadingOwnedNFTs, setIsLoadingOwnedNFTs] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Clear state when wallet address changes or disconnects
  useEffect(() => {
    setMintTo('');
    setTokenURI('');
    setSelectedTokenId('');
    setNftList([]);
    setOwnedTokenIds([]);
    setShowTokenDetails(false);
  }, [address, isConnected]);

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

  // Function to get owned NFT token IDs
  const getOwnedNFTs = async () => {
    if (!address || !totalSupply) return;
    
    setIsLoadingOwnedNFTs(true);
    try {
      const ownedTokens: number[] = [];
      const totalSupplyNum = Number(totalSupply);
      
      // Check ownership for each token ID from 0 to totalSupply-1
      for (let i = 0; i < totalSupplyNum; i++) {
        try {
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
            abi: MyNFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(i)],
          });
          
          if (owner.toLowerCase() === address.toLowerCase()) {
            ownedTokens.push(i);
          }
        } catch (error) {
          // Token might not exist or be burned, skip it
          console.log(`Token ${i} not found or burned`);
        }
      }
      
      setOwnedTokenIds(ownedTokens);
    } catch (error) {
      console.error('Error fetching owned NFTs:', error);
    } finally {
      setIsLoadingOwnedNFTs(false);
    }
  };

  // Load owned NFTs when address or totalSupply changes
  useEffect(() => {
    if (address && totalSupply && Number(totalSupply) > 0) {
      getOwnedNFTs();
    }
  }, [address, totalSupply]);

  // Refresh data when mint transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      // Refresh total supply and balance
      refetchTotalSupply();
      refetchBalance();
      // Refresh owned NFTs list
      if (address && totalSupply) {
        getOwnedNFTs();
      }
    }
  }, [isConfirmed, refetchTotalSupply, refetchBalance, address, totalSupply]);

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

  // Handle View Details button click
  const handleViewDetails = (tokenId: number) => {
    setSelectedTokenId(tokenId.toString());
    setShowTokenDetails(true);
    
    // Scroll to the Token URI section after a short delay
    setTimeout(() => {
      const tokenURISection = document.getElementById('token-uri-section');
      if (tokenURISection) {
        tokenURISection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
              if (address && totalSupply) {
                getOwnedNFTs();
              }
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

        {/* Owned NFTs List */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Owned NFTs</h2>
          {isLoadingOwnedNFTs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading your NFTs...</span>
            </div>
          ) : ownedTokenIds.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                You own {ownedTokenIds.length} NFT{ownedTokenIds.length > 1 ? 's' : ''}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ownedTokenIds.map((tokenId) => (
                  <div
                    key={tokenId}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-purple-600 font-bold text-lg">#{tokenId}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">Token ID: {tokenId}</p>
                      <button
                        onClick={() => handleViewDetails(tokenId)}
                        className="mt-2 px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🎨</span>
              </div>
              <p className="text-gray-600">You don't own any NFTs yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Mint an NFT or purchase one from the marketplace
              </p>
            </div>
          )}
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
        <div id="token-uri-section" className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">View Token Metadata</h2>
          {showTokenDetails && selectedTokenId && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ Selected Token ID: <span className="font-bold">{selectedTokenId}</span>
              </p>
            </div>
          )}
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  showTokenDetails && selectedTokenId 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300'
                }`}
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

