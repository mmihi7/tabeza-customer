/**
 * Simple M-Pesa STK Push Service
 * Handles sending STK Push requests to Safaricom API with proper formatting and error handling
 * Requirements: 2.1, 8.5
 */
import { type MpesaConfig } from './mpesa-config';
export interface STKPushRequest {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
}
export interface STKPushResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
}
export interface STKPushErrorResponse {
    ResponseCode: string;
    ResponseDescription: string;
    errorCode?: string;
    errorMessage?: string;
}
export declare class STKPushError extends Error {
    responseCode?: string | undefined;
    responseDescription?: string | undefined;
    statusCode?: number | undefined;
    originalError?: any | undefined;
    constructor(message: string, responseCode?: string | undefined, responseDescription?: string | undefined, statusCode?: number | undefined, originalError?: any | undefined);
}
/**
 * Send STK Push request to Safaricom API
 * Requirement 2.1: WHEN a customer enters a valid phone number and amount, THE System SHALL initiate an STK Push request to Safaricom
 * Requirement 8.5: THE System SHALL retry failed API calls up to 3 times with exponential backoff
 */
export declare function sendSTKPush(request: STKPushRequest, config: MpesaConfig): Promise<STKPushResponse>;
/**
 * Get STK Push service statistics (useful for monitoring)
 */
export interface STKPushStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
}
/**
 * Get STK Push service statistics
 */
export declare function getSTKPushStats(): STKPushStats;
/**
 * Reset STK Push service statistics
 */
export declare function resetSTKPushStats(): void;
/**
 * Wrapper function that includes statistics tracking
 */
export declare function sendSTKPushWithStats(request: STKPushRequest, config: MpesaConfig): Promise<STKPushResponse>;
