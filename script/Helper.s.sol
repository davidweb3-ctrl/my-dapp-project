// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {TokenBank} from "../contracts/TokenBank.sol";
import {MyNFT} from "../contracts/MyNFT.sol";
import {NFTMarket} from "../contracts/NFTMarket.sol";

/**
 * @title HelperScript
 * @notice Helper functions and utilities for interacting with deployed contracts
 * @dev Contains various helper scripts for testing and interaction
 */
contract HelperScript is Script {
    // Contract addresses (update after deployment)
    address constant TOKEN_ADDRESS = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    address constant BANK_ADDRESS = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    address constant NFT_ADDRESS = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    address constant MARKET_ADDRESS = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
    
    MyERC20 public token;
    TokenBank public bank;
    MyNFT public nft;
    NFTMarket public market;
    
    function setUp() public {
        token = MyERC20(TOKEN_ADDRESS);
        bank = TokenBank(BANK_ADDRESS);
        nft = MyNFT(NFT_ADDRESS);
        market = NFTMarket(MARKET_ADDRESS);
    }
}

/**
 * @title TokenInteractScript
 * @notice Script for interacting with MyERC20 token
 * @dev Run with: forge script script/Helper.s.sol:TokenInteractScript --rpc-url <RPC_URL> --broadcast
 */
contract TokenInteractScript is HelperScript {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address sender = vm.addr(privateKey);
        
        setUp();
        
        console.log("==================================");
        console.log("Token Interaction Script");
        console.log("==================================");
        console.log("User:", sender);
        console.log("Token:", address(token));
        
        vm.startBroadcast(privateKey);
        
        // Check balance
        uint256 balance = token.balanceOf(sender);
        console.log("\nCurrent balance:", balance / 1e18, "MERC20");
        
        // Transfer tokens (example)
        address recipient = vm.envOr("RECIPIENT", address(0));
        if (recipient != address(0)) {
            uint256 amount = vm.envOr("AMOUNT", uint256(1000 * 1e18));
            console.log("\nTransferring", amount / 1e18, "MERC20 to", recipient);
            token.transfer(recipient, amount);
            console.log("Transfer successful!");
        }
        
        vm.stopBroadcast();
        
        console.log("==================================\n");
    }
}

/**
 * @title BankInteractScript
 * @notice Script for interacting with TokenBank
 * @dev Run with: forge script script/Helper.s.sol:BankInteractScript --rpc-url <RPC_URL> --broadcast
 */
contract BankInteractScript is HelperScript {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address sender = vm.addr(privateKey);
        
        setUp();
        
        console.log("==================================");
        console.log("Bank Interaction Script");
        console.log("==================================");
        console.log("User:", sender);
        console.log("Bank:", address(bank));
        
        vm.startBroadcast(privateKey);
        
        // Check balances
        uint256 walletBalance = token.balanceOf(sender);
        uint256 bankBalance = bank.balanceOf(sender);
        
        console.log("\nWallet balance:", walletBalance / 1e18, "MERC20");
        console.log("Bank balance:", bankBalance / 1e18, "MERC20");
        
        // Deposit (if DEPOSIT_AMOUNT is set)
        uint256 depositAmount = vm.envOr("DEPOSIT_AMOUNT", uint256(0));
        if (depositAmount > 0) {
            console.log("\nDepositing", depositAmount / 1e18, "MERC20...");
            token.approve(address(bank), depositAmount);
            bank.deposit(depositAmount);
            console.log("Deposit successful!");
            console.log("New bank balance:", bank.balanceOf(sender) / 1e18, "MERC20");
        }
        
        // Withdraw (if WITHDRAW_AMOUNT is set)
        uint256 withdrawAmount = vm.envOr("WITHDRAW_AMOUNT", uint256(0));
        if (withdrawAmount > 0) {
            console.log("\nWithdrawing", withdrawAmount / 1e18, "MERC20...");
            bank.withdraw(withdrawAmount);
            console.log("Withdrawal successful!");
            console.log("New wallet balance:", token.balanceOf(sender) / 1e18, "MERC20");
        }
        
        vm.stopBroadcast();
        
        console.log("==================================\n");
    }
}

/**
 * @title NFTInteractScript
 * @notice Script for interacting with MyNFT
 * @dev Run with: forge script script/Helper.s.sol:NFTInteractScript --rpc-url <RPC_URL> --broadcast
 */
contract NFTInteractScript is HelperScript {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address sender = vm.addr(privateKey);
        
        setUp();
        
        console.log("==================================");
        console.log("NFT Interaction Script");
        console.log("==================================");
        console.log("User:", sender);
        console.log("NFT Contract:", address(nft));
        
        vm.startBroadcast(privateKey);
        
        // Check balance
        uint256 balance = nft.balanceOf(sender);
        console.log("\nNFT balance:", balance);
        
        // Mint NFT (if MINT_TO and TOKEN_URI are set)
        address mintTo = vm.envOr("MINT_TO", address(0));
        string memory tokenURI = "";
        try vm.envString("TOKEN_URI") returns (string memory uri) {
            tokenURI = uri;
        } catch {
            // TOKEN_URI not set
        }
        
        if (mintTo != address(0) && bytes(tokenURI).length > 0) {
            console.log("\nMinting NFT to:", mintTo);
            console.log("Token URI:", tokenURI);
            uint256 tokenId = nft.mint(mintTo, tokenURI);
            console.log("Minted NFT #%s", tokenId);
        }
        
        // Get token URI (if TOKEN_ID is set)
        uint256 queryTokenId = vm.envOr("TOKEN_ID", uint256(0));
        if (queryTokenId < nft.totalSupply()) {
            string memory uri = nft.tokenURI(queryTokenId);
            console.log("\nToken #%s URI:", queryTokenId);
            console.log(uri);
        }
        
        vm.stopBroadcast();
        
        console.log("==================================\n");
    }
}

/**
 * @title MarketInteractScript
 * @notice Script for interacting with NFTMarket
 * @dev Run with: forge script script/Helper.s.sol:MarketInteractScript --rpc-url <RPC_URL> --broadcast
 */
contract MarketInteractScript is HelperScript {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address sender = vm.addr(privateKey);
        
        setUp();
        
        console.log("==================================");
        console.log("Market Interaction Script");
        console.log("==================================");
        console.log("User:", sender);
        console.log("Market:", address(market));
        
        vm.startBroadcast(privateKey);
        
        // List NFT (if LIST_TOKEN_ID and LIST_PRICE are set)
        uint256 listTokenId = vm.envOr("LIST_TOKEN_ID", type(uint256).max);
        uint256 listPrice = vm.envOr("LIST_PRICE", uint256(0));
        
        if (listTokenId != type(uint256).max && listPrice > 0) {
            console.log("\nListing NFT #%s for", listTokenId, listPrice / 1e18, "MERC20");
            nft.approve(address(market), listTokenId);
            market.list(listTokenId, listPrice);
            console.log("NFT listed successfully!");
        }
        
        // Buy NFT (if BUY_TOKEN_ID is set)
        uint256 buyTokenId = vm.envOr("BUY_TOKEN_ID", type(uint256).max);
        
        if (buyTokenId != type(uint256).max) {
            (address seller, uint256 price, bool isListed) = market.getListing(buyTokenId);
            
            if (isListed) {
                console.log("\nBuying NFT #%s", buyTokenId);
                console.log("Price:", price / 1e18, "MERC20");
                console.log("Seller:", seller);
                
                token.approve(address(market), price);
                market.buyNFT(buyTokenId);
                console.log("NFT purchased successfully!");
            } else {
                console.log("\nNFT #%s is not listed", buyTokenId);
            }
        }
        
        // View listing (if VIEW_TOKEN_ID is set)
        uint256 viewTokenId = vm.envOr("VIEW_TOKEN_ID", type(uint256).max);
        
        if (viewTokenId != type(uint256).max) {
            (address seller, uint256 price, bool isListed) = market.getListing(viewTokenId);
            console.log("\nNFT #%s Listing:", viewTokenId);
            console.log("  Seller:", seller);
            console.log("  Price:", price / 1e18, "MERC20");
            console.log("  Is Listed:", isListed);
        }
        
        vm.stopBroadcast();
        
        console.log("==================================\n");
    }
}

/**
 * @title StatusScript
 * @notice Script to check status of all contracts
 * @dev Run with: forge script script/Helper.s.sol:StatusScript --rpc-url <RPC_URL>
 */
contract StatusScript is Script {
    address constant TOKEN_ADDRESS = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    address constant BANK_ADDRESS = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    address constant NFT_ADDRESS = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    address constant MARKET_ADDRESS = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
    
    function run() external view {
        MyERC20 token = MyERC20(TOKEN_ADDRESS);
        TokenBank bank = TokenBank(BANK_ADDRESS);
        MyNFT nft = MyNFT(NFT_ADDRESS);
        NFTMarket market = NFTMarket(MARKET_ADDRESS);
        
        console.log("==================================");
        console.log("CONTRACT STATUS");
        console.log("==================================");
        
        // MyERC20 Status
        console.log("\n[MyERC20]");
        console.log("Address:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Total Supply:", token.totalSupply() / 1e18, "MERC20");
        
        // TokenBank Status
        console.log("\n[TokenBank]");
        console.log("Address:", address(bank));
        console.log("Token:", address(bank.token()));
        console.log("Total Deposits:", token.balanceOf(address(bank)) / 1e18, "MERC20");
        
        // MyNFT Status
        console.log("\n[MyNFT]");
        console.log("Address:", address(nft));
        console.log("Name:", nft.name());
        console.log("Symbol:", nft.symbol());
        console.log("Total Supply:", nft.totalSupply());
        console.log("Owner:", nft.owner());
        
        // NFTMarket Status
        console.log("\n[NFTMarket]");
        console.log("Address:", address(market));
        console.log("Payment Token:", address(market.paymentToken()));
        console.log("NFT Contract:", address(market.nftContract()));
        console.log("Owner:", market.owner());
        
        console.log("\n==================================\n");
    }
}

