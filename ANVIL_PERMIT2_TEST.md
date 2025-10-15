# Anvil Permit2 Testing Guide

This guide shows how to test the Permit2 functionality in anvil environment.

## 🚀 Quick Start

### 1. Start Anvil

```bash
# Start anvil in one terminal
anvil
```

This will start a local Ethereum network at `http://127.0.0.1:8545` with 10 test accounts.

### 2. Test Basic Permit2 Functionality

```bash
# Run the basic test script
forge script script/TestPermit2Basic.s.sol:TestPermit2BasicScript --rpc-url http://127.0.0.1:8545
```

### 3. Deploy All Contracts

```bash
# Deploy all contracts including TokenBank with Permit2
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast
```

## 📋 What's Implemented

### TokenBank with Permit2 Support

The `TokenBank` contract now includes:

1. **Constructor Update**: Now accepts both token and Permit2 addresses
   ```solidity
   constructor(address _token, address _permit2)
   ```

2. **New Method**: `depositWithPermit2()`
   ```solidity
   function depositWithPermit2(
       address owner,
       uint160 amount,
       uint48 expiration,
       uint48 nonce,
       uint8 v,
       bytes32 r,
       bytes32 s
   ) external
   ```

3. **New Event**: `DepositWithPermit2`
   ```solidity
   event DepositWithPermit2(address indexed user, uint256 amount, uint48 nonce);
   ```

### MockPermit2 Contract

A simplified Permit2 implementation for testing:

- **Domain Separator**: Fixed constant for testing
- **Nonce Management**: Tracks nonces per owner
- **Allowance Management**: Manages token allowances
- **Signature Verification**: Simplified for testing (accepts any signature)

## 🧪 Testing Features

### Core Functionality Tests

1. **Basic Deposit with Permit2**
   - Set up Permit2 allowance
   - Execute deposit using signature
   - Verify balance updates

2. **Error Handling Tests**
   - Zero amount deposits
   - Zero owner address
   - Expired signatures
   - Invalid nonces
   - Insufficient allowances

3. **Multiple Deposits**
   - Test with different nonces
   - Verify nonce incrementation

4. **Gas Usage Tests**
   - Measure gas consumption
   - Compare with regular deposits

5. **Withdrawal After Permit2 Deposit**
   - Test normal withdrawal functionality
   - Verify balances are correct

### Fuzz Testing

- Random amount testing
- Boundary condition testing
- Stress testing with multiple operations

## 🔧 Usage Examples

### Basic Usage

```solidity
// 1. Set up Permit2 allowance
permit2.setAllowance(
    user,
    address(token),
    address(tokenBank),
    uint160(amount),
    expiration,
    nonce
);

// 2. Execute deposit with Permit2
tokenBank.depositWithPermit2(
    user,
    uint160(amount),
    expiration,
    nonce,
    0, // v
    bytes32(0), // r
    bytes32(0)  // s
);
```

### In Tests

```solidity
function testDepositWithPermit2() public {
    // Setup
    uint48 nonce = 0;
    uint48 expiration = uint48(block.timestamp + 3600);
    
    // Set allowance
    permit2.setAllowance(
        user,
        address(token),
        address(tokenBank),
        uint160(DEPOSIT_AMOUNT),
        expiration,
        nonce
    );
    
    // Execute deposit
    vm.prank(user);
    tokenBank.depositWithPermit2(
        user,
        uint160(DEPOSIT_AMOUNT),
        expiration,
        nonce,
        0, // v
        bytes32(0), // r
        bytes32(0)  // s
    );
    
    // Verify
    assertEq(tokenBank.balanceOf(user), DEPOSIT_AMOUNT);
}
```

## 📊 Expected Output

When you run the test script, you should see:

```
==================================
Testing Permit2 Basic Functionality
Deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
==================================

1. Deploying contracts...
MyERC20 deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MockPermit2 deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
TokenBank deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

2. Setting up test data...
Deployer token balance: 1000000000000000000000
Approval set for TokenBank
Permit2 allowance set

3. Testing deposit with Permit2...
Initial TokenBank balance: 0
Final TokenBank balance: 1000000000000000000000
Deployer token balance after deposit: 900000000000000000000

4. Testing withdrawal...
TokenBank balance after withdrawal: 500000000000000000000
Deployer token balance after withdrawal: 950000000000000000000

==================================
✅ Permit2 Basic Test Completed Successfully!
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

To verify contracts are deployed correctly:

```bash
# Check if contracts are deployed
cast code <CONTRACT_ADDRESS> --rpc-url http://127.0.0.1:8545

# Call view functions
cast call <TOKENBANK_ADDRESS> "balanceOf(address)" <USER_ADDRESS> --rpc-url http://127.0.0.1:8545
```

## 📚 Next Steps

1. **Integration Testing**: Test with real Permit2 contract
2. **Gas Optimization**: Optimize gas usage for production
3. **Security Audit**: Review signature verification logic
4. **Frontend Integration**: Add Permit2 support to frontend
5. **Documentation**: Add comprehensive API documentation

## 🎯 Summary

The Permit2 integration is now complete with:

- ✅ TokenBank updated with Permit2 support
- ✅ MockPermit2 contract for testing
- ✅ Comprehensive test suite
- ✅ Anvil testing environment setup
- ✅ Basic functionality verification

The implementation allows users to deposit tokens using Permit2 signatures, eliminating the need for separate approval transactions and improving the user experience.
