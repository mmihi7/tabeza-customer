'use client';

import React from 'react';
import { formatCurrency } from '@/lib/formatUtils';

interface CashPaymentTabProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  balance: number;
  onPayment: () => void;
  isProcessing: boolean;
}

export default function CashPaymentTab({
  amount,
  onAmountChange,
  balance,
  onPayment,
  isProcessing
}: CashPaymentTabProps) {
  return (
    <div className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
            Ksh
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-16 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={isProcessing}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Outstanding balance: {formatCurrency(balance)}
        </p>
      </div>

      {/* Payment Button */}
      <button
        onClick={onPayment}
        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
        className="w-full bg-[#FF4F00] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#FF4F00] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {isProcessing ? (
          <>
            <span className="animate-spin inline-block mr-2">⟳</span>
            Processing...
          </>
        ) : (
          'Confirm Cash Payment'
        )}
      </button>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Cash Payment Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pay the exact amount at the bar counter</li>
          <li>• Staff will confirm receipt and update your tab</li>
          <li>• Keep your receipt as proof of payment</li>
        </ul>
      </div>
    </div>
  );
}
