import { Address, Hash, parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from './contracts';

// Permit2 Types
export interface Permit2Data {
  owner: Address;
  spender: Address;
  amount: string;
  token: Address;
  expiration: number;
  nonce: number;
}

export interface Permit2Signature {
  v: number;
  r: Hash;
  s: Hash;
}

export interface BatchDepositItem {
  id: string;
  amount: string;
  isValid: boolean;
  error?: string;
}

export interface DepositError {
  type: 'validation' | 'signature' | 'transaction' | 'network';
  message: string;
  details?: string;
  suggestion?: string;
}

// Permit2 Utility Functions
export class Permit2Utils {
  /**
   * Generate Permit2 signature data for EIP-712
   */
  static getPermit2TypedData(
    owner: Address,
    spender: Address,
    amount: string,
    token: Address,
    expiration: number,
    nonce: number,
    chainId: number
  ) {
    const domain = {
      name: 'Permit2',
      version: '1',
      chainId: chainId,
      verifyingContract: CONTRACT_ADDRESSES.MockPermit2 as Address,
    };

    const types = {
      PermitTransferFrom: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    };

    const value = {
      token,
      amount: parseUnits(amount, 18),
      expiration: BigInt(expiration),
      nonce: BigInt(nonce),
    };

    return {
      domain,
      types,
      primaryType: 'PermitTransferFrom' as const,
      message: value,
    };
  }

  /**
   * Split signature into v, r, s components
   */
  static splitSignature(signature: Hash): Permit2Signature {
    const r = `0x${signature.slice(2, 66)}` as Hash;
    const s = `0x${signature.slice(66, 130)}` as Hash;
    const v = parseInt(signature.slice(130, 132), 16);
    
    return { v, r, s };
  }

  /**
   * Validate deposit amount
   */
  static validateAmount(amount: string, maxBalance?: bigint): DepositError | null {
    if (!amount || amount.trim() === '') {
      return {
        type: 'validation',
        message: 'Amount is required',
        suggestion: 'Please enter a valid amount to deposit',
      };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        type: 'validation',
        message: 'Invalid amount',
        suggestion: 'Please enter a positive number',
      };
    }

    if (numAmount > Number.MAX_SAFE_INTEGER) {
      return {
        type: 'validation',
        message: 'Amount too large',
        suggestion: 'Please enter a smaller amount',
      };
    }

    const parsedAmount = parseUnits(amount, 18);
    if (maxBalance && parsedAmount > maxBalance) {
      return {
        type: 'validation',
        message: 'Insufficient balance',
        details: `You have ${formatUnits(maxBalance, 18)} tokens available`,
        suggestion: 'Please enter an amount within your available balance',
      };
    }

    return null;
  }

  /**
   * Validate batch deposit items
   */
  static validateBatchDeposits(items: BatchDepositItem[], maxBalance?: bigint): BatchDepositItem[] {
    return items.map(item => {
      const error = this.validateAmount(item.amount, maxBalance);
      return {
        ...item,
        isValid: !error,
        error: error?.message,
      };
    });
  }

  /**
   * Calculate total amount for batch deposits
   */
  static calculateBatchTotal(items: BatchDepositItem[]): string {
    const total = items.reduce((sum, item) => {
      if (item.isValid && item.amount) {
        return sum + parseFloat(item.amount);
      }
      return sum;
    }, 0);
    
    return total.toString();
  }

  /**
   * Generate unique ID for batch items
   */
  static generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format error message for user display
   */
  static formatError(error: DepositError): string {
    let message = error.message;
    
    if (error.details) {
      message += ` (${error.details})`;
    }
    
    return message;
  }

  /**
   * Get user-friendly error suggestions
   */
  static getErrorSuggestion(error: DepositError): string {
    if (error.suggestion) {
      return error.suggestion;
    }

    switch (error.type) {
      case 'validation':
        return 'Please check your input and try again';
      case 'signature':
        return 'Please try signing again or check your wallet connection';
      case 'transaction':
        return 'The transaction failed. Please try again or contact support';
      case 'network':
        return 'Network error. Please check your connection and try again';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  }

  /**
   * Check if signature is expired
   */
  static isSignatureExpired(expiration: number): boolean {
    return Date.now() / 1000 > expiration;
  }

  /**
   * Get default expiration time (1 hour from now)
   */
  static getDefaultExpiration(): number {
    return Math.floor(Date.now() / 1000) + 3600; // 1 hour
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: string, decimals: number = 4): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    return num.toFixed(decimals);
  }

  /**
   * Parse amount from string to bigint
   */
  static parseAmount(amount: string): bigint {
    return parseUnits(amount, 18);
  }

  /**
   * Format bigint amount to string
   */
  static formatBigIntAmount(amount: bigint): string {
    return formatUnits(amount, 18);
  }
}

// Error Messages
export const ERROR_MESSAGES = {
  SIGNATURE_REJECTED: 'Signature was rejected by user',
  SIGNATURE_EXPIRED: 'Signature has expired',
  INSUFFICIENT_BALANCE: 'Insufficient token balance',
  INVALID_AMOUNT: 'Invalid deposit amount',
  NETWORK_ERROR: 'Network connection error',
  TRANSACTION_FAILED: 'Transaction failed to execute',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INVALID_NONCE: 'Invalid nonce value',
  PERMIT2_ERROR: 'Permit2 operation failed',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DEPOSIT_SUCCESS: 'Deposit completed successfully',
  BATCH_DEPOSIT_SUCCESS: 'Batch deposit completed successfully',
  SIGNATURE_SUCCESS: 'Signature created successfully',
  PERMIT2_DEPOSIT: 'Permit2 deposit completed successfully! 🎉',
  BATCH_DEPOSIT: 'Batch deposit completed successfully! 🎉',
  DEPOSIT: 'Deposit completed successfully! 🎉',
  WITHDRAW: 'Withdrawal completed successfully! 🎉',
} as const;

