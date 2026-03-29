'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

interface OverdueTabModalProps {
  tab: any;
  barName: string;
  onReopen: () => void;
  onPayNow: () => void;
  onClose: () => void;
}

/**
 * OverdueTabModal — shown during business hours when a returning customer has an overdue tab.
 * Caller is responsible for the business hours check (only render this component during hours).
 *
 * Requirements: 2.2, 2.2.1, 2.2.2, 2.6
 */
export const OverdueTabModal: React.FC<OverdueTabModalProps> = ({
  tab,
  barName,
  onReopen,
  onPayNow,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount
    const frame = requestAnimationFrame(() => setIsVisible(true));
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const balance = tab?.balance ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overdue-tab-modal-title"
        className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-lg transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Content */}
        <div className="px-6 pb-8 pt-4">
          {/* Icon + title */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h2
              id="overdue-tab-modal-title"
              className="text-2xl font-bold text-gray-800 mb-1"
            >
              Outstanding Balance
            </h2>
            <p className="text-gray-500 text-sm">{barName}</p>
          </div>

          {/* Balance — displayed prominently (req 2.6) */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-center">
            <p className="text-sm text-red-600 font-medium mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-red-700">
              {formatCurrency(balance)}
            </p>
            <p className="text-xs text-red-500 mt-2">
              Your previous tab at {barName} is overdue
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Reopen Tab (req 2.2.1) */}
            <button
              onClick={onReopen}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-base hover:from-orange-600 hover:to-red-700 transition-all shadow-lg"
            >
              <RefreshCw size={20} />
              Reopen Tab
            </button>

            {/* Pay Now (req 2.2.2) */}
            <button
              onClick={onPayNow}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold text-base hover:bg-green-700 transition-colors shadow-md"
            >
              <CreditCard size={20} />
              Pay Now — {formatCurrency(balance)}
            </button>

            {/* Dismiss */}
            <button
              onClick={handleClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Helper text */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Reopen your tab to continue ordering, or pay the outstanding balance now via M-Pesa.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverdueTabModal;
