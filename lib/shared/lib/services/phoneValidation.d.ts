/**
 * Simplified phone number validation utility for M-Pesa payments
 * Validates and normalizes Kenyan phone numbers to 254XXXXXXXXX format
 *
 * Requirements: 2.4 - THE System SHALL validate phone numbers are in correct Kenyan format (254XXXXXXXXX)
 */
export interface PhoneValidationResult {
    isValid: boolean;
    normalized?: string;
    formatted?: string;
    error?: string;
}
/**
 * Sanitize phone number input by removing all non-digit characters
 * Self-contained implementation to avoid external dependencies
 */
declare function sanitizePhoneNumber(input: string): string;
/**
 * Normalize phone number to 254XXXXXXXXX format
 * Handles various input formats:
 * - 0712345678 → 254712345678
 * - 712345678 → 254712345678
 * - 254712345678 → 254712345678
 * - +254712345678 → 254712345678
 */
declare function normalizeToInternationalFormat(phoneNumber: string): string;
/**
 * Validate that a phone number is in correct Kenyan format
 * Returns validation result with normalized 254XXXXXXXXX format
 */
export declare function validateKenyanPhoneNumber(phoneNumber: string): PhoneValidationResult;
/**
 * Quick validation function that returns boolean
 * Useful for simple validation checks
 */
export declare function isValidKenyanPhoneNumber(phoneNumber: string): boolean;
/**
 * Normalize phone number to 254XXXXXXXXX format
 * Returns the normalized number or null if invalid
 * Does NOT call validateKenyanPhoneNumber to avoid circular dependency
 */
export declare function normalizeKenyanPhoneNumber(phoneNumber: string): string | null;
/**
 * Format phone number for display purposes
 * Returns format: +254 XXX XXX XXX
 */
export declare function formatKenyanPhoneNumber(phoneNumber: string): string | null;
/**
 * Legacy function name for validateKenyanPhoneNumber
 * @deprecated Use validateKenyanPhoneNumber instead
 */
export declare function validateMpesaPhoneNumber(phoneNumber: string): PhoneValidationResult;
/**
 * Format phone number input with basic formatting
 * Adds spaces for readability: 0712 345 678
 */
export declare function formatPhoneNumberInput(newValue: string, previousValue?: string): string;
/**
 * Get phone number guidance messages
 * Returns array of guidance strings
 */
export declare function getPhoneNumberGuidance(phoneNumber: string): string[];
/**
 * Get network provider from phone number
 * Returns provider name or null if unknown
 */
export declare function getNetworkProvider(phoneNumber: string): string | null;
/**
 * Export sanitizePhoneNumber for external use
 */
export { sanitizePhoneNumber };
/**
 * Convert phone number to international format (254XXXXXXXXX)
 * Alias for normalizeKenyanPhoneNumber
 */
export declare function convertToInternationalFormat(phoneNumber: string): string;
/**
 * Export normalizeToInternationalFormat for external use
 */
export { normalizeToInternationalFormat };
