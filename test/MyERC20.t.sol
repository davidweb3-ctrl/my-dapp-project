// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MyERC20} from "../contracts/MyERC20.sol";

contract MyERC20Test is Test {
    MyERC20 public token;
    address public owner;
    address public user1;
    address public user2;
    
    uint256 constant INITIAL_SUPPLY = 100_000_000 * 10**18;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        token = new MyERC20();
    }
    
    function testInitialSupply() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
    }
    
    function testTokenMetadata() public view {
        assertEq(token.name(), "MyERC20");
        assertEq(token.symbol(), "MERC20");
        assertEq(token.decimals(), 18);
    }
    
    function testTransfer() public {
        uint256 amount = 1000 * 10**18;
        
        bool success = token.transfer(user1, amount);
        assertTrue(success);
        
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }
    
    function testTransferFailsInsufficientBalance() public {
        uint256 amount = 1000 * 10**18;
        
        vm.prank(user1);
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        token.transfer(user2, amount);
    }
    
    function testApproveAndTransferFrom() public {
        uint256 amount = 1000 * 10**18;
        
        // Owner approves user1 to spend tokens
        bool approveSuccess = token.approve(user1, amount);
        assertTrue(approveSuccess);
        
        assertEq(token.allowance(owner, user1), amount);
        
        // user1 transfers tokens from owner to user2
        vm.prank(user1);
        bool transferSuccess = token.transferFrom(owner, user2, amount);
        assertTrue(transferSuccess);
        
        assertEq(token.balanceOf(user2), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
        assertEq(token.allowance(owner, user1), 0);
    }
    
    function testTransferFromFailsInsufficientAllowance() public {
        uint256 amount = 1000 * 10**18;
        
        vm.prank(user1);
        vm.expectRevert("ERC20: transfer amount exceeds allowance");
        token.transferFrom(owner, user2, amount);
    }
    
    function testPermit() public {
        uint256 privateKey = 0xA11CE;
        address alice = vm.addr(privateKey);
        
        // Give Alice some tokens
        token.transfer(alice, 1000 * 10**18);
        
        uint256 amount = 500 * 10**18;
        uint256 deadline = block.timestamp + 1 days;
        
        // Create permit signature
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                alice,
                user1,
                amount,
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
        
        // Execute permit
        token.permit(alice, user1, amount, deadline, v, r, s);
        
        assertEq(token.allowance(alice, user1), amount);
    }
    
    function testPermitExpired() public {
        uint256 privateKey = 0xA11CE;
        address alice = vm.addr(privateKey);
        
        uint256 amount = 500 * 10**18;
        uint256 deadline = block.timestamp;
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                alice,
                user1,
                amount,
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
        
        // Fast forward time
        vm.warp(deadline + 1);
        
        vm.expectRevert();
        token.permit(alice, user1, amount, deadline, v, r, s);
    }
    
    function testFuzzTransfer(uint256 amount) public {
        vm.assume(amount <= INITIAL_SUPPLY);
        
        bool success = token.transfer(user1, amount);
        assertTrue(success);
        
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }
}

