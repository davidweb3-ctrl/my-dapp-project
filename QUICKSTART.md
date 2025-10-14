# 🎯 Quick Reference Guide

## 🚀 Fast Setup (5 Minutes)

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts

# 3. Configure Foundry (add remappings to foundry.toml)
echo 'remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]' >> foundry.toml

# 4. Compile contracts
forge build

# 5. Start local blockchain
anvil

# 6. Deploy (in new terminal)
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 7. Install frontend dependencies
cd frontend && npm install

# 8. Update contract addresses in frontend/utils/contracts.ts

# 9. Run frontend
npm run dev

# 10. Open browser: http://localhost:3000
```

---

## 📝 Essential Commands

### Foundry Commands

```bash
# Compile
forge build

# Test
forge test
forge test -vvv                    # Verbose
forge test --match-test testName   # Specific test
forge coverage                     # Coverage report

# Deploy
forge script script/Deploy.s.sol --rpc-url <URL> --broadcast --private-key <KEY>

# Format
forge fmt

# Gas report
forge test --gas-report

# Clean artifacts
forge clean
```

### Cast Commands (Blockchain Interaction)

```bash
# Read calls
cast call <CONTRACT> "function(args)" <VALUES>

# Write transactions
cast send <CONTRACT> "function(args)" <VALUES> --private-key <KEY>

# Get balance
cast balance <ADDRESS>

# Get block number
cast block-number

# Convert units
cast --to-wei 1 ether
cast --from-wei 1000000000000000000
```

### Frontend Commands

```bash
cd frontend

npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run linter
```

---

## 🔑 Anvil Test Accounts

```
Account #0 (Deployer):
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1:
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

---

## 📋 Contract Addresses (Update After Deployment)

```typescript
// frontend/utils/contracts.ts
export const CONTRACT_ADDRESSES = {
  MyERC20: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TokenBank: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  MyNFT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  NFTMarket: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
};
```

---

## 🎬 Common Workflows

### Transfer Tokens

```bash
# 1. Check balance
cast call $TOKEN "balanceOf(address)" $SENDER

# 2. Transfer
cast send $TOKEN "transfer(address,uint256)" $RECIPIENT $AMOUNT --private-key $KEY

# 3. Verify
cast call $TOKEN "balanceOf(address)" $RECIPIENT
```

### Deposit to Bank

```bash
# 1. Approve
cast send $TOKEN "approve(address,uint256)" $BANK $AMOUNT --private-key $KEY

# 2. Deposit
cast send $BANK "deposit(uint256)" $AMOUNT --private-key $KEY

# 3. Check bank balance
cast call $BANK "balanceOf(address)" $SENDER
```

### Mint NFT

```bash
cast send $NFT "mint(address,string)" $RECIPIENT "ipfs://QmTest..." --private-key $KEY
```

### List NFT on Market

```bash
# 1. Approve NFT
cast send $NFT "approve(address,uint256)" $MARKET $TOKEN_ID --private-key $KEY

# 2. List
cast send $MARKET "list(uint256,uint256)" $TOKEN_ID $PRICE --private-key $KEY
```

### Buy NFT

```bash
# 1. Approve tokens
cast send $TOKEN "approve(address,uint256)" $MARKET $PRICE --private-key $KEY

# 2. Buy
cast send $MARKET "buyNFT(uint256)" $TOKEN_ID --private-key $KEY
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Contracts won't compile | `forge install OpenZeppelin/openzeppelin-contracts` |
| Frontend can't find contracts | Update addresses in `contracts.ts` |
| Transaction fails | Check approvals and balances |
| Wrong network | Switch MetaMask to Localhost:8545 |
| Nonce too high | Reset MetaMask account |
| Module not found | `cd frontend && npm install` |
| Anvil not running | Run `anvil` in separate terminal |

---

## 📞 Need Help?

1. Check main [README.md](README.md) for detailed docs
2. Review [IMPLEMENTATION.md](IMPLEMENTATION.md) for specs
3. Check frontend [README.md](frontend/README.md) for frontend details
4. Search GitHub issues
5. Review Foundry book: https://book.getfoundry.sh/

---

## 🔗 Useful Links

- **Foundry**: https://book.getfoundry.sh/
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **Wagmi**: https://wagmi.sh/
- **Viem**: https://viem.sh/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **WalletConnect**: https://cloud.walletconnect.com/

---

**Happy Building! 🚀**

