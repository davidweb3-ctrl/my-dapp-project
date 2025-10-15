// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPermit2
 * @notice Interface for Permit2 functionality
 * @dev Based on Uniswap's Permit2 standard
 */
interface IPermit2 {
    /// @notice The domain separator used for permit signatures
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    
    /// @notice The nonce for a given owner
    function nonces(address owner) external view returns (uint256);
    
    /// @notice The allowance for a given owner, token, and spender
    function allowance(
        address owner,
        address token,
        address spender
    ) external view returns (uint160 amount, uint48 expiration, uint48 nonce);
    
    /// @notice Permit a transfer from owner to spender
    function permitTransferFrom(
        address owner,
        address spender,
        uint160 amount,
        address token,
        uint48 expiration,
        uint48 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

/**
 * @title PermitTransferFrom
 * @notice Struct for permit transfer data
 */
struct PermitTransferFrom {
    address token;
    uint160 amount;
    uint48 expiration;
    uint48 nonce;
}

/**
 * @title SignatureTransferDetails
 * @notice Struct for signature transfer details
 */
struct SignatureTransferDetails {
    address to;
    uint160 amount;
}
