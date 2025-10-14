'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData, useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES, NFTMarket_ABI, MyNFT_ABI, MyERC20_ABI } from '../../utils/contracts';
import { formatUnits, parseUnits, Address } from 'viem';

interface Listing {
  tokenId: number;
  seller: string;
  price: bigint;
  isListed: boolean;
}

/**
 * Market Page
 * Interact with NFTMarket contract
 * - View listed NFTs
 * - Buy NFTs (traditional)
 * - List your NFTs for sale
 * - Whitelist Buy with EIP-712 signature (for exclusive sales)
 */
export default function MarketPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [listTokenId, setListTokenId] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [buyTokenId, setBuyTokenId] = useState('');
  const [viewTokenId, setViewTokenId] = useState('');
  const [listingInfo, setListingInfo] = useState<Listing | null>(null);
  
  // For whitelist buying
  const [whitelistTokenId, setWhitelistTokenId] = useState('');
  const [whitelistSignature, setWhitelistSignature] = useState('');
  const [showSignatureGenerator, setShowSignatureGenerator] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();

  // Read market owner
  const { data: marketOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
    abi: NFTMarket_ABI,
    functionName: 'owner',
  });

  // Check if current user is market owner
  const isMarketOwner = address && marketOwner && address.toLowerCase() === (marketOwner as string).toLowerCase();

  // Read listing info
  const { data: listing, refetch: refetchListing } = useReadContract({
    address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
    abi: NFTMarket_ABI,
    functionName: 'getListing',
    args: viewTokenId ? [BigInt(viewTokenId)] : undefined,
    query: {
      enabled: !!viewTokenId,
    },
  });

  useEffect(() => {
    if (listing) {
      const [seller, price, isListed] = listing as [string, bigint, boolean];
      setListingInfo({
        tokenId: parseInt(viewTokenId),
        seller,
        price,
        isListed,
      });
    }
  }, [listing, viewTokenId]);

  // Handle list NFT
  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTokenId || !listPrice) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarket_ABI,
        functionName: 'list',
        args: [BigInt(listTokenId), parseUnits(listPrice, 18)],
      });
    } catch (error) {
      console.error('List error:', error);
    }
  };

  // Handle traditional buy
  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyTokenId) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarket_ABI,
        functionName: 'buyNFT',
        args: [BigInt(buyTokenId)],
      });
    } catch (error) {
      console.error('Buy error:', error);
    }
  };

  // Generate whitelist signature (Market Owner only)
  const handleGenerateSignature = async () => {
    if (!isMarketOwner || !whitelistTokenId || !listingInfo) {
      alert('You must be the market owner and have a valid listing selected');
      return;
    }

    try {
      const tokenId = BigInt(whitelistTokenId);
      const buyer = address; // For demo, owner can generate signature for themselves
      const price = listingInfo.price;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

      // Sign EIP-712 typed data
      const signature = await signTypedDataAsync({
        domain: {
          name: 'NFTMarket',
          version: '1',
          chainId: chainId,
          verifyingContract: CONTRACT_ADDRESSES.NFTMarket as Address,
        },
        types: {
          Whitelist: [
            { name: 'buyer', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'price', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Whitelist',
        message: {
          buyer: buyer as Address,
          tokenId: tokenId,
          price: price,
          deadline: deadline,
        },
      });

      const signatureData = JSON.stringify({
        buyer,
        tokenId: tokenId.toString(),
        price: price.toString(),
        deadline: deadline.toString(),
        signature,
      }, null, 2);

      setWhitelistSignature(signatureData);
      alert('✅ Whitelist signature generated! Copy it and share with the buyer.');
    } catch (error) {
      console.error('Signature generation error:', error);
      alert('Failed to generate signature');
    }
  };

  // Handle whitelist buy with signature
  const handleWhitelistBuy = async () => {
    if (!whitelistTokenId || !whitelistSignature || !address) {
      alert('Please enter token ID and paste the whitelist signature');
      return;
    }

    try {
      const signatureObj = JSON.parse(whitelistSignature);
      
      // Verify buyer address matches
      if (signatureObj.buyer.toLowerCase() !== address.toLowerCase()) {
        alert('This signature is not for your address!');
        return;
      }

      // Split signature into v, r, s
      const signature = signatureObj.signature;
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);

      // Call permitBuy
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarket_ABI,
        functionName: 'permitBuy',
        args: [
          signatureObj.buyer as Address,
          BigInt(signatureObj.tokenId),
          BigInt(signatureObj.price),
          BigInt(signatureObj.deadline),
          v,
          r,
          s,
        ],
      });
    } catch (error) {
      console.error('Whitelist buy error:', error);
      alert('Invalid signature or transaction failed');
    }
  };

  // Approve market to spend tokens
  const handleApproveToken = async (amount: string) => {
    if (!amount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
        abi: MyERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.NFTMarket as `0x${string}`, parseUnits(amount, 18)],
      });
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  // Approve market to transfer NFT
  const handleApproveNFT = async (tokenId: string) => {
    if (!tokenId) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
        abi: MyNFT_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.NFTMarket as `0x${string}`, BigInt(tokenId)],
      });
    } catch (error) {
      console.error('Approve NFT error:', error);
    }
  };

  // View listing
  const handleViewListing = (e: React.FormEvent) => {
    e.preventDefault();
    refetchListing();
  };

  if (!isConnected) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">NFT Market</h1>
          <p className="text-lg text-gray-600">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NFT Marketplace</h1>
          {isMarketOwner && (
            <span className="px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg">
              👑 Market Owner
            </span>
          )}
        </div>

        {/* Whitelist Signature Generator (Owner Only) */}
        {isMarketOwner && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">🔐 Whitelist Signature Generator</h2>
              <span className="ml-3 px-3 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full">
                OWNER ONLY
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Generate EIP-712 signatures to whitelist specific buyers for NFT purchases.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token ID to Whitelist
                </label>
                <input
                  type="number"
                  value={whitelistTokenId}
                  onChange={(e) => setWhitelistTokenId(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <button
                onClick={handleGenerateSignature}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-yellow-700 hover:to-orange-700 font-semibold"
              >
                🔐 Generate Whitelist Signature
              </button>
              {whitelistSignature && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Signature (Copy & Share)
                  </label>
                  <textarea
                    value={whitelistSignature}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs h-40"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(whitelistSignature);
                      alert('✅ Signature copied to clipboard!');
                    }}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Whitelist Buy Section (EIP-712) */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🎫 Whitelist Buy</h2>
            <span className="ml-3 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
              EIP-712
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Purchase NFTs with a whitelist signature from the market owner (for exclusive/presale events).
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID to Buy
              </label>
              <input
                type="number"
                value={whitelistTokenId}
                onChange={(e) => setWhitelistTokenId(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Whitelist Signature (Paste from Owner)
              </label>
              <textarea
                value={whitelistSignature}
                onChange={(e) => setWhitelistSignature(e.target.value)}
                placeholder='{"buyer":"0x...","tokenId":"1","price":"...","deadline":"...","signature":"0x..."}'
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs h-32 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleWhitelistBuy}
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-400 font-semibold"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : '🎫 Buy with Whitelist Signature'}
            </button>
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-xs text-green-800">
              <strong>💡 How it works:</strong> The market owner generates a signature that whitelists your 
              address to purchase a specific NFT. This is perfect for presales, VIP access, or gated sales!
            </p>
          </div>
        </div>

        {/* View Listing */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">View Listing</h2>
          <form onSubmit={handleViewListing} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={viewTokenId}
                  onChange={(e) => setViewTokenId(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          </form>
          {listingInfo && listingInfo.isListed && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Seller:</strong> <code className="text-xs">{listingInfo.seller}</code>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Price:</strong> {formatUnits(listingInfo.price, 18)} MERC20
              </p>
            </div>
          )}
          {listingInfo && !listingInfo.isListed && viewTokenId && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">This NFT is not currently listed for sale.</p>
            </div>
          )}
        </div>

        {/* List NFT */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">List Your NFT</h2>
          <form onSubmit={handleList} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID
              </label>
              <input
                type="number"
                value={listTokenId}
                onChange={(e) => setListTokenId(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (MERC20)
              </label>
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleApproveNFT(listTokenId)}
                disabled={isPending || isConfirming}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                1. Approve NFT
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                2. List
              </button>
            </div>
          </form>
        </div>

        {/* Buy NFT (Traditional) */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buy NFT (Traditional)</h2>
          <form onSubmit={handleBuy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID to Buy
              </label>
              <input
                type="number"
                value={buyTokenId}
                onChange={(e) => setBuyTokenId(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  if (listingInfo && listingInfo.tokenId.toString() === buyTokenId) {
                    handleApproveToken(formatUnits(listingInfo.price, 18));
                  } else {
                    alert('Please view the listing first to see the price');
                  }
                }}
                disabled={isPending || isConfirming}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                1. Approve Token
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                2. Buy
              </button>
            </div>
          </form>
        </div>

        {/* Transaction Status */}
        {isConfirmed && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ Transaction confirmed!</p>
            {hash && (
              <p className="text-sm text-green-600 mt-1 break-all">
                Hash: {hash}
              </p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Methods</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong className="text-green-600">🎫 Whitelist Buy (EIP-712):</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Get whitelist signature from market owner</li>
                <li>Perfect for presales, VIP access, gated sales</li>
                <li>Signature verifies you're authorized to buy</li>
                <li>Still requires token approval first</li>
              </ul>
            </div>
            <div>
              <strong className="text-indigo-600">Traditional Buy:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>View listing to see price</li>
                <li>Approve tokens for the price amount</li>
                <li>Complete purchase</li>
              </ul>
            </div>
            <div>
              <strong className="text-purple-600">Listing:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Approve NFT for marketplace</li>
                <li>Set price and list</li>
                <li>Can cancel anytime before sale</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
