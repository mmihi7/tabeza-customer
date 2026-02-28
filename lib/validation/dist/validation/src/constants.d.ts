/**
 * TABEZA Validation Library - Constants
 * Validation rules, patterns, and configuration constants
 */
import type { ValidationRule, SanitizationRule } from './types';
export declare const VALIDATION_PATTERNS: {
    readonly PHONE_E164: RegExp;
    readonly PHONE_KENYA: RegExp;
    readonly PHONE_UGANDA: RegExp;
    readonly PHONE_TANZANIA: RegExp;
    readonly PHONE_RWANDA: RegExp;
    readonly AMOUNT_DECIMAL: RegExp;
    readonly AMOUNT_WITH_COMMAS: RegExp;
    readonly TABEZA_RECEIPT_ID: RegExp;
    readonly SESSION_REFERENCE: RegExp;
    readonly EVENT_ID: RegExp;
    readonly CONTROL_CHARS: RegExp;
    readonly EXCESSIVE_WHITESPACE: RegExp;
    readonly LEADING_TRAILING_WHITESPACE: RegExp;
    readonly ISO_8601: RegExp;
    readonly CURRENCY_CODE: RegExp;
    readonly KRA_PIN: RegExp;
};
export declare const VALIDATION_LIMITS: {
    readonly MAX_TEXT_LENGTH: 1000;
    readonly MAX_NAME_LENGTH: 100;
    readonly MAX_DESCRIPTION_LENGTH: 500;
    readonly MAX_REFERENCE_LENGTH: 50;
    readonly MAX_AMOUNT: 999999999.99;
    readonly MIN_AMOUNT: 0.01;
    readonly MAX_QUANTITY: 9999;
    readonly MIN_QUANTITY: 0.01;
    readonly MAX_ITEMS_PER_EVENT: 100;
    readonly MAX_EVENTS_PER_SESSION: 50;
    readonly MAX_PAYMENTS_PER_SESSION: 10;
    readonly MAX_SESSION_DURATION_HOURS: 24;
    readonly MAX_EVENT_AGE_HOURS: 48;
    readonly AMOUNT_DECIMAL_PLACES: 2;
    readonly CONFIDENCE_DECIMAL_PLACES: 4;
};
export declare const BUSINESS_RULES: ValidationRule[];
export declare const SANITIZATION_RULES: SanitizationRule[];
export declare const ERROR_MESSAGES: {
    readonly INVALID_STRUCTURE: "Invalid receipt data structure";
    readonly MISSING_REQUIRED_FIELD: "Required field is missing";
    readonly INVALID_FORMAT: "Invalid field format";
    readonly BUSINESS_RULE_VIOLATION: "Business rule violation";
    readonly CALCULATION_ERROR: "Calculation error detected";
    readonly CROSS_SYSTEM_INCOMPATIBILITY: "Data not compatible across systems";
    readonly SANITIZATION_FAILED: "Data sanitization failed";
    readonly VALIDATION_TIMEOUT: "Validation process timed out";
};
export declare const CLOUD_COMPATIBILITY_RULES: string[];
export declare const AGENT_COMPATIBILITY_RULES: string[];
export declare const BUSINESS_RULE_WEIGHTS: {
    readonly CRITICAL: 25;
    readonly HIGH: 15;
    readonly MEDIUM: 10;
    readonly LOW: 5;
};
export declare const VALIDATION_CATEGORIES: {
    readonly STRUCTURE: "Data structure validation";
    readonly BUSINESS_RULES: "Business logic validation";
    readonly CALCULATIONS: "Mathematical calculations";
    readonly TIMESTAMPS: "Date and time validation";
    readonly REFERENCES: "ID and reference validation";
    readonly CROSS_SYSTEM: "Cross-system compatibility";
};
//# sourceMappingURL=constants.d.ts.map