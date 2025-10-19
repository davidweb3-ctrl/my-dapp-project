'use client';

import { useState } from 'react';
import { Zap, Layers, CreditCard, ArrowRight } from 'lucide-react';

export type DepositType = 'normal' | 'permit2' | 'batch';

interface DepositTypeSelectorProps {
  value: DepositType;
  onChange: (type: DepositType) => void;
  disabled?: boolean;
}

export default function DepositTypeSelector({ value, onChange, disabled }: DepositTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<DepositType | null>(null);

  const depositTypes = [
    {
      id: 'normal' as DepositType,
      name: 'Traditional',
      description: 'Two-step process: Approve then Deposit',
      icon: CreditCard,
      color: 'indigo',
      features: ['Requires 2 transactions', 'Standard ERC20 approval', 'Higher gas costs'],
      recommended: false,
    },
    {
      id: 'permit2' as DepositType,
      name: 'Permit2',
      description: 'Gasless signature + deposit in one transaction',
      icon: Zap,
      color: 'blue',
      features: ['Single transaction', 'Gasless signature', 'Lower gas costs', 'Better UX'],
      recommended: true,
    },
    {
      id: 'batch' as DepositType,
      name: 'Batch Permit2',
      description: 'Multiple deposits with one signature',
      icon: Layers,
      color: 'purple',
      features: ['Multiple amounts', 'One signature', 'Maximum efficiency', 'Bulk operations'],
      recommended: true,
    },
  ];

  const getColorClasses = (type: typeof depositTypes[0], isSelected: boolean, isHovered: boolean) => {
    const baseClasses = 'relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    
    if (isSelected) {
      switch (type.color) {
        case 'indigo':
          return `${baseClasses} ${disabledClasses} border-indigo-500 bg-indigo-50 shadow-lg`;
        case 'blue':
          return `${baseClasses} ${disabledClasses} border-blue-500 bg-blue-50 shadow-lg`;
        case 'purple':
          return `${baseClasses} ${disabledClasses} border-purple-500 bg-purple-50 shadow-lg`;
        default:
          return `${baseClasses} ${disabledClasses} border-gray-500 bg-gray-50 shadow-lg`;
      }
    }
    
    if (isHovered && !disabled) {
      switch (type.color) {
        case 'indigo':
          return `${baseClasses} border-indigo-300 bg-indigo-25 shadow-md`;
        case 'blue':
          return `${baseClasses} border-blue-300 bg-blue-25 shadow-md`;
        case 'purple':
          return `${baseClasses} border-purple-300 bg-purple-25 shadow-md`;
        default:
          return `${baseClasses} border-gray-300 bg-gray-25 shadow-md`;
      }
    }
    
    return `${baseClasses} ${disabledClasses} border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm`;
  };

  const getIconColor = (type: typeof depositTypes[0], isSelected: boolean) => {
    if (isSelected) {
      switch (type.color) {
        case 'indigo':
          return 'text-indigo-600';
        case 'blue':
          return 'text-blue-600';
        case 'purple':
          return 'text-purple-600';
        default:
          return 'text-gray-600';
      }
    }
    return 'text-gray-400';
  };

  const getTextColor = (type: typeof depositTypes[0], isSelected: boolean) => {
    if (isSelected) {
      switch (type.color) {
        case 'indigo':
          return 'text-indigo-900';
        case 'blue':
          return 'text-blue-900';
        case 'purple':
          return 'text-purple-900';
        default:
          return 'text-gray-900';
      }
    }
    return 'text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Deposit Method</h2>
        <p className="text-gray-600">Select how you want to deposit your tokens</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {depositTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;
          const isHovered = hoveredType === type.id;
          
          return (
            <div
              key={type.id}
              className={getColorClasses(type, isSelected, isHovered)}
              onClick={() => !disabled && onChange(type.id)}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
            >
              {/* Recommended Badge */}
              {type.recommended && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -left-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? type.color === 'indigo' ? 'bg-indigo-100' : 
                        type.color === 'blue' ? 'bg-blue-100' : 
                        type.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                      : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${getIconColor(type, isSelected)}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${getTextColor(type, isSelected)}`}>
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {type.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected 
                          ? type.color === 'indigo' ? 'bg-indigo-500' : 
                            type.color === 'blue' ? 'bg-blue-500' : 
                            type.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                          : 'bg-gray-400'
                      }`} />
                      <span className={`text-sm ${getTextColor(type, isSelected)}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Indicator */}
                {isSelected && (
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <span className={getTextColor(type, isSelected)}>Selected</span>
                    <ArrowRight className={`w-4 h-4 ${getIconColor(type, isSelected)}`} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {depositTypes.find(t => t.id === value)?.name} Method Selected
            </p>
            <p className="text-xs text-gray-600">
              {depositTypes.find(t => t.id === value)?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

