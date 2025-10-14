// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/**
 * @title TokenBank
 * @dev A simple bank contract that allows users to deposit and withdraw MyERC20 tokens
 * Supports EIP-2612 permit functionality for gasless approvals
 */
contract TokenBank {
    // The ERC20 token that this bank accepts
    IERC20 public immutable token;
    
    // Track each user's deposit balance
    mapping(address => uint256) public balances;
    
    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    
    /**
     * @dev Constructor sets the token address
     * @param _token Address of the MyERC20 token contract
     */
    constructor(address _token) {
        require(_token != address(0), "TokenBank: token address cannot be zero");
        token = IERC20(_token);
    }
    
    /**
     * @dev Deposit tokens into the bank
     * @param amount The amount of tokens to deposit
     * 
     * Requirements:
     * - amount must be greater than 0
     * - caller must have approved this contract to spend at least `amount` tokens
     * - caller must have sufficient token balance
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "TokenBank: deposit amount must be greater than 0");
        
        // Update balance before transfer (Checks-Effects-Interactions pattern)
        balances[msg.sender] += amount;
        
        // Transfer tokens from user to this contract
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "TokenBank: token transfer failed");
        
        emit Deposit(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw tokens from the bank
     * @param amount The amount of tokens to withdraw
     * 
     * Requirements:
     * - amount must be greater than 0
     * - caller must have sufficient balance in the bank
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "TokenBank: withdraw amount must be greater than 0");
        require(balances[msg.sender] >= amount, "TokenBank: insufficient balance");
        
        // Update balance before transfer (Checks-Effects-Interactions pattern)
        balances[msg.sender] -= amount;
        
        // Transfer tokens from this contract to user
        bool success = token.transfer(msg.sender, amount);
        require(success, "TokenBank: token transfer failed");
        
        emit Withdraw(msg.sender, amount);
    }
    
    /**
     * @dev Deposit tokens using EIP-2612 permit signature
     * This allows users to deposit without a prior approve transaction
     * @param owner The address that owns the tokens and signed the permit
     * @param amount The amount of tokens to deposit
     * @param deadline The deadline timestamp for the permit signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     * 
     * Requirements:
     * - amount must be greater than 0
     * - permit signature must be valid
     * - owner must have sufficient token balance
     */
    function permitDeposit(
        address owner,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(amount > 0, "TokenBank: deposit amount must be greater than 0");
        require(owner != address(0), "TokenBank: owner address cannot be zero");
        
        // Execute permit to approve this contract to spend owner's tokens
        IERC20Permit(address(token)).permit(
            owner,
            address(this),
            amount,
            deadline,
            v,
            r,
            s
        );
        
        // Update balance before transfer (Checks-Effects-Interactions pattern)
        balances[owner] += amount;
        
        // Transfer tokens from owner to this contract
        bool success = token.transferFrom(owner, address(this), amount);
        require(success, "TokenBank: token transfer failed");
        
        emit Deposit(owner, amount);
    }
    
    /**
     * @dev Get the deposit balance of an account
     * @param account The address to query
     * @return The deposit balance of the account
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
    
    /**
     * @dev Get the total amount of tokens held by this contract
     * @return The total token balance of this contract
     */
    function totalDeposits() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}

