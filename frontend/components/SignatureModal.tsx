'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => Promise<void>;
  title: string;
  message: string;
  amount?: string;
  expiration?: number;
  isLoading?: boolean;
  error?: string;
  type: 'permit2' | 'batch';
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSign,
  title,
  message,
  amount,
  expiration,
  isLoading = false,
  error,
  type,
}: SignatureModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Countdown timer for signature expiration
  useEffect(() => {
    if (!isOpen || !expiration) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiration - now;
      setCountdown(remaining > 0 ? remaining : 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isOpen, expiration]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              type === 'permit2' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-purple-100 text-purple-600'
            }`}>
              {type === 'permit2' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div className="text-center">
            <p className="text-gray-600 text-lg leading-relaxed">{message}</p>
          </div>

          {/* Amount Display */}
          {amount && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Amount</span>
                <span className="text-lg font-bold text-gray-900">
                  {amount} MERC20
                </span>
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {countdown !== null && countdown > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Signature expires in: <span className="font-mono font-bold">
                    {formatTime(countdown)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Signature Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">What you're signing:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Authorize TokenBank to transfer your tokens</li>
                  <li>Amount: {amount || 'Multiple amounts'}</li>
                  <li>Expires: {expiration ? new Date(expiration * 1000).toLocaleString() : '1 hour'}</li>
                  <li>This signature is used for gasless deposits</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onSign}
              disabled={isLoading || (countdown !== null && countdown <= 0)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'permit2'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing...</span>
                </div>
              ) : (
                'Sign Message'
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              This signature request is secure and only authorizes the specific transaction.
              Your private keys never leave your wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

