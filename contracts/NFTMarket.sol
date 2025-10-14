// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarket
 * @dev A marketplace for trading NFTs using MyERC20 tokens as payment
 * Features:
 * - List NFTs for sale
 * - Buy NFTs with ERC20 tokens
 * - Whitelist-based purchasing with EIP-712 signature verification
 */
contract NFTMarket is EIP712, Ownable {
    using ECDSA for bytes32;
    
    // The ERC20 token used for payments
    IERC20 public immutable paymentToken;
    
    // The NFT contract
    IERC721 public immutable nftContract;
    
    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool isListed;
    }
    
    // Mapping from token ID to listing
    mapping(uint256 => Listing) public listings;
    
    // EIP-712 type hash for whitelist verification
    bytes32 private constant WHITELIST_TYPEHASH = 
        keccak256("Whitelist(address buyer,uint256 tokenId,uint256 price,uint256 deadline)");
    
    // Events
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    
    /**
     * @dev Constructor
     * @param _paymentToken Address of the ERC20 token used for payments
     * @param _nftContract Address of the NFT contract
     */
    constructor(address _paymentToken, address _nftContract) 
        EIP712("NFTMarket", "1") 
        Ownable(msg.sender) 
    {
        require(_paymentToken != address(0), "NFTMarket: payment token address cannot be zero");
        require(_nftContract != address(0), "NFTMarket: NFT contract address cannot be zero");
        
        paymentToken = IERC20(_paymentToken);
        nftContract = IERC721(_nftContract);
    }
    
    /**
     * @dev List an NFT for sale
     * @param tokenId The ID of the NFT to list
     * @param price The price in payment tokens
     * 
     * Requirements:
     * - Caller must be the owner of the NFT
     * - NFT must be approved for transfer by this contract
     * - Price must be greater than 0
     */
    function list(uint256 tokenId, uint256 price) external {
        require(price > 0, "NFTMarket: price must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "NFTMarket: caller is not the owner");
        require(
            nftContract.getApproved(tokenId) == address(this) || 
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "NFTMarket: contract not approved to transfer NFT"
        );
        require(!listings[tokenId].isListed, "NFTMarket: NFT already listed");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isListed: true
        });
        
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy an NFT that is listed for sale
     * @param tokenId The ID of the NFT to buy
     * 
     * Requirements:
     * - NFT must be listed
     * - Caller must have approved this contract to spend sufficient tokens
     * - Caller must have sufficient token balance
     */
    function buyNFT(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.isListed, "NFTMarket: NFT not listed for sale");
        require(msg.sender != listing.seller, "NFTMarket: seller cannot buy their own NFT");
        
        // Remove listing before transfers (Checks-Effects-Interactions)
        delete listings[tokenId];
        
        // Transfer payment tokens from buyer to seller
        bool paymentSuccess = paymentToken.transferFrom(msg.sender, listing.seller, listing.price);
        require(paymentSuccess, "NFTMarket: payment transfer failed");
        
        // Transfer NFT from seller to buyer
        nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }
    
    /**
     * @dev Buy an NFT using whitelist signature verification (EIP-712)
     * Only users with valid signatures from the owner can purchase
     * @param buyer The address of the buyer (must be msg.sender)
     * @param tokenId The ID of the NFT to buy
     * @param price The price agreed upon in the signature
     * @param deadline The deadline timestamp for the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     * 
     * Requirements:
     * - Signature must be valid and signed by the contract owner
     * - Caller must be the buyer specified in the signature
     * - Signature must not be expired
     * - NFT must be listed
     * - Price must match the listing price
     */
    function permitBuy(
        address buyer,
        uint256 tokenId,
        uint256 price,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(msg.sender == buyer, "NFTMarket: caller is not the specified buyer");
        require(block.timestamp <= deadline, "NFTMarket: signature expired");
        
        Listing memory listing = listings[tokenId];
        require(listing.isListed, "NFTMarket: NFT not listed for sale");
        require(price == listing.price, "NFTMarket: price does not match listing");
        require(buyer != listing.seller, "NFTMarket: seller cannot buy their own NFT");
        
        // Verify EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                WHITELIST_TYPEHASH,
                buyer,
                tokenId,
                price,
                deadline
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(v, r, s);
        
        require(signer == owner(), "NFTMarket: invalid whitelist signature");
        
        // Remove listing before transfers (Checks-Effects-Interactions)
        delete listings[tokenId];
        
        // Transfer payment tokens from buyer to seller
        bool paymentSuccess = paymentToken.transferFrom(buyer, listing.seller, listing.price);
        require(paymentSuccess, "NFTMarket: payment transfer failed");
        
        // Transfer NFT from seller to buyer
        nftContract.safeTransferFrom(listing.seller, buyer, tokenId);
        
        emit NFTSold(tokenId, listing.seller, buyer, listing.price);
    }
    
    /**
     * @dev Cancel a listing
     * @param tokenId The ID of the NFT to delist
     * 
     * Requirements:
     * - Caller must be the seller of the listing
     * - NFT must be listed
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.isListed, "NFTMarket: NFT not listed");
        require(listing.seller == msg.sender, "NFTMarket: caller is not the seller");
        
        delete listings[tokenId];
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Get listing information for a token
     * @param tokenId The ID of the NFT
     * @return seller The address of the seller
     * @return price The listing price
     * @return isListed Whether the NFT is currently listed
     */
    function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool isListed) {
        Listing memory listing = listings[tokenId];
        return (listing.seller, listing.price, listing.isListed);
    }
    
    /**
     * @dev Returns the domain separator for EIP-712 signatures
     * @return The domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    /**
     * @dev Compute the EIP-712 hash for whitelist verification
     * Useful for off-chain signature generation
     * @param buyer The buyer address
     * @param tokenId The token ID
     * @param price The price
     * @param deadline The signature deadline
     * @return The typed data hash
     */
    function getWhitelistHash(
        address buyer,
        uint256 tokenId,
        uint256 price,
        uint256 deadline
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                WHITELIST_TYPEHASH,
                buyer,
                tokenId,
                price,
                deadline
            )
        );
        return _hashTypedDataV4(structHash);
    }
}

