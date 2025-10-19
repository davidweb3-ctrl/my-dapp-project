'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { BatchDepositItem, Permit2Utils } from '../utils/permit2';

interface BatchDepositFormProps {
  onDeposit: (items: BatchDepositItem[]) => Promise<void>;
  maxBalance?: bigint;
  isLoading?: boolean;
}

export default function BatchDepositForm({ onDeposit, maxBalance, isLoading }: BatchDepositFormProps) {
  const [items, setItems] = useState<BatchDepositItem[]>([
    { id: Permit2Utils.generateItemId(), amount: '', isValid: false }
  ]);
  const [totalAmount, setTotalAmount] = useState('0');

  // Update total amount when items change
  useEffect(() => {
    const total = Permit2Utils.calculateBatchTotal(items);
    setTotalAmount(total);
  }, [items]);

  // Add new deposit item
  const addItem = () => {
    if (items.length >= 10) return; // Limit to 10 items
    
    const newItem: BatchDepositItem = {
      id: Permit2Utils.generateItemId(),
      amount: '',
      isValid: false,
    };
    setItems([...items, newItem]);
  };

  // Remove deposit item
  const removeItem = (id: string) => {
    if (items.length <= 1) return; // Keep at least one item
    
    setItems(items.filter(item => item.id !== id));
  };

  // Update item amount
  const updateItemAmount = (id: string, amount: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const error = Permit2Utils.validateAmount(amount, maxBalance);
        return {
          ...item,
          amount,
          isValid: !error,
          error: error?.message,
        };
      }
      return item;
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.isValid && item.amount);
    if (validItems.length === 0) return;
    
    await onDeposit(validItems);
  };

  // Check if form is valid
  const isValid = items.some(item => item.isValid && item.amount);
  const validItemsCount = items.filter(item => item.isValid && item.amount).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch Deposit</h3>
          <p className="text-sm text-gray-600">Deposit multiple amounts in one transaction</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= 10 || isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Total Amount Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Total Amount</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Permit2Utils.formatAmount(totalAmount)} MERC20
            </div>
            <div className="text-xs text-gray-500">
              {validItemsCount} valid item{validItemsCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 transition-colors ${
              item.isValid && item.amount
                ? 'border-green-200 bg-green-50'
                : item.error
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Item Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">{index + 1}</span>
              </div>

              {/* Amount Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount {index + 1}
                </label>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItemAmount(item.id, e.target.value)}
                  placeholder="0.0"
                  step="0.000000000000000001"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                    item.isValid && item.amount
                      ? 'border-green-300 bg-green-50'
                      : item.error
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {item.isValid && item.amount ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : item.error ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <div className="w-5 h-5" />
                )}
              </div>

              {/* Remove Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={isLoading}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {item.error && (
              <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{item.error}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing Batch Deposit...</span>
          </div>
        ) : (
          `🚀 Sign & Deposit ${validItemsCount} Item${validItemsCount !== 1 ? 's' : ''} (One Transaction)`
        )}
      </button>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Batch Deposit Benefits:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Multiple deposits in a single transaction</li>
              <li>One signature for all amounts</li>
              <li>Reduced gas costs compared to individual deposits</li>
              <li>Faster processing for multiple operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

