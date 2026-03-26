/**
 * Shared Error Handling Utilities
 * Feature: fix-close-tab-errors
 * Task: 6.1 Create shared error handling utilities
 *
 * **Validates: Requirements 4.4, 4.5**
 *
 * Provides error types, interfaces, sanitization, and logging functions
 * for consistent error handling across customer and staff applications.
 */
/**
 * Error types for categorization
 */
export type ErrorType = 'network' | 'validation' | 'database' | 'permission' | 'unknown';
/**
 * Error interface for structured error information
 */
export interface TabezaError {
    type: ErrorType;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
    troubleshooting?: string;
    originalError?: any;
}
/**
 * Sanitizes error messages to remove technical implementation details
 *
 * **Requirement 4.5**: Error messages should not expose technical details
 *
 * @param error - The error to sanitize
 * @returns User-friendly error message
 */
export declare function sanitizeErrorMessage(error: any): string;
/**
 * Categorizes an error and provides user-friendly information
 *
 * @param error - The error to categorize
 * @param context - Context about where the error occurred ('customer' | 'staff')
 * @returns Structured error information
 */
export declare function categorizeError(error: any, context?: 'customer' | 'staff'): TabezaError;
/**
 * Error log entry interface
 */
export interface ErrorLogEntry {
    timestamp: string;
    tabId?: string;
    userId?: string;
    userType: 'customer' | 'staff' | 'system';
    errorType: ErrorType;
    errorMessage: string;
    originalError?: string;
    context?: Record<string, any>;
}
/**
 * Creates a structured error log entry
 *
 * **Requirement 4.4**: Log error details for debugging
 *
 * @param error - The error to log
 * @param options - Additional context for the log entry
 * @returns Structured log entry
 */
export declare function createErrorLogEntry(error: any, options: {
    tabId?: string;
    userId?: string;
    userType: 'customer' | 'staff' | 'system';
    context?: Record<string, any>;
}): ErrorLogEntry;
/**
 * Logs an error to the console with structured information
 *
 * @param error - The error to log
 * @param options - Additional context for logging
 */
export declare function logError(error: any, options: {
    tabId?: string;
    userId?: string;
    userType: 'customer' | 'staff' | 'system';
    context?: Record<string, any>;
}): void;
/**
 * Formats an error for display to the user
 *
 * @param error - The error to format
 * @param context - Context about where the error occurred
 * @returns User-friendly error message
 */
export declare function formatErrorForUser(error: any, context?: 'customer' | 'staff'): string;
/**
 * Determines if an error is retryable
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export declare function isRetryableError(error: any): boolean;
