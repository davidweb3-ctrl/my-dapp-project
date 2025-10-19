'use client';

import { useState } from 'react';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Permit2Utils, DepositError } from '../utils/permit2';

interface Permit2DepositFormProps {
  onDeposit: (amount: string) => Promise<void>;
  maxBalance?: bigint;
  isLoading?: boolean;
}

export default function Permit2DepositForm({ onDeposit, maxBalance, isLoading }: Permit2DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<DepositError | null>(null);

  // Validate amount on change
  const handleAmountChange = (value: string) => {
    setAmount(value);
    const validationError = Permit2Utils.validateAmount(value, maxBalance);
    setError(validationError);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = Permit2Utils.validateAmount(amount, maxBalance);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await onDeposit(amount);
  };

  const isValid = !error && amount && parseFloat(amount) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <Zap className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Permit2 Deposit</h3>
          <p className="text-sm text-gray-600">Gasless deposit with signature authorization</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Deposit
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              step="0.000000000000000001"
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                error
                  ? 'border-red-300 bg-red-50'
                  : isValid
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300'
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-sm text-gray-500">MERC20</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">{error.message}</p>
                {error.details && (
                  <p className="text-red-700 text-sm mt-1">{error.details}</p>
                )}
                {error.suggestion && (
                  <p className="text-red-600 text-sm mt-1">
                    💡 {error.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {isValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Ready to deposit</p>
                <p className="text-green-700 text-sm">
                  You will sign a message to authorize this deposit
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            '⚡ Sign & Deposit (One Step)'
          )}
        </button>
      </form>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How Permit2 Deposit Works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Sign a message to authorize the deposit (no gas cost)</li>
              <li>Deposit happens in the same transaction</li>
              <li>Uses Permit2 standard for universal approvals</li>
              <li>More efficient than traditional approve + deposit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

