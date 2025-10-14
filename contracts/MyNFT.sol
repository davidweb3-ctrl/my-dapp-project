// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyNFT
 * @dev ERC721 NFT contract with URI storage and owner-controlled minting
 * - Name: MyNFT
 * - Symbol: MNFT
 * - Only owner can mint new tokens
 */
contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /**
     * @dev Constructor sets the token name and symbol
     * Deployer becomes the initial owner
     */
    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }
    
    /**
     * @dev Mint a new NFT to the specified address
     * @param to The address that will receive the minted NFT
     * @param uri The metadata URI for the token
     * @return tokenId The ID of the newly minted token
     * 
     * Requirements:
     * - Only the owner can call this function
     * - `to` cannot be the zero address
     */
    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        require(to != address(0), "MyNFT: mint to the zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        return tokenId;
    }
    
    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId The token ID to query
     * @return The token URI string
     * 
     * Requirements:
     * - `tokenId` must exist
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Returns the total number of tokens minted
     * @return The current token ID counter
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

