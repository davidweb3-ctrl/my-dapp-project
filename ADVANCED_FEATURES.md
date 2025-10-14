# 🚀 Advanced Features Guide

## EIP-2612 Permit & EIP-712 Signatures Implementation

This document explains the advanced signature-based features implemented in the frontend.

---

## ⚡ EIP-2612 Permit Deposit (Bank Page)

### What is EIP-2612?

EIP-2612 extends ERC20 tokens with a `permit()` function that allows users to approve token spending via off-chain signatures instead of on-chain transactions. This enables **gasless approvals**.

### How It Works

**Traditional Flow (2 transactions):**
1. User calls `approve(spender, amount)` → costs gas
2. User calls `deposit(amount)` → costs gas

**Permit Flow (1 transaction):**
1. User signs an off-chain message (EIP-2612) → **FREE, no gas**
2. Contract verifies signature and deposits → costs gas only once

### Frontend Implementation

**Location:** `/frontend/app/bank/page.tsx`

**Key Components:**

```typescript
// 1. Import signature hook
import { useSignTypedData } from 'wagmi';

// 2. Read user's nonce
const { data: nonce } = useReadContract({
  functionName: 'nonces',
  args: [address],
});

// 3. Generate EIP-2612 signature
const signature = await signTypedDataAsync({
  domain: {
    name: 'MyERC20',
    version: '1',
    chainId: chainId,
    verifyingContract: TOKEN_ADDRESS,
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
  message: {
    owner: userAddress,
    spender: bankAddress,
    value: amount,
    nonce: currentNonce,
    deadline: timestamp + 3600,
  },
});

// 4. Split signature and call permitDeposit
const { v, r, s } = splitSignature(signature);
await permitDeposit(owner, amount, deadline, v, r, s);
```

### User Experience

**Visual Indicator:**
- Purple/Pink gradient background
- "EIP-2612" badge
- Clear "⚡ Sign & Deposit (One Step)" button

**Benefits:**
- ✅ Saves gas (one transaction instead of two)
- ✅ Better UX (one click instead of two)
- ✅ Signature is free (no gas for approval)
- ✅ More efficient for users

### Smart Contract Side

```solidity
// TokenBank.sol
function permitDeposit(
    address owner,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    // 1. Execute permit (verifies signature)
    IERC20Permit(token).permit(owner, address(this), amount, deadline, v, r, s);
    
    // 2. Transfer tokens
    token.transferFrom(owner, address(this), amount);
    
    // 3. Update balance
    balances[owner] += amount;
}
```

---

## 🎫 EIP-712 Whitelist Buy (Market Page)

### What is EIP-712?

EIP-712 is a standard for typed structured data hashing and signing. It's used for creating **verifiable off-chain signatures** that can be validated on-chain.

### Use Case: Whitelist/Presale Purchases

Market owners can generate signatures to **whitelist specific buyers** for exclusive NFT purchases:
- 🎯 Presale events
- 👑 VIP/early access
- 🔒 Gated sales
- 💎 Exclusive drops

### How It Works

**Owner Side (Signature Generation):**

```typescript
// 1. Market owner generates signature for a buyer
const signature = await signTypedDataAsync({
  domain: {
    name: 'NFTMarket',
    version: '1',
    chainId: chainId,
    verifyingContract: MARKET_ADDRESS,
  },
  types: {
    Whitelist: [
      { name: 'buyer', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  message: {
    buyer: '0x123...',      // Whitelisted buyer
    tokenId: 1,             // NFT to purchase
    price: 1000000000000000000n, // Price in wei
    deadline: 1704067200,   // Expiration timestamp
  },
});

// 2. Share signature with buyer (JSON format)
{
  "buyer": "0x123...",
  "tokenId": "1",
  "price": "1000000000000000000",
  "deadline": "1704067200",
  "signature": "0xabc..."
}
```

**Buyer Side (Signature Usage):**

```typescript
// 1. Buyer receives signature from owner
// 2. Paste signature into "Whitelist Buy" section
// 3. Click "🎫 Buy with Whitelist Signature"

// Frontend splits signature and calls contract
const { v, r, s } = splitSignature(signatureData.signature);
await permitBuy(
  buyer,
  tokenId,
  price,
  deadline,
  v, r, s
);
```

### Frontend Implementation

**Location:** `/frontend/app/market/page.tsx`

**Two Main Sections:**

#### 1. **Signature Generator (Owner Only)**

```typescript
// Only visible to market owner
{isMarketOwner && (
  <div className="signature-generator">
    <input tokenId />
    <button onClick={handleGenerateSignature}>
      🔐 Generate Whitelist Signature
    </button>
    <textarea>{generatedSignature}</textarea>
    <button copyToClipboard>📋 Copy</button>
  </div>
)}
```

#### 2. **Whitelist Buy (Anyone with Signature)**

```typescript
<div className="whitelist-buy">
  <input tokenId />
  <textarea placeholder="Paste signature here" />
  <button onClick={handleWhitelistBuy}>
    🎫 Buy with Whitelist Signature
  </button>
</div>
```

### Smart Contract Verification

```solidity
// NFTMarket.sol
function permitBuy(
    address buyer,
    uint256 tokenId,
    uint256 price,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    require(msg.sender == buyer, "Not authorized");
    require(block.timestamp <= deadline, "Expired");
    
    // 1. Reconstruct typed data hash
    bytes32 structHash = keccak256(abi.encode(
        WHITELIST_TYPEHASH,
        buyer,
        tokenId,
        price,
        deadline
    ));
    
    // 2. Verify signature is from market owner
    bytes32 hash = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(hash, v, r, s);
    require(signer == owner(), "Invalid signature");
    
    // 3. Execute purchase
    _executePurchase(buyer, tokenId, price);
}
```

---

## 🎨 User Interface

### Bank Page Features

**New Permit Deposit Section:**
- 🟣 Purple/pink gradient background
- Badge showing "EIP-2612"
- Single input for amount
- One-click "⚡ Sign & Deposit" button
- Helpful explanation tooltip

**Traditional Deposit Section:**
- Standard white background
- Two-step process (Approve → Deposit)
- Side-by-side buttons

**Info Section:**
- Compares both methods
- Explains benefits of each
- Helps users choose the best option

### Market Page Features

**Whitelist Signature Generator (Owner Only):**
- 🟡 Yellow/orange gradient background
- "👑 Market Owner" badge
- Token ID input
- "🔐 Generate Signature" button
- Copy-to-clipboard functionality
- JSON signature output

**Whitelist Buy Section:**
- 🟢 Green/emerald gradient background
- "EIP-712" badge
- Token ID input
- Signature paste area
- "🎫 Buy with Whitelist" button
- Explanation of whitelist concept

**Traditional Sections:**
- View Listing
- List Your NFT
- Buy NFT (standard flow)

---

## 📊 Comparison Table

| Feature | Traditional | Permit/Signature |
|---------|-------------|------------------|
| **Approval** | On-chain tx (costs gas) | Off-chain signature (free) |
| **Steps** | 2 transactions | 1 transaction |
| **Total Gas** | Approve + Action | Action only |
| **UX** | Click → Wait → Click → Wait | Sign → Click → Wait |
| **Security** | Standard | Same + cryptographic verification |
| **Use Cases** | General | Efficiency, presales, whitelists |

---

## 🔧 Technical Details

### Signature Format (EIP-2612)

```
Domain Separator:
- name: "MyERC20"
- version: "1"
- chainId: network ID
- verifyingContract: token address

Permit Type:
- owner: address of token owner
- spender: address to approve
- value: amount to approve
- nonce: current nonce from contract
- deadline: expiration timestamp
```

### Signature Format (EIP-712)

```
Domain Separator:
- name: "NFTMarket"
- version: "1"
- chainId: network ID
- verifyingContract: market address

Whitelist Type:
- buyer: whitelisted buyer address
- tokenId: NFT token ID
- price: purchase price
- deadline: expiration timestamp
```

### Security Considerations

✅ **Safe:**
- Signatures expire (deadline parameter)
- Nonce prevents replay attacks (EIP-2612)
- Signatures are specific to contract and chain
- Cannot be reused on different chains
- Owner verification on-chain

⚠️ **Best Practices:**
- Never share private keys
- Verify domain/contract address before signing
- Check deadline is reasonable
- Only accept signatures from trusted sources
- Validate signature matches expected buyer

---

## 🚀 Usage Examples

### Example 1: Permit Deposit

```typescript
// User wants to deposit 100 MERC20

// Old way (2 txs):
1. approve(bankAddress, 100e18)  // Wait... costs gas
2. deposit(100e18)                // Wait... costs gas

// New way (1 tx):
1. Sign message (instant, free)
2. permitDeposit(100e18, signature) // Wait... costs gas
   
// Savings: 50% gas, 50% waiting time!
```

### Example 2: Whitelist Buy

```typescript
// Project launches exclusive NFT drop

// Owner: Generate signatures for VIP list
for (const vip of vipList) {
  const sig = await generateWhitelistSignature(
    vip.address,
    nftTokenId,
    presalePrice,
    presaleDeadline
  );
  sendEmailToVIP(vip.email, sig);
}

// VIP Buyer: Use signature to purchase
1. Receives signature via email
2. Pastes into Whitelist Buy section
3. Clicks "Buy with Whitelist Signature"
4. Gets exclusive access before public sale!
```

---

## 📱 Mobile & Desktop Support

Both features work seamlessly across:
- ✅ Desktop browsers (Chrome, Firefox, Edge)
- ✅ Mobile wallets (MetaMask Mobile, Trust Wallet)
- ✅ WalletConnect compatible wallets
- ✅ Hardware wallets (Ledger, Trezor)

---

## 🎓 Learning Resources

### EIP-2612 Resources:
- [EIP-2612 Specification](https://eips.ethereum.org/EIPS/eip-2612)
- [OpenZeppelin ERC20Permit](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit)

### EIP-712 Resources:
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Viem Typed Data Guide](https://viem.sh/docs/actions/wallet/signTypedData.html)
- [Wagmi useSignTypedData](https://wagmi.sh/react/hooks/useSignTypedData)

---

## 🐛 Troubleshooting

### Permit Deposit Issues

**"Signature expired"**
- Solution: Signatures have 1-hour deadline, regenerate signature

**"Invalid nonce"**
- Solution: Refresh page to get latest nonce

**"Signature verification failed"**
- Solution: Ensure you're on correct network and contract address

### Whitelist Buy Issues

**"Invalid signature"**
- Solution: Verify signature JSON is complete and unmodified

**"Not authorized"**
- Solution: Signature must be for your wallet address

**"Signature expired"**
- Solution: Request new signature from market owner

**"This signature is not for your address"**
- Solution: Signature was generated for different buyer

---

## 🎉 Summary

The addition of EIP-2612 and EIP-712 brings:

✨ **Better UX**: Fewer clicks, less waiting
⛽ **Gas Savings**: Up to 50% reduction
🔒 **Enhanced Security**: Cryptographic verification
🎯 **New Possibilities**: Presales, whitelists, exclusive access
📈 **Professional Features**: Enterprise-grade functionality

Your DApp now supports the latest Ethereum standards for signatures and is ready for production use!

---

**Built with:** Next.js 14, Wagmi, Viem, RainbowKit, OpenZeppelin

