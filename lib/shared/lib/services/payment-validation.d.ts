/**
 * Payment Validation Service
 * Implements comprehensive validation logic for M-Pesa payment initiation
 * Requirements: 1.2, 5.1
 */
import { type Tab } from './tab-resolution';
export interface PaymentValidationResult {
    isValid: boolean;
    error?: string;
    tab?: Tab;
    balance?: number;
}
export interface PaymentValidationRequest {
    tabId: string;
    amount: number;
    phoneNumber: string;
}
/**
 * Comprehensive payment validation logic
 * Validates tab exists, is open, and amount is valid
 */
export declare function validatePaymentRequest(request: PaymentValidationRequest): Promise<PaymentValidationResult>;
/**
 * Get current tab balance using the database view
 */
export declare function getTabBalance(tabId: string): Promise<number>;
/**
 * Check if tab has any pending M-Pesa payments
 * Requirement 1.4: Only one pending M-Pesa payment per tab
 * Auto-clears payments older than 3 minutes to prevent blocking
 */
export declare function checkPendingMpesaPayments(tabId: string): Promise<boolean>;
