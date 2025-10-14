// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title MyERC20
 * @dev Implementation of ERC20 token with EIP-2612 permit functionality
 * - Name: MyERC20
 * - Symbol: MERC20
 * - Decimals: 18
 * - Total Supply: 100,000,000 tokens
 */
contract MyERC20 is ERC20, ERC20Permit {
    /**
     * @dev Constructor that mints the entire supply to the deployer
     */
    constructor() ERC20("MyERC20", "MERC20") ERC20Permit("MyERC20") {
        // Mint 100,000,000 tokens to the deployer
        _mint(msg.sender, 100_000_000 * 10**18);
    }

    /**
     * @dev Returns the number of decimals used for token amounts.
     * @return uint8 The number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     * @param to The address to transfer to
     * @param amount The amount to be transferred
     * @return bool Returns true if the operation succeeded
     * 
     * Requirements:
     * - `to` cannot be the zero address
     * - the caller must have a balance of at least `amount`
     * 
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        require(balanceOf(owner) >= amount, "ERC20: transfer amount exceeds balance");
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the allowance mechanism.
     * `amount` is then deducted from the caller's allowance.
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to be transferred
     * @return bool Returns true if the operation succeeded
     * 
     * Requirements:
     * - `from` and `to` cannot be the zero address
     * - `from` must have a balance of at least `amount`
     * - the caller must have allowance for `from`'s tokens of at least `amount`
     * 
     * Emits a {Transfer} event.
     * Emits an {Approval} event indicating the updated allowance.
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = _msgSender();
        require(balanceOf(from) >= amount, "ERC20: transfer amount exceeds balance");
        require(allowance(from, spender) >= amount, "ERC20: transfer amount exceeds allowance");
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}.
     * @param owner The address which owns the tokens
     * @param spender The address which will spend the tokens
     * @return uint256 The remaining allowance
     */
    function allowance(address owner, address spender) public view override returns (uint256) {
        return super.allowance(owner, spender);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     * @param spender The address which will spend the funds
     * @param amount The amount of tokens to be spent
     * @return bool Returns true if the operation succeeded
     * 
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) public override returns (bool) {
        return super.approve(spender, amount);
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     * @param account The address to query the balance of
     * @return uint256 The balance of the account
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account);
    }

    /**
     * @dev Returns the amount of tokens in existence.
     * @return uint256 The total supply of tokens
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }
}

