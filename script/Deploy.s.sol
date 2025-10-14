// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MyNFT} from "../contracts/MyNFT.sol";
import {NFTMarket} from "../contracts/NFTMarket.sol";

/**
 * @title DeployScript
 * @notice Deployment script for all contracts in the project
 * @dev Run with: forge script script/Deploy.s.sol:DeployScript --rpc-url <RPC_URL> --broadcast
 */
contract DeployScript is Script {
    // Deployed contract addresses
    MyERC20 public token;
    TokenBank public bank;
    MyNFT public nft;
    NFTMarket public market;
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("==================================");
        console.log("Starting deployment...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        console.log("==================================");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MyERC20 Token
        console.log("\n1. Deploying MyERC20...");
        token = new MyERC20();
        console.log("MyERC20 deployed at:", address(token));
        console.log("   - Name:", token.name());
        console.log("   - Symbol:", token.symbol());
        console.log("   - Total Supply:", token.totalSupply());
        
        // 2. Deploy TokenBank
        console.log("\n2. Deploying TokenBank...");
        bank = new TokenBank(address(token));
        console.log("TokenBank deployed at:", address(bank));
        console.log("   - Token:", address(bank.token()));
        
        // 3. Deploy MyNFT
        console.log("\n3. Deploying MyNFT...");
        nft = new MyNFT();
        console.log("MyNFT deployed at:", address(nft));
        console.log("   - Name:", nft.name());
        console.log("   - Symbol:", nft.symbol());
        console.log("   - Owner:", nft.owner());
        
        // 4. Deploy NFTMarket
        console.log("\n4. Deploying NFTMarket...");
        market = new NFTMarket(address(token), address(nft));
        console.log("NFTMarket deployed at:", address(market));
        console.log("   - Payment Token:", address(market.paymentToken()));
        console.log("   - NFT Contract:", address(market.nftContract()));
        console.log("   - Owner:", market.owner());
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        // Print deployment summary
        printDeploymentSummary();
        
        // Print frontend configuration
        printFrontendConfig();
    }
    
    /**
     * @notice Print deployment summary
     */
    function printDeploymentSummary() internal view {
        console.log("\n==================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("==================================");
        console.log("MyERC20:    ", address(token));
        console.log("TokenBank:  ", address(bank));
        console.log("MyNFT:      ", address(nft));
        console.log("NFTMarket:  ", address(market));
        console.log("==================================");
    }
    
    /**
     * @notice Print frontend configuration
     */
    function printFrontendConfig() internal view {
        console.log("\n==================================");
        console.log("FRONTEND CONFIGURATION");
        console.log("==================================");
        console.log("Update frontend/utils/contracts.ts with:");
        console.log("");
        console.log("export const CONTRACT_ADDRESSES = {");
        console.log("  MyERC20: '%s',", address(token));
        console.log("  TokenBank: '%s',", address(bank));
        console.log("  MyNFT: '%s',", address(nft));
        console.log("  NFTMarket: '%s',", address(market));
        console.log("} as const;");
        console.log("==================================\n");
    }
}

/**
 * @title DeployAndSetupScript
 * @notice Extended deployment script with initial setup
 * @dev Run with: forge script script/Deploy.s.sol:DeployAndSetupScript --rpc-url <RPC_URL> --broadcast
 */
contract DeployAndSetupScript is Script {
    MyERC20 public token;
    TokenBank public bank;
    MyNFT public nft;
    NFTMarket public market;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==================================");
        console.log("Starting deployment with setup...");
        console.log("Deployer:", deployer);
        console.log("==================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy all contracts
        token = new MyERC20();
        bank = new TokenBank(address(token));
        nft = new MyNFT();
        market = new NFTMarket(address(token), address(nft));
        
        console.log("\nContracts deployed successfully!");
        console.log("MyERC20:    ", address(token));
        console.log("TokenBank:  ", address(bank));
        console.log("MyNFT:      ", address(nft));
        console.log("NFTMarket:  ", address(market));
        
        // Optional: Mint some test NFTs
        console.log("\n==================================");
        console.log("Minting test NFTs...");
        console.log("==================================");
        
        uint256 tokenId1 = nft.mint(deployer, "ipfs://QmTest1");
        console.log("Minted NFT #%s to deployer", tokenId1);
        
        uint256 tokenId2 = nft.mint(deployer, "ipfs://QmTest2");
        console.log("Minted NFT #%s to deployer", tokenId2);
        
        console.log("\nSetup completed!");
        
        vm.stopBroadcast();
        
        // Print summary
        console.log("\n==================================");
        console.log("DEPLOYMENT & SETUP COMPLETE");
        console.log("==================================");
        console.log("Deployer has:");
        console.log("  - %s MERC20 tokens", token.balanceOf(deployer) / 1e18);
        console.log("  - %s NFTs", nft.balanceOf(deployer));
        console.log("==================================\n");
    }
}

