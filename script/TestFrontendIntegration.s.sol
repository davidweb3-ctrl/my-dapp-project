// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MockPermit2} from "../contracts/mocks/MockPermit2.sol";

/**
 * @title TestFrontendIntegration
 * @notice Test script to verify frontend integration with deployed contracts
 */
contract TestFrontendIntegration is Script {
    function run() external view {
        // Contract addresses from deployment
        address myERC20 = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address tokenBank = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
        address mockPermit2 = 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f;
        
        console.log("==================================");
        console.log("Frontend Integration Test");
        console.log("==================================");
        
        // Test contract interactions
        MyERC20 token = MyERC20(myERC20);
        TokenBank bank = TokenBank(tokenBank);
        MockPermit2 permit2 = MockPermit2(mockPermit2);
        
        console.log("Contract Addresses:");
        console.log("  MyERC20:    ", address(token));
        console.log("  TokenBank:  ", address(bank));
        console.log("  MockPermit2:", address(permit2));
        
        console.log("\nContract Verification:");
        console.log("  TokenBank.token():     ", address(bank.token()));
        console.log("  TokenBank.permit2():   ", address(bank.permit2()));
        console.log("  MyERC20.name():        ", token.name());
        console.log("  MyERC20.symbol():      ", token.symbol());
        console.log("  MyERC20.decimals():    ", token.decimals());
        console.log("  MyERC20.totalSupply(): ", token.totalSupply());
        
        console.log("\nFrontend Configuration:");
        console.log("Update frontend/utils/contracts.ts with:");
        console.log("");
        console.log("export const CONTRACT_ADDRESSES = {");
        console.log("  MyERC20: '%s',", address(token));
        console.log("  TokenBank: '%s',", address(bank));
        console.log("  MyNFT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',");
        console.log("  NFTMarket: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',");
        console.log("  MockPermit2: '%s',", address(permit2));
        console.log("} as const;");
        
        console.log("\n==================================");
        console.log("Integration Test Complete!");
        console.log("==================================");
        console.log("Frontend should now work with these addresses.");
        console.log("Visit: http://localhost:3000/bank");
        console.log("==================================");
    }
}

