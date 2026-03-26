/**
 * Subscription Error Handler
 *
 * Provides graceful error handling for real-time subscriptions.
 * Implements exponential backoff and error recovery strategies.
 *
 * Requirements: 7, 8, 9, 11
 */
export type SubscriptionErrorType = 'connection_failed' | 'timeout' | 'invalid_payload' | 'permission_denied' | 'network_error' | 'unknown';
export interface SubscriptionError {
    type: SubscriptionErrorType;
    message: string;
    timestamp: Date;
    retryable: boolean;
    originalError?: Error;
}
export interface ErrorHandlerOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onError?: (error: SubscriptionError) => void;
    onRetry?: (attempt: number, delay: number) => void;
    onMaxRetriesReached?: () => void;
}
export interface SubscriptionErrorHandler {
    handleError(error: Error, context?: string): SubscriptionError;
    shouldRetry(error: SubscriptionError, attemptCount: number): boolean;
    getRetryDelay(attemptCount: number): number;
    logError(error: SubscriptionError, context?: string): void;
}
/**
 * Factory function to create a SubscriptionErrorHandler instance
 */
export declare function createSubscriptionErrorHandler(options?: ErrorHandlerOptions): SubscriptionErrorHandler;
/**
 * Utility function to wrap a subscription handler with error handling
 */
export declare function withErrorHandling<T>(handler: (payload: T) => void, errorHandler: SubscriptionErrorHandler, context?: string): (payload: T) => void;
/**
 * Utility function to validate payload structure
 */
export declare function validatePayload<T>(payload: any, requiredFields: string[]): T;
