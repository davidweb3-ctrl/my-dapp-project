// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MockPermit2} from "../contracts/mocks/MockPermit2.sol";

contract TokenBankTest is Test {
    MyERC20 public token;
    TokenBank public bank;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 constant INITIAL_SUPPLY = 100_000_000 * 10**18;
    
    // Events from TokenBank contract
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        token = new MyERC20();
        // Create a mock Permit2 for testing
        MockPermit2 mockPermit2 = new MockPermit2();
        bank = new TokenBank(address(token), address(mockPermit2));
        
        // Give users some tokens
        token.transfer(user1, 10000 * 10**18);
        token.transfer(user2, 10000 * 10**18);
    }
    
    function testConstructor() public view {
        assertEq(address(bank.token()), address(token));
    }
    
    function testConstructorZeroAddress() public {
        vm.expectRevert("TokenBank: token address cannot be zero");
        MockPermit2 mockPermit2 = new MockPermit2();
        new TokenBank(address(0), address(mockPermit2));
    }
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**18;
        
        vm.startPrank(user1);
        token.approve(address(bank), depositAmount);
        
        vm.expectEmit(true, false, false, true);
        emit Deposit(user1, depositAmount);
        
        bank.deposit(depositAmount);
        vm.stopPrank();
        
        assertEq(bank.balances(user1), depositAmount);
        assertEq(bank.balanceOf(user1), depositAmount);
        assertEq(bank.totalDeposits(), depositAmount);
        assertEq(token.balanceOf(address(bank)), depositAmount);
    }
    
    function testDepositZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("TokenBank: deposit amount must be greater than 0");
        bank.deposit(0);
    }
    
    function testDepositInsufficientApproval() public {
        uint256 depositAmount = 1000 * 10**18;
        
        vm.prank(user1);
        vm.expectRevert();
        bank.deposit(depositAmount);
    }
    
    function testMultipleDeposits() public {
        uint256 depositAmount1 = 1000 * 10**18;
        uint256 depositAmount2 = 500 * 10**18;
        
        vm.startPrank(user1);
        token.approve(address(bank), depositAmount1 + depositAmount2);
        
        bank.deposit(depositAmount1);
        bank.deposit(depositAmount2);
        vm.stopPrank();
        
        assertEq(bank.balanceOf(user1), depositAmount1 + depositAmount2);
    }
    
    function testWithdraw() public {
        uint256 depositAmount = 1000 * 10**18;
        uint256 withdrawAmount = 400 * 10**18;
        
        // First deposit
        vm.startPrank(user1);
        token.approve(address(bank), depositAmount);
        bank.deposit(depositAmount);
        
        uint256 balanceBefore = token.balanceOf(user1);
        
        vm.expectEmit(true, false, false, true);
        emit Withdraw(user1, withdrawAmount);
        
        bank.withdraw(withdrawAmount);
        vm.stopPrank();
        
        assertEq(bank.balanceOf(user1), depositAmount - withdrawAmount);
        assertEq(token.balanceOf(user1), balanceBefore + withdrawAmount);
    }
    
    function testWithdrawZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("TokenBank: withdraw amount must be greater than 0");
        bank.withdraw(0);
    }
    
    function testWithdrawInsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert("TokenBank: insufficient balance");
        bank.withdraw(1000 * 10**18);
    }
    
    function testWithdrawAll() public {
        uint256 depositAmount = 1000 * 10**18;
        
        vm.startPrank(user1);
        token.approve(address(bank), depositAmount);
        bank.deposit(depositAmount);
        
        bank.withdraw(depositAmount);
        vm.stopPrank();
        
        assertEq(bank.balanceOf(user1), 0);
        assertEq(bank.totalDeposits(), 0);
    }
    
    function testPermitDeposit() public {
        uint256 privateKey = 0xA11CE;
        address alice = vm.addr(privateKey);
        
        // Give Alice some tokens
        token.transfer(alice, 5000 * 10**18);
        
        uint256 depositAmount = 1000 * 10**18;
        uint256 deadline = block.timestamp + 1 days;
        
        // Create permit signature for bank contract
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                alice,
                address(bank),
                depositAmount,
                token.nonces(alice),
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        
        // Execute permitDeposit
        vm.expectEmit(true, false, false, true);
        emit Deposit(alice, depositAmount);
        
        bank.permitDeposit(alice, depositAmount, deadline, v, r, s);
        
        assertEq(bank.balanceOf(alice), depositAmount);
        assertEq(token.balanceOf(address(bank)), depositAmount);
    }
    
    function testPermitDepositZeroAmount() public {
        uint256 privateKey = 0xA11CE;
        address alice = vm.addr(privateKey);
        uint256 deadline = block.timestamp + 1 days;
        
        vm.expectRevert("TokenBank: deposit amount must be greater than 0");
        bank.permitDeposit(alice, 0, deadline, 0, bytes32(0), bytes32(0));
    }
    
    function testPermitDepositZeroAddress() public {
        uint256 deadline = block.timestamp + 1 days;
        
        vm.expectRevert("TokenBank: owner address cannot be zero");
        bank.permitDeposit(address(0), 1000, deadline, 0, bytes32(0), bytes32(0));
    }
    
    function testMultipleUsersDepositAndWithdraw() public {
        uint256 depositAmount1 = 1000 * 10**18;
        uint256 depositAmount2 = 2000 * 10**18;
        
        // User1 deposits
        vm.startPrank(user1);
        token.approve(address(bank), depositAmount1);
        bank.deposit(depositAmount1);
        vm.stopPrank();
        
        // User2 deposits
        vm.startPrank(user2);
        token.approve(address(bank), depositAmount2);
        bank.deposit(depositAmount2);
        vm.stopPrank();
        
        assertEq(bank.balanceOf(user1), depositAmount1);
        assertEq(bank.balanceOf(user2), depositAmount2);
        assertEq(bank.totalDeposits(), depositAmount1 + depositAmount2);
        
        // User1 withdraws
        vm.prank(user1);
        bank.withdraw(depositAmount1);
        
        assertEq(bank.balanceOf(user1), 0);
        assertEq(bank.balanceOf(user2), depositAmount2);
        assertEq(bank.totalDeposits(), depositAmount2);
    }
    
    function testFuzzDeposit(uint256 amount) public {
        uint256 userBalance = token.balanceOf(user1);
        vm.assume(amount > 0 && amount <= userBalance);
        
        vm.startPrank(user1);
        token.approve(address(bank), amount);
        bank.deposit(amount);
        vm.stopPrank();
        
        assertEq(bank.balanceOf(user1), amount);
    }
    
    function testFuzzWithdraw(uint256 depositAmount, uint256 withdrawAmount) public {
        uint256 userBalance = token.balanceOf(user1);
        vm.assume(depositAmount > 0 && depositAmount <= userBalance);
        vm.assume(withdrawAmount > 0 && withdrawAmount <= depositAmount);
        
        vm.startPrank(user1);
        token.approve(address(bank), depositAmount);
        bank.deposit(depositAmount);
        
        bank.withdraw(withdrawAmount);
        vm.stopPrank();
        
        assertEq(bank.balanceOf(user1), depositAmount - withdrawAmount);
    }
}

