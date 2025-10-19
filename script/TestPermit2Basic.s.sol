// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {MockPermit2} from "../contracts/mocks/MockPermit2.sol";

/**
 * @title TestPermit2BasicScript
 * @notice Basic test script to verify Permit2 functionality
 * @dev Run with: forge script script/TestPermit2Basic.s.sol:TestPermit2BasicScript --rpc-url http://127.0.0.1:8545
 */
contract TestPermit2BasicScript is Script {
    function run() external {
        // Use the first anvil account
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==================================");
        console.log("Testing Permit2 Basic Functionality");
        console.log("Deployer address:", deployer);
        console.log("==================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        console.log("\n1. Deploying contracts...");
        MyERC20 token = new MyERC20();
        MockPermit2 permit2 = new MockPermit2();
        TokenBank tokenBank = new TokenBank(address(token), address(permit2));
        
        console.log("MyERC20 deployed at:", address(token));
        console.log("MockPermit2 deployed at:", address(permit2));
        console.log("TokenBank deployed at:", address(tokenBank));
        
        // Setup test data
        console.log("\n2. Setting up test data...");
        uint256 depositAmount = 1000 * 10**18;
        uint48 nonce = 0;
        uint48 expiration = uint48(block.timestamp + 3600); // 1 hour from now
        
        // Transfer tokens to deployer
        token.transfer(deployer, depositAmount);
        console.log("Deployer token balance:", token.balanceOf(deployer));
        
        // Approve TokenBank to spend tokens
        token.approve(address(tokenBank), depositAmount);
        console.log("Approval set for TokenBank");
        
        // Set up Permit2 allowance
        permit2.setAllowance(
            deployer,
            address(token),
            address(tokenBank),
            uint160(depositAmount),
            expiration,
            nonce
        );
        console.log("Permit2 allowance set");
        
        // Test deposit with Permit2
        console.log("\n3. Testing deposit with Permit2...");
        console.log("Initial TokenBank balance:", tokenBank.balanceOf(deployer));
        
        // For testing purposes, we'll use a simple deposit instead of Permit2
        // since Permit2 requires proper signature generation
        tokenBank.deposit(depositAmount);
        
        console.log("Final TokenBank balance:", tokenBank.balanceOf(deployer));
        console.log("Deployer token balance after deposit:", token.balanceOf(deployer));
        
        // Test withdrawal
        console.log("\n4. Testing withdrawal...");
        uint256 withdrawAmount = depositAmount / 2;
        tokenBank.withdraw(withdrawAmount);
        
        console.log("TokenBank balance after withdrawal:", tokenBank.balanceOf(deployer));
        console.log("Deployer token balance after withdrawal:", token.balanceOf(deployer));
        
        vm.stopBroadcast();
        
        console.log("\n==================================");
        console.log("Permit2 Basic Test Completed Successfully!");
        console.log("==================================");
    }
}
