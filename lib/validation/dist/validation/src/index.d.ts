/**
 * TABEZA Validation Library
 * Pure validation logic extracted for cross-system consistency
 *
 * This package contains only pure functions with no OS dependencies,
 * making it suitable for both cloud (Vercel) and agent (Windows) systems.
 */
export { BusinessRuleValidator } from './core/business-rule-validator';
export { sanitizeReceiptData, sanitizePhoneNumber, sanitizeAmount, sanitizeText, normalizeReceiptData, applySanitizationRules } from './core/data-sanitizer';
export { validateReceiptData, validateBusinessRules, validateDataConsistency, validateCrossSystemCompatibility, validateReceiptStructure, validateReceiptCalculations, validateReceiptTimestamps } from './core/validators';
export type { ValidationResult, TabezaValidationErrorType as ValidationError, ValidationWarning, BusinessRuleValidation, BusinessRuleResult, SanitizationOptions, SanitizationResult, CrossSystemValidation, ReceiptValidationConfig, ReceiptValidationResult, ValidationSeverity, BusinessRuleSeverity, SystemType, IssueSeverity, ValidationRule, SanitizationRule, ValidateReceiptDataParams, ValidateBusinessRulesParams, SanitizeDataParams, CrossSystemValidationParams } from './types';
export { TabezaValidationError, SanitizationError, BusinessRuleViolationError, CrossSystemCompatibilityError } from './types';
export { VALIDATION_PATTERNS, VALIDATION_LIMITS, BUSINESS_RULES, BUSINESS_RULE_WEIGHTS, SANITIZATION_RULES, ERROR_MESSAGES, CLOUD_COMPATIBILITY_RULES, AGENT_COMPATIBILITY_RULES, VALIDATION_CATEGORIES } from './constants';
export { DEFAULT_VALIDATION_CONFIG, DEFAULT_SANITIZATION_OPTIONS, VALIDATION_THRESHOLDS } from './types';
import type { CompleteReceiptSession } from '@tabeza/receipt-schema';
import type { ValidationResult, BusinessRuleResult, CrossSystemValidation } from './types';
/**
 * Quick validation for a receipt with default settings
 */
export declare function quickValidateReceipt(receipt: CompleteReceiptSession): ValidationResult;
/**
 * Quick business rule validation
 */
export declare function quickValidateBusinessRules(receipt: CompleteReceiptSession): BusinessRuleResult;
/**
 * Quick cross-system compatibility check
 */
export declare function quickValidateCrossSystem(data: any): CrossSystemValidation;
/**
 * Quick data sanitization
 */
export declare function quickSanitizeData(data: any): any;
/**
 * Comprehensive validation (structure + business rules + cross-system)
 */
export declare function comprehensiveValidation(receipt: CompleteReceiptSession): {
    structure: ValidationResult;
    businessRules: BusinessRuleResult;
    crossSystem: CrossSystemValidation;
    overallScore: number;
    isValid: boolean;
};
/**
 * Validate and sanitize in one operation
 */
export declare function validateAndSanitize(receipt: CompleteReceiptSession): {
    sanitized: CompleteReceiptSession;
    validation: ValidationResult;
    changes: Array<{
        field: string;
        reason: string;
    }>;
};
/**
 * Get validation summary for display
 */
export declare function getValidationSummary(receipt: CompleteReceiptSession): {
    score: number;
    status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
    issues: string[];
    recommendations: string[];
    validatedAt: string;
};
export declare const VERSION = "1.0.0";
export declare const PACKAGE_NAME = "@tabeza/validation";
export declare const DESCRIPTION = "Pure validation logic - cross-system consistency";
/**
 * Get package information
 */
export declare function getPackageInfo(): {
    name: string;
    version: string;
    description: string;
    features: string[];
    validationCategories: ("Data structure validation" | "Business logic validation" | "Mathematical calculations" | "Date and time validation" | "ID and reference validation" | "Cross-system compatibility")[];
    architecture: string;
};
//# sourceMappingURL=index.d.ts.map