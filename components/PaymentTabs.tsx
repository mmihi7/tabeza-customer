'use client';

import React from 'react';

interface PaymentTabsProps {
  activeTab: 'cash' | 'mpesa';
  onTabChange: (tab: 'cash' | 'mpesa') => void;
  mpesaAvailable: boolean;
  children: React.ReactNode;
}

export default function PaymentTabs({ 
  activeTab, 
  onTabChange, 
  mpesaAvailable, 
  children 
}: PaymentTabsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange('cash')}
          className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === 'cash'
              ? 'text-[#FF4F00] border-b-2 border-[#FF4F00] bg-[#FFF5F0]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💵 Cash Payment
        </button>
        {mpesaAvailable && (
          <button
            onClick={() => onTabChange('mpesa')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === 'mpesa'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📱 M-Pesa
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
