/**
 * TABEZA Validation Library - Data Sanitizer
 * Pure data sanitization functions extracted from virtual-printer
 */
import type { CompleteReceiptSession } from '@tabeza/receipt-schema';
import type { SanitizationOptions } from '../types';
/**
 * Sanitize receipt data by removing/fixing common issues
 */
export declare function sanitizeReceiptData(receipt: CompleteReceiptSession, options?: SanitizationOptions): {
    sanitized: CompleteReceiptSession;
    changes: Array<{
        field: string;
        reason: string;
        originalValue?: any;
        sanitizedValue?: any;
    }>;
    warnings: string[];
    original?: any;
};
/**
 * Sanitize phone number to standard format
 */
export declare function sanitizePhoneNumber(phone: string): string;
/**
 * Sanitize amount to proper decimal format
 */
export declare function sanitizeAmount(amount: any): number;
/**
 * Sanitize text by removing control characters and normalizing whitespace
 */
export declare function sanitizeText(text: string): string;
/**
 * Normalize receipt data structure
 */
export declare function normalizeReceiptData(receipt: CompleteReceiptSession): CompleteReceiptSession;
/**
 * Apply sanitization rules to data
 */
export declare function applySanitizationRules(data: any, rules?: string[]): any;
//# sourceMappingURL=data-sanitizer.d.ts.map