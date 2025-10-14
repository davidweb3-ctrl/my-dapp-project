// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MyERC20} from "../contracts/MyERC20.sol";
import {MyNFT} from "../contracts/MyNFT.sol";
import {NFTMarket} from "../contracts/NFTMarket.sol";

contract NFTMarketTest is Test {
    MyERC20 public token;
    MyNFT public nft;
    NFTMarket public market;
    
    address public owner;
    address public seller;
    address public buyer;
    
    uint256 sellerPrivateKey = 0xA11CE;
    uint256 buyerPrivateKey = 0xB0B;
    uint256 ownerPrivateKey = 0xDEAD;
    
    // Events from NFTMarket contract
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    
    function setUp() public {
        owner = vm.addr(ownerPrivateKey);
        seller = vm.addr(sellerPrivateKey);
        buyer = vm.addr(buyerPrivateKey);
        
        vm.startPrank(owner);
        token = new MyERC20();
        nft = new MyNFT();
        market = new NFTMarket(address(token), address(nft));
        vm.stopPrank();
        
        // Distribute tokens
        vm.startPrank(owner);
        token.transfer(seller, 50000 * 10**18);
        token.transfer(buyer, 50000 * 10**18);
        vm.stopPrank();
    }
    
    function testConstructor() public view {
        assertEq(address(market.paymentToken()), address(token));
        assertEq(address(market.nftContract()), address(nft));
        assertEq(market.owner(), owner);
    }
    
    function testConstructorZeroAddresses() public {
        vm.startPrank(owner);
        
        vm.expectRevert("NFTMarket: payment token address cannot be zero");
        new NFTMarket(address(0), address(nft));
        
        vm.expectRevert("NFTMarket: NFT contract address cannot be zero");
        new NFTMarket(address(token), address(0));
        
        vm.stopPrank();
    }
    
    function testListNFT() public {
        // Mint NFT to seller
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        uint256 price = 1000 * 10**18;
        
        // Approve market to transfer NFT
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        
        vm.expectEmit(true, true, false, true);
        emit NFTListed(tokenId, seller, price);
        
        market.list(tokenId, price);
        vm.stopPrank();
        
        (address listedSeller, uint256 listedPrice, bool isListed) = market.getListing(tokenId);
        assertEq(listedSeller, seller);
        assertEq(listedPrice, price);
        assertTrue(isListed);
    }
    
    function testListNFTZeroPrice() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.prank(seller);
        vm.expectRevert("NFTMarket: price must be greater than 0");
        market.list(tokenId, 0);
    }
    
    function testListNFTNotOwner() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.prank(buyer);
        vm.expectRevert("NFTMarket: caller is not the owner");
        market.list(tokenId, 1000 * 10**18);
    }
    
    function testListNFTNotApproved() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.prank(seller);
        vm.expectRevert("NFTMarket: contract not approved to transfer NFT");
        market.list(tokenId, 1000 * 10**18);
    }
    
    function testListNFTAlreadyListed() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, 1000 * 10**18);
        
        vm.expectRevert("NFTMarket: NFT already listed");
        market.list(tokenId, 2000 * 10**18);
        vm.stopPrank();
    }
    
    function testBuyNFT() public {
        // Setup: Mint and list NFT
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        uint256 price = 1000 * 10**18;
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, price);
        vm.stopPrank();
        
        // Buyer approves tokens and buys NFT
        uint256 sellerBalanceBefore = token.balanceOf(seller);
        uint256 buyerBalanceBefore = token.balanceOf(buyer);
        
        vm.startPrank(buyer);
        token.approve(address(market), price);
        
        vm.expectEmit(true, true, true, true);
        emit NFTSold(tokenId, seller, buyer, price);
        
        market.buyNFT(tokenId);
        vm.stopPrank();
        
        // Verify ownership transferred
        assertEq(nft.ownerOf(tokenId), buyer);
        
        // Verify payment transferred
        assertEq(token.balanceOf(seller), sellerBalanceBefore + price);
        assertEq(token.balanceOf(buyer), buyerBalanceBefore - price);
        
        // Verify listing removed
        (, , bool isListed) = market.getListing(tokenId);
        assertFalse(isListed);
    }
    
    function testBuyNFTNotListed() public {
        vm.prank(buyer);
        vm.expectRevert("NFTMarket: NFT not listed for sale");
        market.buyNFT(999);
    }
    
    function testBuyNFTSellerCannotBuyOwn() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, 1000 * 10**18);
        
        vm.expectRevert("NFTMarket: seller cannot buy their own NFT");
        market.buyNFT(tokenId);
        vm.stopPrank();
    }
    
    function testCancelListing() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, 1000 * 10**18);
        
        vm.expectEmit(true, true, false, false);
        emit ListingCancelled(tokenId, seller);
        
        market.cancelListing(tokenId);
        vm.stopPrank();
        
        (, , bool isListed) = market.getListing(tokenId);
        assertFalse(isListed);
    }
    
    function testCancelListingNotListed() public {
        vm.prank(seller);
        vm.expectRevert("NFTMarket: NFT not listed");
        market.cancelListing(0);
    }
    
    function testCancelListingNotSeller() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, 1000 * 10**18);
        vm.stopPrank();
        
        vm.prank(buyer);
        vm.expectRevert("NFTMarket: caller is not the seller");
        market.cancelListing(tokenId);
    }
    
    function testPermitBuy() public {
        // Setup: Mint and list NFT
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        uint256 price = 1000 * 10**18;
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, price);
        vm.stopPrank();
        
        // Buyer approves tokens
        vm.prank(buyer);
        token.approve(address(market), price);
        
        // Create whitelist signature from market owner
        uint256 deadline = block.timestamp + 1 days;
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Whitelist(address buyer,uint256 tokenId,uint256 price,uint256 deadline)"),
                buyer,
                tokenId,
                price,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                market.getDomainSeparator(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        
        // Execute permitBuy
        uint256 sellerBalanceBefore = token.balanceOf(seller);
        
        vm.prank(buyer);
        vm.expectEmit(true, true, true, true);
        emit NFTSold(tokenId, seller, buyer, price);
        
        market.permitBuy(buyer, tokenId, price, deadline, v, r, s);
        
        // Verify
        assertEq(nft.ownerOf(tokenId), buyer);
        assertEq(token.balanceOf(seller), sellerBalanceBefore + price);
    }
    
    function testPermitBuyWrongCaller() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        uint256 price = 1000 * 10**18;
        uint256 deadline = block.timestamp + 1 days;
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, price);
        vm.stopPrank();
        
        // Someone else tries to use buyer's whitelist
        vm.prank(address(0x123));
        vm.expectRevert("NFTMarket: caller is not the specified buyer");
        market.permitBuy(buyer, tokenId, price, deadline, 0, bytes32(0), bytes32(0));
    }
    
    function testPermitBuyExpired() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        uint256 price = 1000 * 10**18;
        uint256 deadline = block.timestamp;
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, price);
        vm.stopPrank();
        
        // Fast forward time
        vm.warp(deadline + 1);
        
        vm.prank(buyer);
        vm.expectRevert("NFTMarket: signature expired");
        market.permitBuy(buyer, tokenId, price, deadline, 0, bytes32(0), bytes32(0));
    }
    
    function testPermitBuyInvalidSignature() public {
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        uint256 price = 1000 * 10**18;
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, price);
        vm.stopPrank();
        
        uint256 deadline = block.timestamp + 1 days;
        
        // Create signature with wrong private key
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Whitelist(address buyer,uint256 tokenId,uint256 price,uint256 deadline)"),
                buyer,
                tokenId,
                price,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                market.getDomainSeparator(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sellerPrivateKey, digest); // Wrong signer
        
        vm.prank(buyer);
        vm.expectRevert("NFTMarket: invalid whitelist signature");
        market.permitBuy(buyer, tokenId, price, deadline, v, r, s);
    }
    
    function testGetWhitelistHash() public view {
        uint256 tokenId = 0;
        uint256 price = 1000 * 10**18;
        uint256 deadline = block.timestamp + 1 days;
        
        bytes32 hash = market.getWhitelistHash(buyer, tokenId, price, deadline);
        assertTrue(hash != bytes32(0));
    }
    
    function testMultipleListingsAndSales() public {
        // Mint multiple NFTs
        vm.startPrank(owner);
        uint256 tokenId1 = nft.mint(seller, "ipfs://QmTest1");
        uint256 tokenId2 = nft.mint(seller, "ipfs://QmTest2");
        vm.stopPrank();
        
        uint256 price1 = 1000 * 10**18;
        uint256 price2 = 2000 * 10**18;
        
        // List both
        vm.startPrank(seller);
        nft.approve(address(market), tokenId1);
        nft.approve(address(market), tokenId2);
        market.list(tokenId1, price1);
        market.list(tokenId2, price2);
        vm.stopPrank();
        
        // Buy first NFT
        vm.startPrank(buyer);
        token.approve(address(market), price1 + price2);
        market.buyNFT(tokenId1);
        vm.stopPrank();
        
        assertEq(nft.ownerOf(tokenId1), buyer);
        assertEq(nft.ownerOf(tokenId2), seller);
        
        // Second NFT still listed
        (, , bool isListed) = market.getListing(tokenId2);
        assertTrue(isListed);
    }
    
    function testFuzzListPrice(uint256 price) public {
        vm.assume(price > 0 && price < type(uint256).max / 2);
        
        vm.prank(owner);
        uint256 tokenId = nft.mint(seller, "ipfs://QmTest");
        
        vm.startPrank(seller);
        nft.approve(address(market), tokenId);
        market.list(tokenId, price);
        vm.stopPrank();
        
        (, uint256 listedPrice, ) = market.getListing(tokenId);
        assertEq(listedPrice, price);
    }
}

