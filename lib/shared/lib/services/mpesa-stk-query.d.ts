/**
 * M-Pesa STK Push Query Service
 * Checks the status of STK Push payments using Daraja API
 */
import { type MpesaConfig } from './mpesa-config';
export interface STKQueryRequest {
    checkoutRequestId: string;
}
export interface STKQueryResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: string;
    ResultDesc: string;
}
export declare class STKQueryError extends Error {
    responseCode?: string | undefined;
    responseDescription?: string | undefined;
    statusCode?: number | undefined;
    originalError?: any | undefined;
    constructor(message: string, responseCode?: string | undefined, responseDescription?: string | undefined, statusCode?: number | undefined, originalError?: any | undefined);
}
/**
 * Query STK Push payment status from Safaricom API
 */
export declare function querySTKPushStatus(request: STKQueryRequest, config: MpesaConfig): Promise<STKQueryResponse>;
/**
 * Add query URL to config for easy access
 */
export declare function getSTKQueryUrl(environment: 'sandbox' | 'production'): string;
/**
 * Parse STK Query result into payment status
 */
export declare function parsePaymentStatus(queryResponse: STKQueryResponse): {
    status: 'completed' | 'failed' | 'cancelled' | 'pending';
    message: string;
};
