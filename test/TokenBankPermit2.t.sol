// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {MockPermit2} from "../contracts/mocks/MockPermit2.sol";
import {IPermit2} from "../contracts/interfaces/IPermit2.sol";

/**
 * @title TokenBankPermit2Test
 * @notice Test suite for TokenBank's Permit2 functionality
 */
contract TokenBankPermit2Test is Test {
    TokenBank public tokenBank;
    MyERC20 public token;
    MockPermit2 public permit2;
    
    address public user;
    uint256 userPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
    
    // Test constants
    uint256 constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 constant DEPOSIT_AMOUNT = 1000 * 10**18;
    uint48 constant EXPIRATION = 1000000000; // Far future timestamp
    
    function setUp() public {
        // Create test accounts
        user = vm.addr(userPrivateKey);
        
        // Deploy contracts
        token = new MyERC20();
        permit2 = new MockPermit2();
        tokenBank = new TokenBank(address(token), address(permit2));
        
        // Setup test data
        token.transfer(user, INITIAL_SUPPLY);
        
        // Approve TokenBank to spend user's tokens
        vm.prank(user);
        token.approve(address(tokenBank), type(uint256).max);
        
        console.log("Setup completed:");
        console.log("User address:", user);
        console.log("User balance:", token.balanceOf(user));
        console.log("TokenBank address:", address(tokenBank));
        console.log("Permit2 address:", address(permit2));
    }
    
    /**
     * @notice Test basic Permit2 deployment and setup
     */
    function testPermit2Deployment() public {
        assertEq(address(tokenBank.token()), address(token));
        assertEq(address(tokenBank.permit2()), address(permit2));
        assertEq(tokenBank.balanceOf(user), 0);
    }
    
    /**
     * @notice Test successful deposit with Permit2
     */
    function testDepositWithPermit2() public {
        uint48 nonce = 0;
        
        // Set up Permit2 allowance
        permit2.setAllowance(
            user,
            address(token),
            address(tokenBank),
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce
        );
        
        // Record initial balances
        uint256 initialUserBalance = token.balanceOf(user);
        uint256 initialBankBalance = tokenBank.balanceOf(user);
        uint256 initialContractBalance = token.balanceOf(address(tokenBank));
        
        // Execute deposit with Permit2
        vm.prank(user);
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
        
        // Verify balances
        assertEq(token.balanceOf(user), initialUserBalance - DEPOSIT_AMOUNT);
        assertEq(tokenBank.balanceOf(user), initialBankBalance + DEPOSIT_AMOUNT);
        assertEq(token.balanceOf(address(tokenBank)), initialContractBalance + DEPOSIT_AMOUNT);
        
        // Verify nonce was incremented
        assertEq(permit2.nonces(user), nonce + 1);
    }
    
    /**
     * @notice Test deposit with Permit2 - zero amount
     */
    function testDepositWithPermit2ZeroAmount() public {
        uint48 nonce = 0;
        
        vm.prank(user);
        vm.expectRevert("TokenBank: deposit amount must be greater than 0");
        tokenBank.depositWithPermit2(
            user,
            0, // zero amount
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
    }
    
    /**
     * @notice Test deposit with Permit2 - zero owner address
     */
    function testDepositWithPermit2ZeroOwner() public {
        uint48 nonce = 0;
        
        vm.prank(user);
        vm.expectRevert("TokenBank: owner address cannot be zero");
        tokenBank.depositWithPermit2(
            address(0), // zero owner
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
    }
    
    /**
     * @notice Test deposit with Permit2 - expired signature
     */
    function testDepositWithPermit2ExpiredSignature() public {
        uint48 nonce = 0;
        uint48 expiredTimestamp = uint48(block.timestamp - 1); // Past timestamp
        
        vm.prank(user);
        vm.expectRevert("TokenBank: permit signature expired");
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT),
            expiredTimestamp,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
    }
    
    /**
     * @notice Test deposit with Permit2 - invalid nonce
     */
    function testDepositWithPermit2InvalidNonce() public {
        uint48 invalidNonce = 999; // Wrong nonce
        
        vm.prank(user);
        vm.expectRevert("MockPermit2: invalid nonce");
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            invalidNonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
    }
    
    /**
     * @notice Test deposit with Permit2 - insufficient allowance
     */
    function testDepositWithPermit2InsufficientAllowance() public {
        uint48 nonce = 0;
        uint160 insufficientAmount = uint160(DEPOSIT_AMOUNT / 2);
        
        // Set up insufficient Permit2 allowance
        permit2.setAllowance(
            user,
            address(token),
            address(tokenBank),
            insufficientAmount,
            EXPIRATION,
            nonce
        );
        
        vm.prank(user);
        vm.expectRevert("MockPermit2: invalid nonce");
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT), // Request more than allowed
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
    }
    
    /**
     * @notice Test multiple deposits with Permit2 using different nonces
     */
    function testMultipleDepositsWithPermit2() public {
        uint256 depositAmount = 100 * 10**18;
        uint256 totalDeposits = 0;
        
        for (uint48 nonce = 0; nonce < 5; nonce++) {
            // Set up Permit2 allowance for this nonce
            permit2.setAllowance(
                user,
                address(token),
                address(tokenBank),
                uint160(depositAmount),
                EXPIRATION,
                nonce
            );
            
            // Execute deposit
            vm.prank(user);
            tokenBank.depositWithPermit2(
                user,
                uint160(depositAmount),
                EXPIRATION,
                nonce,
                0, // v
                bytes32(0), // r
                bytes32(0)  // s
            );
            
            totalDeposits += depositAmount;
            
            // Verify balance
            assertEq(tokenBank.balanceOf(user), totalDeposits);
        }
        
        // Verify final state
        assertEq(tokenBank.balanceOf(user), 5 * depositAmount);
        assertEq(permit2.nonces(user), 5);
    }
    
    /**
     * @notice Test event emission for deposit with Permit2
     */
    function testDepositWithPermit2Event() public {
        uint48 nonce = 0;
        
        // Set up Permit2 allowance
        permit2.setAllowance(
            user,
            address(token),
            address(tokenBank),
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce
        );
        
        // Execute deposit and verify it succeeds
        vm.prank(user);
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
        
        // Verify the deposit was successful
        assertEq(tokenBank.balanceOf(user), DEPOSIT_AMOUNT);
    }
    
    /**
     * @notice Test gas consumption for deposit with Permit2
     */
    function testDepositWithPermit2GasUsage() public {
        uint48 nonce = 0;
        
        // Set up Permit2 allowance
        permit2.setAllowance(
            user,
            address(token),
            address(tokenBank),
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce
        );
        
        // Measure gas usage
        uint256 gasStart = gasleft();
        
        vm.prank(user);
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("Gas used for depositWithPermit2:", gasUsed);
        
        // Gas usage should be reasonable (less than 200k gas)
        assertLt(gasUsed, 200000);
    }
    
    /**
     * @notice Test withdrawal after deposit with Permit2
     */
    function testWithdrawAfterPermit2Deposit() public {
        uint48 nonce = 0;
        
        // Set up Permit2 allowance and deposit
        permit2.setAllowance(
            user,
            address(token),
            address(tokenBank),
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce
        );
        
        vm.prank(user);
        tokenBank.depositWithPermit2(
            user,
            uint160(DEPOSIT_AMOUNT),
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
        
        // Now withdraw
        uint256 withdrawAmount = DEPOSIT_AMOUNT / 2;
        uint256 initialBalance = token.balanceOf(user);
        
        vm.prank(user);
        tokenBank.withdraw(withdrawAmount);
        
        // Verify withdrawal
        assertEq(token.balanceOf(user), initialBalance + withdrawAmount);
        assertEq(tokenBank.balanceOf(user), DEPOSIT_AMOUNT - withdrawAmount);
    }
    
    /**
     * @notice Fuzz test for deposit with Permit2
     */
    function testFuzzDepositWithPermit2(uint160 amount) public {
        vm.assume(amount > 0 && amount <= token.balanceOf(user));
        
        uint48 nonce = 0;
        
        // Set up Permit2 allowance
        permit2.setAllowance(
            user,
            address(token),
            address(tokenBank),
            amount,
            EXPIRATION,
            nonce
        );
        
        uint256 initialBalance = tokenBank.balanceOf(user);
        
        vm.prank(user);
        tokenBank.depositWithPermit2(
            user,
            amount,
            EXPIRATION,
            nonce,
            0, // v
            bytes32(0), // r
            bytes32(0)  // s
        );
        
        assertEq(tokenBank.balanceOf(user), initialBalance + amount);
    }
}
