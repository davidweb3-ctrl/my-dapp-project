'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData, useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES, NFTMarket_ABI, MyNFT_ABI, MyERC20_ABI } from '../../utils/contracts';
import { formatUnits, parseUnits, Address } from 'viem';
import { publicClient } from '../../utils/viemClient';

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
  const [whitelistBuyerAddress, setWhitelistBuyerAddress] = useState('');
  const [nftApprovalStatus, setNftApprovalStatus] = useState<boolean | null>(null);
  const [showApprovalStatus, setShowApprovalStatus] = useState(false);
  const [whitelistSignature, setWhitelistSignature] = useState('');
  const [showSignatureGenerator, setShowSignatureGenerator] = useState(false);
  const [lastAction, setLastAction] = useState<'list' | 'buy' | 'permitBuy' | 'approveNFT' | 'approveToken' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, isError: writeError, error: writeErrorMsg } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: receiptError, error: receiptErrorMsg } = useWaitForTransactionReceipt({ hash });
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

  // Clear errors and reset state when wallet address changes or disconnects
  useEffect(() => {
    setErrorMessage(null);
    setLastAction(null);
    setWhitelistSignature('');
    setWhitelistTokenId('');
    setWhitelistBuyerAddress('');
    setNftApprovalStatus(null);
    setShowApprovalStatus(false);
  }, [address, isConnected]);

  // Update approval status when token ID changes
  useEffect(() => {
    updateApprovalStatus(listTokenId);
  }, [listTokenId, address]);

  // Update approval status when NFT approval transaction is confirmed
  useEffect(() => {
    if (isConfirmed && lastAction === 'approveNFT' && listTokenId) {
      // Wait a bit for the blockchain state to update, then recheck
      setTimeout(() => {
        updateApprovalStatus(listTokenId, true); // Force show after approval
      }, 1000);
    }
  }, [isConfirmed, lastAction, listTokenId]);

  // Clear error messages when transaction is successful
  useEffect(() => {
    if (isConfirmed && lastAction) {
      setErrorMessage(null); // Clear any error messages on success
    }
  }, [isConfirmed, lastAction]);

  // Handle write contract errors
  useEffect(() => {
    if (writeError && writeErrorMsg) {
      console.error('Write contract error:', writeErrorMsg);
      let errorMsg = 'Transaction failed: ';
      
      if (writeErrorMsg.message) {
        if (writeErrorMsg.message.includes('Nonce too high')) {
          errorMsg += 'Nonce too high. Please reset your wallet or try again.';
        } else if (writeErrorMsg.message.includes('insufficient funds')) {
          errorMsg += 'Insufficient funds for gas or transaction.';
        } else if (writeErrorMsg.message.includes('user rejected')) {
          errorMsg += 'Transaction was rejected by user.';
        } else if (writeErrorMsg.message.includes('execution reverted')) {
          errorMsg += 'Contract execution failed. Check if the NFT is listed and you have sufficient tokens.';
        } else {
          errorMsg += writeErrorMsg.message;
        }
      } else {
        errorMsg += 'Unknown error occurred.';
      }
      
      setErrorMessage(errorMsg);
      setLastAction(null);
    }
  }, [writeError, writeErrorMsg]);

  // Handle transaction receipt errors
  useEffect(() => {
    if (receiptError && receiptErrorMsg) {
      console.error('Transaction receipt error:', receiptErrorMsg);
      setErrorMessage('Transaction failed to confirm. Please check the transaction status.');
      setLastAction(null);
    }
  }, [receiptError, receiptErrorMsg]);

  // Check if NFT is approved for the market
  const checkNFTApproval = async (tokenId: string) => {
    try {
      // First check if the NFT exists and user owns it
      const owner = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MyNFT as Address,
        abi: MyNFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      });
      
      // If user doesn't own the NFT, return null (unknown state)
      if (owner !== address) {
        return null;
      }
      
      const approvedAddress = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MyNFT as Address,
        abi: MyNFT_ABI,
        functionName: 'getApproved',
        args: [BigInt(tokenId)],
      });
      
      const isApprovedForAll = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MyNFT as Address,
        abi: MyNFT_ABI,
        functionName: 'isApprovedForAll',
        args: [address as Address, CONTRACT_ADDRESSES.NFTMarket as Address],
      });
      
      return approvedAddress === CONTRACT_ADDRESSES.NFTMarket || (isApprovedForAll as boolean);
    } catch (error) {
      console.error('Error checking NFT approval:', error);
      return null; // Return null for unknown state instead of false
    }
  };

  // Update NFT approval status when token ID changes
  const updateApprovalStatus = async (tokenId: string, forceShow: boolean = false) => {
    if (!tokenId || !address) {
      setNftApprovalStatus(null);
      setShowApprovalStatus(false);
      return;
    }
    
    try {
      const isApproved = await checkNFTApproval(tokenId);
      setNftApprovalStatus(isApproved);
      
      // Only show status if:
      // 1. Force show is true (after approval transaction)
      // 2. User tried to list but NFT is not approved
      // 3. User doesn't own the NFT
      if (forceShow || isApproved === false || isApproved === null) {
        setShowApprovalStatus(true);
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      setNftApprovalStatus(null);
      setShowApprovalStatus(false);
    }
  };

  // Handle list NFT
  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTokenId || !listPrice) return;

    setErrorMessage(null); // Clear previous errors
    setLastAction('list');
    
    // Check if NFT is approved before attempting to list
    const isApproved = await checkNFTApproval(listTokenId);
    if (isApproved === null) {
      setErrorMessage('❌ You don\'t own this NFT or it doesn\'t exist. Please check the Token ID.');
      setShowApprovalStatus(true); // Show status after error
      return;
    }
    if (isApproved === false) {
      setErrorMessage('❌ NFT not approved! Please click "1. Approve NFT" first to authorize the marketplace to transfer your NFT.');
      setShowApprovalStatus(true); // Show status after error
      return;
    }
    
    writeContract({
      address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
      abi: NFTMarket_ABI,
      functionName: 'list',
      args: [BigInt(listTokenId), parseUnits(listPrice, 18)],
    });
  };

  // Handle traditional buy
  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyTokenId) return;

    setErrorMessage(null); // Clear previous errors
    setLastAction('buy');
    writeContract({
      address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
      abi: NFTMarket_ABI,
      functionName: 'buyNFT',
      args: [BigInt(buyTokenId)],
    });
  };
  

  // Generate whitelist signature (Market Owner only)
  const handleGenerateSignature = async () => {
    if (!isMarketOwner || !whitelistTokenId || !whitelistBuyerAddress) {
      alert('You must be the market owner and enter both token ID and buyer address');
      return;
    }

    // Validate buyer address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(whitelistBuyerAddress)) {
      alert('Please enter a valid Ethereum address (0x...)');
      return;
    }

    try {
      const tokenId = BigInt(whitelistTokenId);
      const buyer = whitelistBuyerAddress as Address;
      
      // Get the actual listing price for the token
      let price: bigint;
      if (listingInfo && listingInfo.tokenId.toString() === whitelistTokenId) {
        price = listingInfo.price;
      } else {
        // If no listing info available, fetch it from the contract
        try {
          const listingResponse = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.NFTMarket as Address,
            abi: NFTMarket_ABI,
            functionName: 'getListing',
            args: [tokenId],
          });
          const [seller, listingPrice, isListed] = listingResponse as [string, bigint, boolean];
          if (!isListed) {
            alert('This NFT is not listed for sale. Please list it first or use a different Token ID.');
            return;
          }
          price = listingPrice;
        } catch (error) {
          alert('Failed to fetch listing information. Please make sure the NFT is listed.');
          return;
        }
      }
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
          buyer: buyer,
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
    // Clear previous errors
    setErrorMessage(null);
    
    if (!whitelistTokenId || !whitelistSignature || !address) {
      setErrorMessage('Please enter token ID and paste the whitelist signature');
      return;
    }

    try {
      const signatureObj = JSON.parse(whitelistSignature);
      
      // Verify buyer address matches
      if (signatureObj.buyer.toLowerCase() !== address.toLowerCase()) {
        setErrorMessage('This signature is not for your address!');
        return;
      }

      // Validate signature format
      if (!signatureObj.signature || !signatureObj.tokenId || !signatureObj.price || !signatureObj.deadline) {
        setErrorMessage('Invalid signature format. Please check the signature data.');
        return;
      }

      // Check if signature is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (parseInt(signatureObj.deadline) < currentTime) {
        setErrorMessage('Signature has expired. Please get a new signature from the market owner.');
        return;
      }

      // Split signature into v, r, s
      const signature = signatureObj.signature;
      if (signature.length !== 132) {
        setErrorMessage('Invalid signature length. Please check the signature data.');
        return;
      }

      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);

      // Call permitBuy
      setLastAction('permitBuy');
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
    } catch (error: any) {
      // Only handle JSON parsing and validation errors here
      // Transaction errors are handled by global error handler
      console.error('Whitelist buy validation error:', error);
      setErrorMessage('Invalid signature data. Please check the signature format.');
      setLastAction(null);
    }
  };

  // Approve market to spend tokens
  const handleApproveToken = async (amount: string) => {
    if (!amount) return;

    setErrorMessage(null); // Clear previous errors
    setLastAction('approveToken');
    writeContract({
      address: CONTRACT_ADDRESSES.MyERC20 as `0x${string}`,
      abi: MyERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.NFTMarket as `0x${string}`, parseUnits(amount, 18)],
    });
  };

  // Approve market to transfer NFT
  const handleApproveNFT = async (tokenId: string) => {
    if (!tokenId) return;

    setErrorMessage(null); // Clear previous errors
    setLastAction('approveNFT');
    writeContract({
      address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
      abi: MyNFT_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.NFTMarket as `0x${string}`, BigInt(tokenId)],
    });
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

        {/* Global Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">❌</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Transaction Failed</h3>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                <div className="mt-3">
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>💡 How to use:</strong> Enter a Token ID and the buyer's Ethereum address to generate a whitelist signature. 
                The signature will automatically fetch the correct listing price and authorize the specified buyer to purchase that NFT.
                <br/><strong>Note:</strong> The NFT must be listed for sale first.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token ID to Whitelist
                </label>
                <input
                  type="number"
                  value={whitelistTokenId}
                  onChange={(e) => setWhitelistTokenId(e.target.value)}
                  placeholder="Enter Token ID (e.g., 1, 2, 3...)"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can whitelist any Token ID, but the NFT must be listed for sale first.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Address to Whitelist
                </label>
                <input
                  type="text"
                  value={whitelistBuyerAddress}
                  onChange={(e) => setWhitelistBuyerAddress(e.target.value)}
                  placeholder="0x1234567890123456789012345678901234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Ethereum address of the buyer you want to whitelist.
                </p>
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
          
          {/* Success Message */}
          {isConfirmed && lastAction === 'permitBuy' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-bold">✅ Whitelist Purchase Confirmed!</p>
              {hash && (
                <p className="text-sm text-green-600 mt-1 break-all">
                  Hash: {hash}
                </p>
              )}
            </div>
          )}
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
              {/* NFT Approval Status */}
              {listTokenId && showApprovalStatus && nftApprovalStatus !== null && (
                <div className="mt-2">
                  {nftApprovalStatus === true ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <span className="mr-2">✅</span>
                      <span>NFT is approved for marketplace</span>
                    </div>
                  ) : nftApprovalStatus === false ? (
                    <div className="flex items-center text-red-600 text-sm">
                      <span className="mr-2">❌</span>
                      <span>NFT not approved - Click "1. Approve NFT" first</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600 text-sm">
                      <span className="mr-2">⚠️</span>
                      <span>You don't own this NFT or it doesn't exist</span>
                    </div>
                  )}
                </div>
              )}
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
                disabled={isPending || isConfirming || (!!listTokenId && nftApprovalStatus === false)}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  (listTokenId && nftApprovalStatus === false)
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                }`}
              >
                2. List
              </button>
            </div>
          </form>
          {isConfirmed && (lastAction === 'list' || lastAction === 'approveNFT') && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-bold">
                ✅ {lastAction === 'approveNFT' ? 'NFT Approval' : 'Listing'} Confirmed!
              </p>
              {hash && (
                <p className="text-sm text-green-600 mt-1 break-all">
                  Hash: {hash}
                </p>
              )}
            </div>
          )}
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
          {isConfirmed && (lastAction === 'buy' || lastAction === 'approveToken') && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-bold">
                ✅ {lastAction === 'approveToken' ? 'Token Approval' : 'Purchase'} Confirmed!
              </p>
              {hash && (
                <p className="text-sm text-green-600 mt-1 break-all">
                  Hash: {hash}
                </p>
              )}
            </div>
          )}
        </div>

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
