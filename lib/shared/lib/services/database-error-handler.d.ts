/**
 * Database Error Handler Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service provides comprehensive error handling for database operations
 * with retry logic, user-friendly error messages, and detailed logging.
 */
export interface DatabaseError {
    code?: string;
    message: string;
    details?: string;
    hint?: string;
}
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}
export interface DatabaseOperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    userMessage?: string;
    retryCount?: number;
    shouldRetry?: boolean;
    canRetry?: boolean;
    errorCode?: string;
    validationErrors?: string[];
}
export interface DatabaseOperationOptions {
    retryConfig?: Partial<RetryConfig>;
    operationName?: string;
    logContext?: Record<string, any>;
    userFriendlyContext?: string;
}
/**
 * Execute database operation with retry logic and error handling
 */
export declare function withDatabaseErrorHandling<T>(operation: () => Promise<T>, options?: DatabaseOperationOptions): Promise<DatabaseOperationResult<T>>;
/**
 * Specialized error handler for onboarding operations
 */
export declare function withOnboardingErrorHandling<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<DatabaseOperationResult<T>>;
/**
 * Specialized error handler for venue configuration operations
 */
export declare function withVenueConfigErrorHandling<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<DatabaseOperationResult<T>>;
/**
 * Specialized error handler for migration operations
 */
export declare function withMigrationErrorHandling<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<DatabaseOperationResult<T>>;
/**
 * Create a user-friendly error message for UI display
 */
export declare function createUserErrorMessage(result: DatabaseOperationResult, fallbackMessage?: string): string;
/**
 * Check if an error result indicates a temporary issue that might resolve
 */
export declare function isTemporaryError(result: DatabaseOperationResult): boolean;
/**
 * Check if an error result indicates a permanent issue requiring user action
 */
export declare function isPermanentError(result: DatabaseOperationResult): boolean;
