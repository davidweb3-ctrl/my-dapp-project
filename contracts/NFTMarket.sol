// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title NFTMarket
 * @dev A marketplace for trading NFTs using MyERC20 tokens as payment
 * Features:
 * - List NFTs for sale
 * - Buy NFTs with ERC20 tokens
 * - Whitelist-based purchasing with EIP-712 signature verification
 */
contract NFTMarket is EIP712, Ownable, ERC165 {
    using ECDSA for bytes32;
    
    // Custom errors for gas optimization
    error PriceMustBeGreaterThanZero();
    error CallerNotOwner();
    error ContractNotApproved();
    error NFTAlreadyListed();
    error NFTNotListed();
    error SellerCannotBuyOwn();
    error InvalidWhitelistSignature();
    error SignatureExpired();
    error PaymentTransferFailed();
    error PaymentTokenAddressZero();
    error NFTContractAddressZero();
    error CallerNotSpecifiedBuyer();
    error PriceDoesNotMatchListing();
    error ArraysLengthMismatch();
    error TooManyItems();
    
    // The ERC20 token used for payments
    IERC20 public immutable paymentToken;
    
    // The NFT contract
    IERC721 public immutable nftContract;
    
    // Listing structure - optimized for gas efficiency
    struct Listing {
        address seller;    // 20 bytes
        uint128 price;     // 16 bytes (足够存储大部分价格)
        bool isListed;     // 1 byte
        // 总共37字节，打包到2个存储槽
    }
    
    // Mapping from token ID to listing
    mapping(uint256 => Listing) public listings;
    
    // Constants for gas optimization
    uint256 private constant MAX_BATCH_SIZE = 50;
    uint128 private constant MAX_PRICE = type(uint128).max;
    
    // EIP-712 type hash for whitelist verification
    bytes32 private constant WHITELIST_TYPEHASH = 
        keccak256("Whitelist(address buyer,uint256 tokenId,uint256 price,uint256 deadline)");
    
    // Events - optimized for gas efficiency
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint128 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint128 price);
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
        if (_paymentToken == address(0)) revert PaymentTokenAddressZero();
        if (_nftContract == address(0)) revert NFTContractAddressZero();
        
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
        if (price == 0 || price > MAX_PRICE) revert PriceMustBeGreaterThanZero();
        
        // 内联验证，减少函数调用
        address owner = nftContract.ownerOf(tokenId);
        if (owner != msg.sender) revert CallerNotOwner();
        
        // 优化授权检查
        address approved = nftContract.getApproved(tokenId);
        if (approved != address(this) && !nftContract.isApprovedForAll(msg.sender, address(this))) {
            revert ContractNotApproved();
        }
        
        // 使用存储指针而不是内存复制
        Listing storage listing = listings[tokenId];
        if (listing.isListed) revert NFTAlreadyListed();
        
        listing.seller = msg.sender;
        listing.price = uint128(price);
        listing.isListed = true;
        
        emit NFTListed(tokenId, msg.sender, uint128(price));
    }
    
    /**
     * @dev Internal function to execute transfers
     */
    function _executeTransfer(
        address seller,
        address buyer, 
        uint256 tokenId,
        uint128 price
    ) internal {
        // Transfer payment tokens from buyer to seller
        bool paymentSuccess = paymentToken.transferFrom(buyer, seller, price);
        if (!paymentSuccess) revert PaymentTransferFailed();
        
        // Transfer NFT from seller to buyer
        nftContract.safeTransferFrom(seller, buyer, tokenId);
        
        emit NFTSold(tokenId, seller, buyer, price);
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
        Listing storage listing = listings[tokenId];
        if (!listing.isListed) revert NFTNotListed();
        if (msg.sender == listing.seller) revert SellerCannotBuyOwn();
        
        // Store values before deletion
        address seller = listing.seller;
        uint128 price = listing.price;
        
        // Remove listing before transfers (Checks-Effects-Interactions)
        delete listings[tokenId];
        
        // Execute transfers
        _executeTransfer(seller, msg.sender, tokenId, price);
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
        if (msg.sender != buyer) revert CallerNotSpecifiedBuyer();
        if (block.timestamp > deadline) revert SignatureExpired();
        
        // 使用存储指针
        Listing storage listing = listings[tokenId];
        if (!listing.isListed) revert NFTNotListed();
        if (price != listing.price) revert PriceDoesNotMatchListing();
        if (buyer == listing.seller) revert SellerCannotBuyOwn();
        
        // 预计算哈希，减少重复计算
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
        if (signer != owner()) revert InvalidWhitelistSignature();
        
        // Store values before deletion
        address seller = listing.seller;
        uint128 listingPrice = listing.price;
        
        // 清理存储
        delete listings[tokenId];
        
        // 执行转账
        _executeTransfer(seller, buyer, tokenId, listingPrice);
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
        Listing storage listing = listings[tokenId];
        if (!listing.isListed) revert NFTNotListed();
        if (listing.seller != msg.sender) revert CallerNotOwner();
        
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
    
    /**
     * @dev Batch list multiple NFTs for sale
     * @param tokenIds Array of token IDs to list
     * @param prices Array of prices corresponding to each token ID
     */
    function batchList(
        uint256[] calldata tokenIds, 
        uint256[] calldata prices
    ) external {
        if (tokenIds.length != prices.length) revert ArraysLengthMismatch();
        if (tokenIds.length > MAX_BATCH_SIZE) revert TooManyItems();
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _listSingle(tokenIds[i], prices[i]);
        }
    }
    
    /**
     * @dev Batch cancel multiple listings
     * @param tokenIds Array of token IDs to cancel
     */
    function batchCancel(uint256[] calldata tokenIds) external {
        if (tokenIds.length > MAX_BATCH_SIZE) revert TooManyItems();
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _cancelSingle(tokenIds[i]);
        }
    }
    
    /**
     * @dev Internal function to cancel a single listing
     */
    function _cancelSingle(uint256 tokenId) internal {
        Listing storage listing = listings[tokenId];
        if (!listing.isListed) revert NFTNotListed();
        if (listing.seller != msg.sender) revert CallerNotOwner();
        
        delete listings[tokenId];
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Internal function to list a single NFT
     */
    function _listSingle(uint256 tokenId, uint256 price) internal {
        if (price == 0 || price > MAX_PRICE) revert PriceMustBeGreaterThanZero();
        
        // 内联验证，减少函数调用
        address owner = nftContract.ownerOf(tokenId);
        if (owner != msg.sender) revert CallerNotOwner();
        
        // 优化授权检查
        address approved = nftContract.getApproved(tokenId);
        if (approved != address(this) && !nftContract.isApprovedForAll(msg.sender, address(this))) {
            revert ContractNotApproved();
        }
        
        // 使用存储指针而不是内存复制
        Listing storage listing = listings[tokenId];
        if (listing.isListed) revert NFTAlreadyListed();
        
        listing.seller = msg.sender;
        listing.price = uint128(price);
        listing.isListed = true;
        
        emit NFTListed(tokenId, msg.sender, uint128(price));
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     * @param interfaceId The interface identifier, as specified in ERC-165
     * @return true if this contract implements the interface defined by interfaceId
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

