# Permit2 Deployment Guide

This guide explains how to deploy Permit2 contract for testing and development purposes.

## 🚀 Quick Start

### 1. Start Anvil Local Network

```bash
# Start anvil in one terminal
anvil
```

This will start a local Ethereum network at `http://127.0.0.1:8545` with 10 test accounts.

### 2. Deploy Permit2 for Testing

```bash
# Deploy Permit2 using the testing script
forge script script/DeployPermit2ForTesting.s.sol:DeployPermit2ForTestingScript --rpc-url http://127.0.0.1:8545 --broadcast
```

### 3. Deploy Complete Project with Permit2

```bash
# Deploy all contracts including Permit2
forge script script/DeployWithPermit2.s.sol:DeployWithPermit2Script --rpc-url http://127.0.0.1:8545 --broadcast
```

## 📋 Available Deployment Scripts

### 1. `DeployPermit2ForTesting.s.sol`
- **Purpose**: Deploy only Permit2 contract for testing
- **Use Case**: When you only need Permit2 for testing
- **Command**: 
  ```bash
  forge script script/DeployPermit2ForTesting.s.sol:DeployPermit2ForTestingScript --rpc-url http://127.0.0.1:8545 --broadcast
  ```

### 2. `DeployWithPermit2.s.sol`
- **Purpose**: Deploy complete project including Permit2
- **Use Case**: Full deployment with all contracts
- **Command**: 
  ```bash
  forge script script/DeployWithPermit2.s.sol:DeployWithPermit2Script --rpc-url http://127.0.0.1:8545 --broadcast
  ```

### 3. `TestPermit2Deployment.s.sol`
- **Purpose**: Test Permit2 deployment and basic functionality
- **Use Case**: Verify Permit2 is working correctly
- **Command**: 
  ```bash
  forge script script/TestPermit2Deployment.s.sol:TestPermit2DeploymentScript --rpc-url http://127.0.0.1:8545
  ```

## 🔧 Configuration

### Environment Variables

For production deployments, set the following environment variable:

```bash
export PRIVATE_KEY="your_private_key_here"
```

For testing with anvil, the scripts use the default anvil private key:
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Network Configuration

The scripts are configured for:
- **Anvil Local**: `http://127.0.0.1:8545`
- **Mainnet**: Use official Permit2 address: `0x000000000022D473030F116dDEE9F6B43aC78BA3`

## 📝 Usage in Tests

After deploying Permit2, use it in your tests:

```solidity
// In your test contract
contract TokenBankPermit2Test is Test {
    TokenBank public tokenBank;
    MyERC20 public token;
    Permit2 public permit2;
    
    address public user;
    uint256 userPrivateKey = 0x123;
    
    function setUp() public {
        user = vm.addr(userPrivateKey);
        
        // Deploy Permit2
        permit2 = new Permit2();
        
        // Deploy other contracts
        token = new MyERC20();
        tokenBank = new TokenBank(address(token), address(permit2));
        
        // Setup test data...
    }
    
    function testDepositWithPermit2() public {
        // Your test implementation
    }
}
```

## 🧪 Testing Commands

### Run All Tests
```bash
forge test
```

### Run Tests with Gas Report
```bash
forge test --gas-report
```

### Run Specific Test Contract
```bash
forge test --match-contract TokenBankPermit2Test
```

## 📊 Expected Output

When you run the deployment script, you should see output like:

```
==================================
Deploying Permit2 for Testing...
Deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Network: Anvil Local
==================================

Deploying Permit2...
Permit2 deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

==================================
PERMIT2 DEPLOYMENT SUMMARY
==================================
Permit2 Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: Anvil Local (http://127.0.0.1:8545)
==================================

==================================
TEST CONFIGURATION
==================================
Add this to your test setup:

// In your test contract
address constant PERMIT2_ADDRESS = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

// Or use in your TokenBank constructor
TokenBank bank = new TokenBank(address(token), PERMIT2_ADDRESS);
==================================
```

## 🔍 Troubleshooting

### Common Issues

1. **"No such file or directory" error**
   - Make sure you're in the project root directory
   - Ensure all dependencies are installed: `forge install`

2. **"Permission denied" error**
   - Check if anvil is running on port 8545
   - Verify the RPC URL is correct

3. **"Insufficient funds" error**
   - This shouldn't happen with anvil as it provides unlimited test ETH
   - Make sure you're using the correct private key

### Verification

To verify Permit2 is deployed correctly:

```bash
# Check if the contract is deployed
cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://127.0.0.1:8545

# Call a view function
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "DOMAIN_SEPARATOR()" --rpc-url http://127.0.0.1:8545
```

## 📚 Additional Resources

- [Permit2 Documentation](https://docs.uniswap.org/contracts/permit2/overview)
- [Uniswap Permit2 GitHub](https://github.com/Uniswap/permit2)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)
