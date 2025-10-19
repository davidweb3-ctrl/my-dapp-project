# 🚀 My DApp - Full-Stack Blockchain Application

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Foundry](https://img.shields.io/badge/Foundry-Latest-orange)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange)
![License](https://img.shields.io/badge/License-MIT-green)

A production-ready decentralized application featuring ERC20 tokens, NFT collection, token banking system, and NFT marketplace with whitelist functionality.

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-documentation)

</div>

---

## 📖 Project Overview

This is a comprehensive full-stack DApp that demonstrates modern blockchain development practices:

### Smart Contracts (Solidity + Foundry)
- **MyERC20**: ERC20 token with EIP-2612 permit signatures for gasless approvals
- **TokenBank**: Secure token deposit/withdrawal system with permit support
- **MyNFT**: ERC721 NFT collection with metadata URI storage
- **NFTMarket**: NFT marketplace using ERC20 tokens with EIP-712 whitelist signatures

### Frontend (Next.js + Wagmi + Viem)
- Modern Web3 interface with RainbowKit wallet connection
- Responsive design with TailwindCSS
- Type-safe contract interactions with TypeScript
- Real-time blockchain data updates

---

## ✨ Features

### 🪙 Token Management (MyERC20)
- ✅ ERC20 standard implementation
- ✅ 100,000,000 MERC20 total supply
- ✅ Transfer tokens between addresses
- ✅ Approve and manage spending allowances
- ✅ **EIP-2612 Permit**: Gasless approvals via signatures

### 🏦 Token Banking (TokenBank)
- ✅ Deposit tokens to earn (future: interest)
- ✅ Withdraw tokens anytime
- ✅ Track individual user balances
- ✅ **EIP-2612 Permit**: Gasless deposits with ERC20 permit signatures
- ✅ **Permit2 Integration**: Advanced gasless deposits with universal token approval
- ✅ **Batch Deposits**: Multiple deposits with single signature authorization
- ✅ **Real-time Balance Updates**: Automatic balance refresh after transactions
- ✅ **Comprehensive Error Handling**: User-friendly error messages and retry mechanisms

### 🎨 NFT Collection (MyNFT)
- ✅ ERC721 standard with URI storage
- ✅ Owner-controlled minting
- ✅ Metadata URI support (IPFS ready)
- ✅ Auto-incrementing token IDs

### 🛒 NFT Marketplace (NFTMarket)
- ✅ List NFTs for sale with ERC20 pricing
- ✅ Buy NFTs with token payments
- ✅ Cancel listings
- ✅ **EIP-712 Whitelist**: Signature-based access control for exclusive sales

---

## 🛠 Environment Dependencies

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | Latest | Smart contract development & testing |
| [Node.js](https://nodejs.org/) | 18+ | Frontend development |
| [pnpm](https://pnpm.io/) | Latest | Package management |
| [Git](https://git-scm.com/) | Latest | Version control |
| [MetaMask](https://metamask.io/) | Browser Extension | Wallet for testing |

### Install Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
anvil --version
```

### Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version  # Should be v18.x or higher

# Install pnpm
npm install -g pnpm
pnpm --version
```

### Why pnpm?

This project uses **pnpm** as the package manager for several advantages:

- 🚀 **Faster**: Up to 2x faster than npm/yarn
- 💾 **Disk Efficient**: Uses hard links to avoid duplicate packages
- 🔒 **Strict**: Better dependency resolution and security
- 📦 **Monorepo Ready**: Excellent workspace support
- 🎯 **Compatible**: Drop-in replacement for npm commands

**Alternative installation methods:**
```bash
# Using Homebrew (macOS)
brew install pnpm

# Using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Using npm (as shown above)
npm install -g pnpm
```

---

## 📦 Installation & Build

### 1. Clone or Navigate to Project

```bash
cd /Users/xiadawei/codeSpace/decert/my-dapp-project
```

### 2. Install Smart Contract Dependencies

```bash
# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts

# Verify lib directory
ls lib/
```

### 3. Configure Foundry

Create or update `foundry.toml`:

```toml
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200

remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/"
]

[rpc_endpoints]
localhost = "http://127.0.0.1:8545"
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

### 4. Compile Smart Contracts

```bash
# Compile all contracts
forge build

# Should output: Compiler run successful!

# Check compiled artifacts
ls out/
```

### 5. Run Contract Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testTransfer

# Check coverage
forge coverage
```

### 6. Install Frontend Dependencies

```bash
cd frontend

# Install packages with pnpm
pnpm install

# Verify installation
ls node_modules/
```

---

## 🚀 Deployment

### Local Deployment (Development)

#### Step 1: Start Local Blockchain

```bash
# Terminal 1: Start Anvil (Foundry's local node)
anvil

# Anvil will display:
# - 10 test accounts with private keys
# - RPC URL: http://127.0.0.1:8545
# - Chain ID: 31337
```

#### Step 2: Create Deployment Script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MyNFT} from "../contracts/MyNFT.sol";
import {NFTMarket} from "../contracts/NFTMarket.sol";
import {MockPermit2} from "../contracts/mocks/MockPermit2.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MyERC20
        MyERC20 token = new MyERC20();
        console.log("MyERC20 deployed at:", address(token));

        // 2. Deploy MockPermit2 (for testing)
        MockPermit2 permit2 = new MockPermit2();
        console.log("MockPermit2 deployed at:", address(permit2));

        // 3. Deploy TokenBank with Permit2 support
        TokenBank bank = new TokenBank(address(token), address(permit2));
        console.log("TokenBank deployed at:", address(bank));

        // 4. Deploy MyNFT
        MyNFT nft = new MyNFT();
        console.log("MyNFT deployed at:", address(nft));

        // 5. Deploy NFTMarket
        NFTMarket market = new NFTMarket(address(token), address(nft));
        console.log("NFTMarket deployed at:", address(market));

        vm.stopBroadcast();
    }
}
```

#### Step 3: Deploy Contracts

```bash
# Terminal 2: Deploy to local network
# Using first Anvil account
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Save the deployed addresses!
# Example output:
# MyERC20 deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# MockPermit2 deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
# TokenBank deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
# MyNFT deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
# NFTMarket deployed at: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
```

#### Step 4: Update Frontend Configuration

Edit `frontend/utils/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  MyERC20: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TokenBank: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // Updated with Permit2 support
  MyNFT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  NFTMarket: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  MockPermit2: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // MockPermit2 for testing
} as const;
```

### Testnet Deployment (Sepolia)

#### Step 1: Setup Environment Variables

Create `.env` file:

```bash
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Step 2: Deploy to Sepolia

```bash
# Load environment variables
source .env

# Deploy and verify
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Contracts will be verified on Etherscan automatically
```

---

## 🔐 Permit2 Integration Details

### What is Permit2?

Permit2 is a universal token approval standard developed by Uniswap that allows for more efficient and secure token approvals. Unlike traditional ERC20 approvals, Permit2 enables:

- **Gasless Approvals**: Sign messages instead of paying gas for approvals
- **Universal Approvals**: One approval for multiple contracts
- **Batch Operations**: Multiple operations with a single signature
- **Better Security**: Time-limited and amount-limited approvals

### TokenBank Permit2 Features

#### 🚀 **Single Deposit with Permit2**
```typescript
// User signs a message authorizing the deposit
const signature = await signTypedDataAsync({
  domain: permit2Domain,
  types: permit2Types,
  primaryType: 'PermitTransferFrom',
  message: {
    permitted: { token: tokenAddress, amount: depositAmount },
    spender: bankAddress,
    nonce: currentNonce,
    deadline: expirationTime
  }
});

// Single transaction: signature + deposit
await writeContract({
  address: bankAddress,
  abi: TokenBank_ABI,
  functionName: 'depositWithPermit2',
  args: [owner, amount, expiration, nonce, v, r, s]
});
```

#### 📦 **Batch Deposits**
```typescript
// Multiple amounts with single signature
const batchItems = [
  { amount: parseUnits('100', 18) },
  { amount: parseUnits('200', 18) },
  { amount: parseUnits('300', 18) }
];

// Single signature for all deposits
const totalAmount = batchItems.reduce((sum, item) => sum + item.amount, 0n);
// ... sign and execute
```

#### 🔄 **User Experience Flow**
1. **Select Method**: Choose between Traditional, Permit2, or Batch Permit2
2. **Enter Amount**: Input deposit amount(s)
3. **Sign Message**: Sign EIP-712 message (no gas cost)
4. **Execute Deposit**: Single transaction with signature
5. **Auto Update**: Balances refresh automatically

#### 🛡️ **Security Features**
- **Nonce Management**: Prevents replay attacks
- **Expiration**: Time-limited approvals
- **Amount Limits**: Precise amount control
- **Signature Verification**: EIP-712 standard compliance

### Frontend Components

#### **DepositTypeSelector**
- Traditional deposit (approve + deposit)
- Permit2 deposit (signature + deposit)
- Batch Permit2 (multiple amounts, one signature)

#### **Permit2DepositForm**
- Amount input with validation
- Balance checking
- Signature preparation
- Error handling

#### **BatchDepositForm**
- Multiple amount inputs
- Total calculation
- Batch signature generation
- Individual amount validation

#### **SignatureModal**
- EIP-712 message display
- Signature request UI
- User-friendly instructions
- Error feedback

### Technical Implementation

#### **Custom RPC Client**
```typescript
// Bypasses Wagmi auto-detection issues
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545', {
    batch: false,
    retryCount: 0,
    timeout: 10000,
  }),
});
```

#### **State Management**
```typescript
// Manual state management for balances
const [walletBalance, setWalletBalance] = useState<bigint>(0n);
const [bankBalance, setBankBalance] = useState<bigint>(0n);
const [permit2Nonce, setPermit2Nonce] = useState<bigint>(0n);

// Auto-refresh after transactions
useEffect(() => {
  if (isConfirmed && hash) {
    fetchBalances(); // Refresh all balances
    setSuccessMessage(SUCCESS_MESSAGES.PERMIT2_DEPOSIT);
  }
}, [isConfirmed, hash]);
```

#### **Error Handling**
```typescript
// Comprehensive error messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: 'Insufficient token balance',
  INVALID_AMOUNT: 'Invalid deposit amount',
  SIGNATURE_EXPIRED: 'Signature has expired',
  INVALID_NONCE: 'Invalid nonce value',
  PERMIT2_ERROR: 'Permit2 operation failed',
} as const;
```

---

## 🎮 Frontend Setup & Execution

### Configure Frontend

#### 1. Get WalletConnect Project ID

Visit [WalletConnect Cloud](https://cloud.walletconnect.com/) and create a free project.

Update `frontend/utils/wagmiConfig.ts`:

```typescript
export const config = getDefaultConfig({
  appName: 'My DApp',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // ← Replace this
  chains: [sepolia, hardhat],
  // ...
});
```

#### 2. Configure Network

For local development, `wagmiConfig.ts` is already set to use Hardhat/Anvil.

For testnet, update:

```typescript
export const config = getDefaultConfig({
  chains: [sepolia], // Remove hardhat for production
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/YOUR_INFURA_KEY'),
  },
  // ...
});
```

### Run Frontend Development Server

```bash
cd frontend

# Start development server with pnpm
pnpm dev
```

**Open browser**: http://localhost:3000

### Build for Production

```bash
# Build optimized production bundle
pnpm build

# Start production server
pnpm start

# Or export static site
pnpm build
pnpm export
```

---

## 🎯 Interaction Demo Guide

### Initial Setup

1. **Start Anvil**: Keep it running in a terminal
2. **Deploy Contracts**: Follow deployment steps above
3. **Run Frontend**: `cd frontend && pnpm dev`
4. **Open Browser**: http://localhost:3000

### Connect Wallet

1. Click **"Connect Wallet"** button in navigation
2. Select **MetaMask**
3. Switch to **Localhost 8545** network in MetaMask
4. Import Anvil test account:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
5. Approve connection

### Demo Flow

#### 1️⃣ Token Management
- Navigate to **Token** page
- See your balance (100M MERC20)
- Transfer tokens to another address
- Approve spending allowance

#### 2️⃣ Token Banking
- Navigate to **Bank** page
- **Traditional Deposit**:
  - Click **"Approve"** for desired amount
  - Click **"Deposit"** to deposit tokens
- **Permit2 Deposit** (Recommended):
  - Select **"Permit2"** deposit method
  - Enter deposit amount
  - Click **"Sign & Deposit"** for gasless transaction
  - Sign the EIP-712 message in MetaMask
- **Batch Deposit**:
  - Select **"Batch Permit2"** method
  - Enter multiple amounts
  - Single signature for all deposits
- View balances update automatically
- Try **"Withdraw"** to get tokens back

#### 3️⃣ NFT Minting
- Navigate to **NFT** page
- Enter recipient address
- Enter token URI (e.g., `ipfs://QmTest...`)
- Click **"Mint NFT"** (owner only)
- View token metadata

#### 4️⃣ NFT Trading
- Navigate to **Market** page
- **List NFT**:
  1. Approve NFT for market
  2. Set price and list
- **Buy NFT**:
  1. View listing
  2. Approve tokens
  3. Click Buy

---

## 🔧 Contract Interaction Commands

### Using Cast (Foundry CLI)

```bash
# Set variables
TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3
BANK=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NFT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
MARKET=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Check token balance
cast call $TOKEN "balanceOf(address)" $SENDER

# Transfer tokens
cast send $TOKEN "transfer(address,uint256)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  1000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Approve bank contract
cast send $TOKEN "approve(address,uint256)" \
  $BANK 1000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deposit to bank
cast send $BANK "deposit(uint256)" \
  1000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Check bank balance
cast call $BANK "balanceOf(address)" $SENDER

# Permit2 Deposit (Advanced)
# Note: This requires signature generation - use frontend for full experience
# The depositWithPermit2 function signature:
# depositWithPermit2(address owner, uint160 amount, uint48 expiration, uint48 nonce, uint8 v, bytes32 r, bytes32 s)

# Mint NFT (owner only)
cast send $NFT "mint(address,string)" \
  $SENDER "ipfs://QmTest..." \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Using Forge Scripts

Create `script/Interact.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {TokenBank} from "../contracts/TokenBank.sol";

contract InteractScript is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address token = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address bank = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
        
        vm.startBroadcast(privateKey);

        MyERC20 myToken = MyERC20(token);
        TokenBank myBank = TokenBank(bank);

        // Check balance
        uint256 balance = myToken.balanceOf(msg.sender);
        console.log("Token balance:", balance);

        // Approve and deposit
        uint256 amount = 1000 * 10**18;
        myToken.approve(bank, amount);
        myBank.deposit(amount);
        
        console.log("Deposited:", amount);

        vm.stopBroadcast();
    }
}
```

Run the script:

```bash
forge script script/Interact.s.sol:InteractScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

---

## 🐛 Troubleshooting & Common Errors

### Contract Compilation Issues

#### Error: `Compiler not found`
```bash
# Solution: Install solc version
forge install

# Or specify version
solc-select install 0.8.20
solc-select use 0.8.20
```

#### Error: `Could not find @openzeppelin`
```bash
# Solution: Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts

# Verify remappings in foundry.toml
forge remappings
```

### Deployment Issues

#### Error: `Invalid RPC URL`
```bash
# Solution: Check Anvil is running
anvil

# Or check RPC URL format
echo $SEPOLIA_RPC_URL
```

#### Error: `Insufficient funds for gas`
```bash
# Solution: 
# 1. For Anvil: Use provided test accounts
# 2. For Testnet: Get testnet ETH
# Sepolia faucet: https://sepoliafaucet.com/
```

#### Error: `Nonce too high`
```bash
# Solution: Reset MetaMask account
# Settings → Advanced → Reset Account
```

### Frontend Issues

#### Error: `Cannot find module`
```bash
# Solution: Reinstall dependencies
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Error: `ChainMismatchError`
```bash
# Solution: Switch network in MetaMask
# Must match the network in wagmiConfig.ts
```

#### Error: `Contract not deployed`
```bash
# Solution: Verify contract addresses
# 1. Check deployment output
# 2. Update frontend/utils/contracts.ts
# 3. Ensure on correct network
```

#### Error: `User rejected transaction`
```bash
# Solution: 
# 1. Check MetaMask popup isn't blocked
# 2. Verify gas fees are reasonable
# 3. Try lower amounts first
```

### Transaction Issues

#### Error: `Transaction reverted`
```bash
# Common causes:
# 1. Insufficient balance
# 2. Missing approval
# 3. Wrong function parameters

# Debug with cast:
cast call $CONTRACT "function()" --trace

# Or check transaction on block explorer
```

#### Error: `Gas estimation failed`
```bash
# Solutions:
# 1. Manually set gas limit
# 2. Check contract has required approvals
# 3. Verify contract state allows transaction
```

### Development Tips

#### Reset Local Blockchain
```bash
# Stop Anvil (Ctrl+C)
# Restart Anvil
anvil

# Redeploy contracts
forge script script/Deploy.s.sol --broadcast

# Reset MetaMask nonces
# Settings → Advanced → Reset Account
```

#### View Contract State
```bash
# Read public variables
cast call $TOKEN "balanceOf(address)" $SENDER
cast call $TOKEN "totalSupply()"
cast call $BANK "balances(address)" $SENDER

# Decode transaction data
cast 4byte 0xa9059cbb
cast 4byte-decode 0xa9059cbb000...
```

#### Monitor Events
```bash
# Watch for Transfer events
cast logs --address $TOKEN \
  "Transfer(address,address,uint256)"

# Get specific event
cast logs --from-block 0 --to-block latest \
  --address $TOKEN \
  "Transfer(address,address,uint256)"
```

---

## 📚 Additional Resources

### Documentation
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Next.js Documentation](https://nextjs.org/docs)

### EIP Standards
- [EIP-20: Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [EIP-721: NFT Standard](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2612: Permit Extension](https://eips.ethereum.org/EIPS/eip-2612)
- [EIP-712: Typed Data Signing](https://eips.ethereum.org/EIPS/eip-712)
- [Permit2: Universal Token Approval](https://github.com/Uniswap/permit2) - Advanced gasless token approvals

### Tools
- [Remix IDE](https://remix.ethereum.org/)
- [Etherscan](https://etherscan.io/)
- [OpenZeppelin Wizard](https://wizard.openzeppelin.com/)

---

## 📝 Project Structure

```
my-dapp-project/
├── contracts/              # Smart contracts
│   ├── MyERC20.sol        # ERC20 token
│   ├── TokenBank.sol      # Banking system with Permit2 support
│   ├── MyNFT.sol          # NFT collection
│   ├── NFTMarket.sol      # NFT marketplace
│   ├── interfaces/        # Contract interfaces
│   │   └── IPermit2.sol   # Permit2 interface
│   └── mocks/             # Mock contracts for testing
│       └── MockPermit2.sol # Mock Permit2 implementation
├── script/                 # Deployment scripts
│   ├── Deploy.s.sol       # Main deployment
│   └── TestPermit2Basic.s.sol # Permit2 testing script
├── test/                   # Contract tests
│   ├── MyERC20.t.sol
│   ├── TokenBank.t.sol
│   ├── TokenBankPermit2.t.sol # Permit2 specific tests
│   ├── MyNFT.t.sol
│   └── NFTMarket.t.sol
├── frontend/               # Next.js frontend
│   ├── app/               # Pages
│   │   ├── bank/          # Bank page with Permit2 UI
│   │   ├── token/         # Token management
│   │   ├── nft/           # NFT minting
│   │   └── market/        # NFT marketplace
│   ├── components/        # React components
│   │   ├── BatchDepositForm.tsx    # Batch deposit form
│   │   ├── DepositTypeSelector.tsx # Deposit method selector
│   │   ├── Permit2DepositForm.tsx  # Permit2 deposit form
│   │   └── SignatureModal.tsx      # Signature request modal
│   ├── utils/             # Config & utilities
│   │   ├── contracts.ts   # Contract addresses & ABIs
│   │   ├── customRpcClient.ts # Custom RPC client
│   │   ├── permit2.ts     # Permit2 utilities
│   │   └── wagmiConfig.ts # Wagmi configuration
│   ├── styles/            # CSS
│   ├── package.json       # Dependencies & scripts
│   └── pnpm-lock.yaml     # pnpm lock file
├── lib/                    # Dependencies
├── foundry.toml           # Foundry config
├── anvil-config.toml      # Anvil configuration
└── README.md              # This file
```

---

## 🔒 Security Notes

⚠️ **Important**: This project is for educational purposes.

- **Never** commit private keys to Git
- **Always** audit contracts before mainnet deployment
- **Test** thoroughly on testnets
- **Use** hardware wallets for production
- **Keep** dependencies updated
- **Review** all transactions before signing

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 💬 Support

- Issues: [GitHub Issues](https://github.com/yourusername/my-dapp-project/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/my-dapp-project/discussions)

---

<div align="center">

**Built with ❤️ using Foundry, OpenZeppelin, Next.js, Wagmi, and Viem**

⭐ Star this repo if you find it helpful!

</div>
