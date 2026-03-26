/**
 * Subscription Error Handler
 *
 * Provides graceful error handling for real-time subscriptions.
 * Implements exponential backoff and error recovery strategies.
 *
 * Requirements: 7, 8, 9, 11
 */
class SubscriptionErrorHandlerImpl {
    constructor(options = {}) {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.options = {
            maxRetries: options.maxRetries ?? 5,
            baseDelay: options.baseDelay ?? 1000,
            maxDelay: options.maxDelay ?? 30000,
            onError: options.onError ?? (() => { }),
            onRetry: options.onRetry ?? (() => { }),
            onMaxRetriesReached: options.onMaxRetriesReached ?? (() => { })
        };
    }
    handleError(error, context) {
        const subscriptionError = this.classifyError(error);
        this.logError(subscriptionError, context);
        this.options.onError(subscriptionError);
        return subscriptionError;
    }
    classifyError(error) {
        const message = error.message.toLowerCase();
        let type = 'unknown';
        let retryable = true;
        if (message.includes('timeout') || message.includes('timed out')) {
            type = 'timeout';
            retryable = true;
        }
        else if (message.includes('connection') || message.includes('websocket')) {
            type = 'connection_failed';
            retryable = true;
        }
        else if (message.includes('network') || message.includes('offline')) {
            type = 'network_error';
            retryable = true;
        }
        else if (message.includes('permission') || message.includes('unauthorized')) {
            type = 'permission_denied';
            retryable = false;
        }
        else if (message.includes('invalid') || message.includes('malformed')) {
            type = 'invalid_payload';
            retryable = false;
        }
        return {
            type,
            message: error.message,
            timestamp: new Date(),
            retryable,
            originalError: error
        };
    }
    shouldRetry(error, attemptCount) {
        if (!error.retryable) {
            console.log('❌ Error is not retryable:', error.type);
            return false;
        }
        if (attemptCount >= this.options.maxRetries) {
            console.log('❌ Max retries reached:', attemptCount);
            this.options.onMaxRetriesReached();
            return false;
        }
        return true;
    }
    getRetryDelay(attemptCount) {
        // Exponential backoff: baseDelay * 2^attemptCount
        const exponentialDelay = this.options.baseDelay * Math.pow(2, attemptCount);
        // Add jitter (±20%) to prevent thundering herd
        const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
        // Cap at maxDelay
        const delay = Math.min(exponentialDelay + jitter, this.options.maxDelay);
        console.log(`⏱️ Retry delay for attempt ${attemptCount + 1}: ${Math.round(delay)}ms`);
        this.options.onRetry(attemptCount + 1, delay);
        return delay;
    }
    logError(error, context) {
        const logEntry = {
            ...error,
            context
        };
        console.error('🔴 Subscription error:', {
            type: error.type,
            message: error.message,
            retryable: error.retryable,
            context,
            timestamp: error.timestamp.toISOString()
        });
        this.errorLog.push(error);
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
    }
    getErrorLog() {
        return [...this.errorLog];
    }
    clearErrorLog() {
        this.errorLog = [];
    }
}
/**
 * Factory function to create a SubscriptionErrorHandler instance
 */
export function createSubscriptionErrorHandler(options) {
    return new SubscriptionErrorHandlerImpl(options);
}
/**
 * Utility function to wrap a subscription handler with error handling
 */
export function withErrorHandling(handler, errorHandler, context) {
    return (payload) => {
        try {
            handler(payload);
        }
        catch (error) {
            const subscriptionError = errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), context);
            // Don't throw - let the application continue
            console.error('🔴 Handler error (continuing):', subscriptionError);
        }
    };
}
/**
 * Utility function to validate payload structure
 */
export function validatePayload(payload, requiredFields) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload: not an object');
    }
    for (const field of requiredFields) {
        if (!(field in payload)) {
            throw new Error(`Invalid payload: missing required field "${field}"`);
        }
    }
    return payload;
}
