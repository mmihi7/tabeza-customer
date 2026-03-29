'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

interface OverduePaymentModalProps {
  tab: any;
  barName: string;
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentState = 'idle' | 'processing' | 'polling' | 'success' | 'error';

/**
 * OverduePaymentModal — M-Pesa STK push payment modal for overdue tabs.
 * Shown outside business hours OR when "Pay Now" is selected from OverdueTabModal.
 * On success: calls onSuccess (caller handles tab close and redirect to home).
 * On failure: shows inline error, allows retry without closing the modal.
 *
 * Requirements: 2.1, 2.3, 2.4, 3.5
 */
export const OverduePaymentModal: React.FC<OverduePaymentModalProps> = ({
  tab,
  barName,
  onSuccess,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneValidation, setPhoneValidation] = useState<'valid' | 'invalid' | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptsRef = useRef(0);
  const MAX_POLLING_ATTEMPTS = 24; // 2 minutes at 5s intervals

  const balance = tab?.balance ?? 0;
  const tabId = tab?.id ?? '';

  useEffect(() => {
    // Entrance animation
    const frame = requestAnimationFrame(() => setIsVisible(true));
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = 'unset';
      stopPolling();
    };
  }, []);

  // Phone number validation — Kenyan numbers
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned) {
      setPhoneValidation(null);
      return;
    }
    const isValid =
      (cleaned.startsWith('07') && cleaned.length === 10) ||
      (cleaned.startsWith('2547') && cleaned.length === 12) ||
      (cleaned.startsWith('+2547') && cleaned.length === 13);
    setPhoneValidation(isValid ? 'valid' : 'invalid');
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    validatePhone(value);
    // Clear error when user edits phone
    if (errorMessage) setErrorMessage(null);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingAttemptsRef.current = 0;
  };

  const startPolling = (reqId: string) => {
    pollingAttemptsRef.current = 0;
    pollingIntervalRef.current = setInterval(async () => {
      pollingAttemptsRef.current += 1;

      try {
        const res = await fetch('/api/tab-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabId }),
        });
        const data = await res.json();

        if (data.status === 'closed') {
          stopPolling();
          setPaymentState('success');
          setTimeout(() => onSuccess(), 1500);
          return;
        }
      } catch {
        // Network hiccup — keep polling
      }

      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        stopPolling();
        setPaymentState('error');
        setErrorMessage(
          'Payment confirmation timed out. If you completed the M-Pesa prompt, please wait a moment and try again.'
        );
      }
    }, 5000);
  };

  const handlePay = async () => {
    if (phoneValidation !== 'valid') {
      setErrorMessage('Please enter a valid M-Pesa phone number (07XX XXX XXX)');
      return;
    }
    if (!tabId) {
      setErrorMessage('Tab information is missing. Please close and try again.');
      return;
    }

    setErrorMessage(null);
    setPaymentState('processing');

    try {
      const res = await fetch('/api/payments/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabId,
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          amount: balance,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate M-Pesa payment');
      }

      setCheckoutRequestId(data.checkoutRequestId ?? null);
      setPaymentState('polling');
      startPolling(data.checkoutRequestId ?? '');
    } catch (err: any) {
      setPaymentState('error');
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    }
  };

  const handleRetry = () => {
    stopPolling();
    setPaymentState('idle');
    setErrorMessage(null);
    setCheckoutRequestId(null);
  };

  const handleClose = () => {
    setIsVisible(false);
    stopPolling();
    setTimeout(() => onClose(), 300);
  };

  const isProcessingOrPolling = paymentState === 'processing' || paymentState === 'polling';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={isProcessingOrPolling ? undefined : handleClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overdue-payment-modal-title"
        className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-lg transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button — disabled while payment is in flight */}
        <button
          onClick={handleClose}
          disabled={isProcessingOrPolling}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="px-6 pb-8 pt-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone size={40} className="text-green-600" />
            </div>
            <h2
              id="overdue-payment-modal-title"
              className="text-2xl font-bold text-gray-800 mb-1"
            >
              Pay Outstanding Balance
            </h2>
            <p className="text-gray-500 text-sm">{barName}</p>
          </div>

          {/* Balance — displayed prominently (req 2.3) */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-center">
            <p className="text-sm text-red-600 font-medium mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-red-700">{formatCurrency(balance)}</p>
            <p className="text-xs text-red-500 mt-2">
              Your previous tab at {barName} is overdue
            </p>
          </div>

          {/* Success state */}
          {paymentState === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 size={56} className="text-green-500" />
              <p className="text-xl font-bold text-green-700">Payment Confirmed!</p>
              <p className="text-sm text-gray-500 text-center">
                Your balance has been cleared. Redirecting…
              </p>
            </div>
          )}

          {/* Idle / error state — show form */}
          {(paymentState === 'idle' || paymentState === 'error') && (
            <div className="space-y-5">
              {/* Inline error (req 3.5) */}
              {errorMessage && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Phone number input */}
              <div>
                <label
                  htmlFor="overdue-phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <input
                    id="overdue-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      phoneValidation === 'invalid'
                        ? 'border-red-300'
                        : phoneValidation === 'valid'
                        ? 'border-green-300'
                        : 'border-gray-200'
                    }`}
                  />
                  {phoneValidation === 'valid' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {phoneValidation === 'invalid' && (
                  <p className="text-sm text-red-600 mt-1">
                    Please enter a valid Kenyan phone number (07XX XXX XXX)
                  </p>
                )}
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={phoneValidation !== 'valid'}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                Pay {formatCurrency(balance)} with M-Pesa
              </button>

              {/* Instructions */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-2 text-sm">
                  How it works
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Enter your M-Pesa registered phone number</li>
                  <li>• Tap "Pay" — you'll receive an M-Pesa prompt on your phone</li>
                  <li>• Enter your M-Pesa PIN to confirm</li>
                  <li>• Payment is confirmed automatically</li>
                </ul>
              </div>

              {/* Dismiss */}
              <button
                onClick={handleClose}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Processing / polling state */}
          {isProcessingOrPolling && (
            <div className="space-y-5">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 shrink-0" />
                  <p className="font-semibold text-yellow-900">
                    {paymentState === 'processing'
                      ? 'Sending M-Pesa prompt…'
                      : 'Waiting for payment confirmation…'}
                  </p>
                </div>
                <p className="text-sm text-yellow-700">
                  {paymentState === 'processing'
                    ? 'Please wait while we initiate the payment.'
                    : 'Check your phone for the M-Pesa prompt and enter your PIN.'}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm text-green-800 font-medium">
                  Amount: {formatCurrency(balance)}
                </p>
                <p className="text-xs text-green-600 mt-1">Do not close this screen</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverduePaymentModal;
