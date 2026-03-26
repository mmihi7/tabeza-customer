'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatUtils';

interface MpesaPaymentTabProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  balance: number;
  onPaymentSuccess: (receiptNumber: string) => void;
  onPaymentError: (error: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
  showMpesaPayment: boolean;
  onShowMpesaPaymentChange: (show: boolean) => void;
}

export default function MpesaPaymentTab({
  amount,
  onAmountChange,
  balance,
  onPaymentSuccess,
  onPaymentError,
  phoneNumber,
  onPhoneNumberChange,
  showMpesaPayment,
  onShowMpesaPaymentChange
}: MpesaPaymentTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<string | null>(null);

  // Validate phone number
  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\s/g, '');
    
    // Kenya phone number validation
    if (!cleaned) {
      setPhoneValidation(null);
      return;
    }
    
    if (cleaned.startsWith('07') && cleaned.length === 10) {
      setPhoneValidation('valid');
    } else if (cleaned.startsWith('2547') && cleaned.length === 12) {
      setPhoneValidation('valid');
    } else if (cleaned.startsWith('+2547') && cleaned.length === 13) {
      setPhoneValidation('valid');
    } else {
      setPhoneValidation('invalid');
    }
  };

  useEffect(() => {
    validatePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  const handlePayment = async () => {
    if (phoneValidation !== 'valid') {
      onPaymentError('Please enter a valid M-Pesa phone number');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      onPaymentError('Please enter a valid payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate M-Pesa payment process
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          accountReference: 'Tab Payment'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simulate successful payment with receipt
        setTimeout(() => {
          const receiptNumber = `MP${Date.now()}`;
          onPaymentSuccess(receiptNumber);
          setIsProcessing(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error: any) {
      setIsProcessing(false);
      onPaymentError(error.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Phone Number Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          M-Pesa Phone Number
        </label>
        <div className="relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="07XX XXX XXX"
            className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              phoneValidation === 'invalid' 
                ? 'border-red-300' 
                : phoneValidation === 'valid' 
                ? 'border-green-300' 
                : 'border-gray-200'
            }`}
            disabled={isProcessing}
          />
          {phoneValidation === 'valid' && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        {phoneValidation === 'invalid' && (
          <p className="text-sm text-red-600 mt-2">
            Please enter a valid Kenyan phone number (07XX XXX XXX)
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Enter the M-Pesa registered phone number
        </p>
      </div>

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
            className="w-full pl-16 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isProcessing}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Outstanding balance: {formatCurrency(balance)}
        </p>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || phoneValidation !== 'valid' || !amount || parseFloat(amount) <= 0}
        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {isProcessing ? (
          <>
            <span className="animate-spin inline-block mr-2">⟳</span>
            Processing M-Pesa Payment...
          </>
        ) : (
          'Pay with M-Pesa'
        )}
      </button>

      {/* Instructions */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h3 className="font-semibold text-green-900 mb-2">M-Pesa Payment Instructions</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Enter your M-Pesa registered phone number</li>
          <li>• Click "Pay with M-Pesa" to initiate payment</li>
          <li>• Check your phone for M-Pesa prompt</li>
          <li>• Enter your M-Pesa PIN to complete payment</li>
          <li>• You'll receive a confirmation SMS upon success</li>
        </ul>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            <div>
              <p className="font-medium text-yellow-900">Processing Payment</p>
              <p className="text-sm text-yellow-700">
                Please check your phone for M-Pesa prompt...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
