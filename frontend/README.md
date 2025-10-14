# My DApp Frontend

A complete Web3 frontend application built with Next.js, Wagmi, Viem, and RainbowKit for interacting with smart contracts.

## Features

### 🪙 Token Management (MyERC20)
- View token balance
- Transfer tokens
- Approve spending allowances
- EIP-2612 permit signatures support

### 🏦 Token Bank
- **Traditional Deposit**: Approve + Deposit (two transactions)
- **⚡ Permit Deposit (EIP-2612)**: Sign + Deposit in one transaction (gasless approval)
- Withdraw tokens anytime
- Track savings balance
- Real-time balance updates

### 🎨 NFT Collection (MyNFT)
- Mint unique NFTs (owner only)
- View NFT collection
- Check token metadata URIs
- Track total supply

### 🛒 NFT Marketplace
- List NFTs for sale
- **Traditional Buy**: Standard NFT purchase with token payment
- **🎫 Whitelist Buy (EIP-712)**: Purchase with market owner signature (presales/VIP access)
- **Owner Tools**: Generate whitelist signatures for exclusive sales
- Secure P2P trading

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **RainbowKit** - Beautiful wallet connection UI
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development

## Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Smart contracts deployed (see `/contracts`)

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Configuration

### 1. Update Contract Addresses

Edit `utils/contracts.ts` and update the contract addresses after deployment:

```typescript
export const CONTRACT_ADDRESSES = {
  MyERC20: '0x...', // Your deployed MyERC20 address
  TokenBank: '0x...', // Your deployed TokenBank address
  MyNFT: '0x...', // Your deployed MyNFT address
  NFTMarket: '0x...', // Your deployed NFTMarket address
};
```

### 2. Update RPC URL

Edit `utils/wagmiConfig.ts` and `utils/viemClient.ts` to configure your network:

- For local development: `http://127.0.0.1:8545` (Hardhat/Anvil)
- For testnet: Use Sepolia or other testnet RPC
- For mainnet: Use production RPC URL

### 3. WalletConnect Project ID

Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) and update it in `utils/wagmiConfig.ts`:

```typescript
projectId: 'YOUR_PROJECT_ID',
```

## Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home page
│   ├── token/page.tsx       # Token management
│   ├── bank/page.tsx        # Token bank
│   ├── nft/page.tsx         # NFT collection
│   ├── market/page.tsx      # NFT marketplace
│   └── layout.tsx           # Root layout with navigation
├── components/              # Reusable React components
│   ├── WalletConnectButton.tsx
│   └── TokenBalance.tsx
├── utils/                   # Utility functions and configs
│   ├── contracts.ts         # Contract addresses and ABIs
│   ├── viemClient.ts        # Viem client configuration
│   └── wagmiConfig.ts       # Wagmi configuration
├── styles/
│   └── globals.css          # Global styles and Tailwind
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Usage Guide

### Connecting Wallet

1. Click "Connect Wallet" button in the navigation bar
2. Select your preferred wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection

### Token Operations

1. Navigate to **Token** page
2. View your MERC20 balance
3. Transfer tokens by entering recipient address and amount
4. Approve spending for contracts

### Using Token Bank

1. Navigate to **Bank** page
2. **Deposit**: Approve tokens first, then deposit
3. **Withdraw**: Enter amount and withdraw to your wallet
4. View wallet and bank balances

### Managing NFTs

1. Navigate to **NFT** page
2. **Mint** (owner only): Enter recipient and token URI
3. **View**: Enter token ID to see metadata

### Trading on Marketplace

1. Navigate to **Market** page
2. **List NFT**: Approve NFT first, then set price
3. **Buy NFT**: View listing, approve tokens, then buy
4. **Whitelist Buy**: Requires signature from market owner

## Important Notes

### Transaction Flow

Most operations require two steps:
1. **Approve**: Grant permission to the contract
2. **Execute**: Perform the actual operation

### Gas Fees

- All transactions require gas fees in ETH
- Ensure you have enough ETH for gas

### Network Switching

Make sure you're connected to the correct network (Hardhat/Sepolia/etc.)

### Contract Interactions

The app uses:
- **Wagmi hooks** for reading contract state
- **Viem** for type-safe contract interactions
- **RainbowKit** for wallet management

## Development

### Adding New Features

1. Create new page in `app/` directory
2. Add route to navigation in `app/layout.tsx`
3. Use Wagmi hooks for contract interactions
4. Add contract ABI to `utils/contracts.ts` if needed

### Styling

The project uses TailwindCSS with custom utilities in `globals.css`:
- Responsive design built-in
- Custom animations and transitions
- Glass morphism effects
- Gradient text utilities

## Troubleshooting

### Wallet Connection Issues

- Clear browser cache and reconnect
- Try different wallet or browser
- Check network configuration

### Transaction Failures

- Ensure sufficient balance
- Check token/NFT approvals
- Verify contract addresses
- Review gas settings

### Contract Read Errors

- Verify contract is deployed
- Check contract addresses in `contracts.ts`
- Ensure correct network selected

## Security Considerations

- Never share private keys
- Always verify transaction details before signing
- Use testnet for development
- Audit smart contracts before mainnet deployment

## License

MIT

## Support

For issues and questions:
- Check contract deployment status
- Verify configuration in `utils/` files
- Review browser console for errors
- Test with smaller amounts first

