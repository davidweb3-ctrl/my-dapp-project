// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MyNFT} from "../contracts/MyNFT.sol";

contract MyNFTTest is Test {
    MyNFT public nft;
    
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        nft = new MyNFT();
    }
    
    function testConstructor() public view {
        assertEq(nft.name(), "MyNFT");
        assertEq(nft.symbol(), "MNFT");
        assertEq(nft.owner(), owner);
        assertEq(nft.totalSupply(), 0);
    }
    
    function testMintByOwner() public {
        string memory tokenURI = "ipfs://QmTest1";
        
        uint256 tokenId = nft.mint(user1, tokenURI);
        
        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(tokenId), user1);
        assertEq(nft.tokenURI(tokenId), tokenURI);
        assertEq(nft.totalSupply(), 1);
    }
    
    function testMintMultipleNFTs() public {
        string memory uri1 = "ipfs://QmTest1";
        string memory uri2 = "ipfs://QmTest2";
        string memory uri3 = "ipfs://QmTest3";
        
        uint256 tokenId1 = nft.mint(user1, uri1);
        uint256 tokenId2 = nft.mint(user2, uri2);
        uint256 tokenId3 = nft.mint(user1, uri3);
        
        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
        assertEq(tokenId3, 2);
        
        assertEq(nft.ownerOf(tokenId1), user1);
        assertEq(nft.ownerOf(tokenId2), user2);
        assertEq(nft.ownerOf(tokenId3), user1);
        
        assertEq(nft.tokenURI(tokenId1), uri1);
        assertEq(nft.tokenURI(tokenId2), uri2);
        assertEq(nft.tokenURI(tokenId3), uri3);
        
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.balanceOf(user1), 2);
        assertEq(nft.balanceOf(user2), 1);
    }
    
    function testMintByNonOwnerFails() public {
        vm.prank(user1);
        vm.expectRevert();
        nft.mint(user2, "ipfs://QmTest");
    }
    
    function testMintToZeroAddressFails() public {
        vm.expectRevert("MyNFT: mint to the zero address");
        nft.mint(address(0), "ipfs://QmTest");
    }
    
    function testTransferNFT() public {
        uint256 tokenId = nft.mint(user1, "ipfs://QmTest");
        
        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
        assertEq(nft.balanceOf(user1), 0);
        assertEq(nft.balanceOf(user2), 1);
    }
    
    function testApproveAndTransfer() public {
        uint256 tokenId = nft.mint(user1, "ipfs://QmTest");
        
        vm.prank(user1);
        nft.approve(user2, tokenId);
        
        assertEq(nft.getApproved(tokenId), user2);
        
        vm.prank(user2);
        nft.transferFrom(user1, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
    }
    
    function testSetApprovalForAll() public {
        nft.mint(user1, "ipfs://QmTest1");
        nft.mint(user1, "ipfs://QmTest2");
        
        vm.prank(user1);
        nft.setApprovalForAll(user2, true);
        
        assertTrue(nft.isApprovedForAll(user1, user2));
        
        // user2 can now transfer any of user1's tokens
        vm.prank(user2);
        nft.transferFrom(user1, user2, 0);
        
        assertEq(nft.ownerOf(0), user2);
    }
    
    function testSafeTransferFrom() public {
        uint256 tokenId = nft.mint(user1, "ipfs://QmTest");
        
        vm.prank(user1);
        nft.safeTransferFrom(user1, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
    }
    
    function testBurnNotImplemented() public {
        uint256 tokenId = nft.mint(user1, "ipfs://QmTest");
        
        // ERC721 doesn't have burn by default, but we can test ownership
        assertEq(nft.ownerOf(tokenId), user1);
    }
    
    function testTokenURINonExistentToken() public {
        vm.expectRevert();
        nft.tokenURI(999);
    }
    
    function testOwnerOfNonExistentToken() public {
        vm.expectRevert();
        nft.ownerOf(999);
    }
    
    function testSupportsInterface() public view {
        // ERC721 interface ID
        assertTrue(nft.supportsInterface(0x80ac58cd));
        // ERC721Metadata interface ID
        assertTrue(nft.supportsInterface(0x5b5e139f));
        // ERC165 interface ID
        assertTrue(nft.supportsInterface(0x01ffc9a7));
    }
    
    function testBalanceOf() public {
        assertEq(nft.balanceOf(user1), 0);
        
        nft.mint(user1, "ipfs://QmTest1");
        assertEq(nft.balanceOf(user1), 1);
        
        nft.mint(user1, "ipfs://QmTest2");
        assertEq(nft.balanceOf(user1), 2);
        
        nft.mint(user2, "ipfs://QmTest3");
        assertEq(nft.balanceOf(user1), 2);
        assertEq(nft.balanceOf(user2), 1);
    }
    
    function testBalanceOfZeroAddress() public {
        vm.expectRevert();
        nft.balanceOf(address(0));
    }
    
    function testTransferOwnership() public {
        assertEq(nft.owner(), owner);
        
        nft.transferOwnership(user1);
        assertEq(nft.owner(), user1);
        
        // Original owner can no longer mint
        vm.expectRevert();
        nft.mint(user2, "ipfs://QmTest");
        
        // New owner can mint
        vm.prank(user1);
        uint256 tokenId = nft.mint(user2, "ipfs://QmTest");
        assertEq(nft.ownerOf(tokenId), user2);
    }
    
    function testFuzzMint(address to, string memory uri) public {
        vm.assume(to != address(0));
        vm.assume(bytes(uri).length > 0);
        
        uint256 tokenId = nft.mint(to, uri);
        
        assertEq(nft.ownerOf(tokenId), to);
        assertEq(nft.tokenURI(tokenId), uri);
    }
}

