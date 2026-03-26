/**
 * M-Pesa Audit Logging Service
 * Implements task 6: Essential logging and observability
 * Requirements: 6.4, 7.1, 7.2
 */
export interface MpesaAuditLogData {
    tab_id?: string;
    tab_payment_id?: string;
    checkout_request_id?: string;
    bar_id?: string;
    amount?: number;
    phone_number?: string;
    environment?: 'sandbox' | 'production';
    stk_request_payload?: any;
    stk_response?: any;
    callback_data?: any;
    error_message?: string;
    error_code?: string;
    response_time_ms?: number;
    [key: string]: any;
}
export type MpesaAuditAction = 'payment_initiated' | 'payment_stk_sent' | 'payment_callback_received' | 'payment_callback_processed' | 'payment_verified' | 'payment_completed' | 'payment_failed' | 'payment_flagged_for_review' | 'payment_state_transition';
export declare class MpesaAuditLogger {
    private supabase;
    constructor(supabaseUrl?: string, supabaseKey?: string);
    /**
     * Log M-Pesa payment event to audit_logs table
     * Requirements: 7.1, 7.2 - Log all payment events with complete details
     */
    logPaymentEvent(action: MpesaAuditAction, data: MpesaAuditLogData, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * Log payment state transition with before/after states
     * Requirements: 6.4 - Log all payment state transitions
     */
    logStateTransition(data: MpesaAuditLogData & {
        previous_status: string;
        new_status: string;
        transition_reason?: string;
    }): Promise<void>;
    /**
     * Log STK Push request with redacted payload
     * Requirements: 6.4 - Log STK request payload (redacted), STK response
     */
    logSTKPushRequest(data: MpesaAuditLogData & {
        stk_request_payload: any;
        stk_response?: any;
    }): Promise<void>;
    /**
     * Log callback received and processed
     * Requirements: 6.4 - Log raw callback JSON
     */
    logCallbackReceived(data: MpesaAuditLogData & {
        callback_data: any;
    }): Promise<void>;
    /**
     * Log callback processing completion
     */
    logCallbackProcessed(data: MpesaAuditLogData & {
        processing_result: 'success' | 'failed';
        processing_error?: string;
    }): Promise<void>;
    /**
     * Redact sensitive information from audit data
     * Removes or masks sensitive fields while preserving audit value
     */
    private redactSensitiveData;
    /**
     * Mask phone number for logging (show first 3 and last 2 digits)
     * Example: 254712345678 -> 254*****78
     */
    private maskPhoneNumber;
}
export declare function getMpesaAuditLogger(): MpesaAuditLogger;
/**
 * Convenience function for logging payment events
 */
export declare function logMpesaPaymentEvent(action: MpesaAuditAction, data: MpesaAuditLogData, additionalContext?: Record<string, any>): Promise<void>;
/**
 * Convenience function for logging state transitions
 */
export declare function logMpesaStateTransition(data: MpesaAuditLogData & {
    previous_status: string;
    new_status: string;
    transition_reason?: string;
}): Promise<void>;
