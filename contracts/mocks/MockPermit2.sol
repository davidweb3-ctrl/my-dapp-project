// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IPermit2.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title MockPermit2
 * @notice Mock implementation of Permit2 for testing purposes
 * @dev This is a simplified version that allows testing without the full Permit2 complexity
 */
contract MockPermit2 is IPermit2, ERC165 {
    // Domain separator for EIP-712 (simplified for testing)
    bytes32 public constant DOMAIN_SEPARATOR = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    
    // Nonces for each owner
    mapping(address => uint256) private _nonces;
    
    // Allowances: owner => token => spender => (amount, expiration, nonce)
    mapping(address => mapping(address => mapping(address => uint160))) public allowances;
    mapping(address => mapping(address => mapping(address => uint48))) public allowanceExpirations;
    mapping(address => mapping(address => mapping(address => uint48))) public allowanceNonces;
    
    // Events
    event PermitTransferFromExecuted(
        address indexed owner,
        address indexed spender,
        uint160 amount,
        address indexed token,
        uint48 expiration,
        uint48 nonce
    );
    
    /**
     * @notice Get the nonce for an owner
     */
    function nonces(address owner) external view override returns (uint256) {
        return _nonces[owner];
    }
    
    /**
     * @notice Get allowance details
     */
    function allowance(
        address owner,
        address token,
        address spender
    ) external view override returns (uint160 amount, uint48 expiration, uint48 nonce) {
        return (
            allowances[owner][token][spender],
            allowanceExpirations[owner][token][spender],
            allowanceNonces[owner][token][spender]
        );
    }
    
    /**
     * @notice Permit a transfer from owner to spender
     * @dev This is a simplified implementation for testing
     */
    function permitTransferFrom(
        address owner,
        address spender,
        uint160 amount,
        address token,
        uint48 expiration,
        uint48 nonce,
        uint8 /* v */,
        bytes32 /* r */,
        bytes32 /* s */
    ) external override {
        // For testing purposes, we'll accept any signature
        // In a real implementation, this would verify the EIP-712 signature
        
        // Check if signature is expired
        require(block.timestamp <= expiration, "MockPermit2: signature expired");
        
        // Check nonce
        require(nonce == _nonces[owner], "MockPermit2: invalid nonce");
        
        // Update nonce
        _nonces[owner]++;
        
        // Set allowance in our mapping
        allowances[owner][token][spender] = amount;
        allowanceExpirations[owner][token][spender] = expiration;
        allowanceNonces[owner][token][spender] = nonce;
        
        // For testing: we need to set the ERC20 allowance first
        // In a real Permit2, this would be done differently
        // For now, we'll simulate this by calling approve from the owner
        // This is a simplified approach for testing
        
        emit PermitTransferFromExecuted(owner, spender, amount, token, expiration, nonce);
    }
    
    /**
     * @notice Helper function to set allowance for testing
     * @dev This is only for testing purposes
     */
    function setAllowance(
        address owner,
        address token,
        address spender,
        uint160 amount,
        uint48 expiration,
        uint48 nonce
    ) external {
        allowances[owner][token][spender] = amount;
        allowanceExpirations[owner][token][spender] = expiration;
        allowanceNonces[owner][token][spender] = nonce;
    }
    
    /**
     * @notice Helper function to increment nonce for testing
     * @dev This is only for testing purposes
     */
    function incrementNonce(address owner) external {
        _nonces[owner]++;
    }
    
    /**
     * @notice Mock ERC20-like functions to prevent frontend errors
     * @dev These are dummy functions to prevent automatic contract detection errors
     */
    function symbol() external pure returns (string memory) {
        return "PERMIT2";
    }
    
    function name() external pure returns (string memory) {
        return "MockPermit2";
    }
    
    function decimals() external pure returns (uint8) {
        return 18;
    }
    
    /**
     * @notice ERC165 interface support
     * @dev Returns true if the contract implements the interface
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IPermit2).interfaceId || super.supportsInterface(interfaceId);
    }
}
