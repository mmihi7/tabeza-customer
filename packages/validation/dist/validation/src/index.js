"use strict";
/**
 * TABEZA Validation Library
 * Pure validation logic extracted for cross-system consistency
 *
 * This package contains only pure functions with no OS dependencies,
 * making it suitable for both cloud (Vercel) and agent (Windows) systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESCRIPTION = exports.PACKAGE_NAME = exports.VERSION = exports.VALIDATION_THRESHOLDS = exports.DEFAULT_SANITIZATION_OPTIONS = exports.DEFAULT_VALIDATION_CONFIG = exports.VALIDATION_CATEGORIES = exports.AGENT_COMPATIBILITY_RULES = exports.CLOUD_COMPATIBILITY_RULES = exports.ERROR_MESSAGES = exports.SANITIZATION_RULES = exports.BUSINESS_RULE_WEIGHTS = exports.BUSINESS_RULES = exports.VALIDATION_LIMITS = exports.VALIDATION_PATTERNS = exports.CrossSystemCompatibilityError = exports.BusinessRuleViolationError = exports.SanitizationError = exports.TabezaValidationError = exports.validateReceiptTimestamps = exports.validateReceiptCalculations = exports.validateReceiptStructure = exports.validateCrossSystemCompatibility = exports.validateDataConsistency = exports.validateBusinessRules = exports.validateReceiptData = exports.applySanitizationRules = exports.normalizeReceiptData = exports.sanitizeText = exports.sanitizeAmount = exports.sanitizePhoneNumber = exports.sanitizeReceiptData = exports.BusinessRuleValidator = void 0;
exports.quickValidateReceipt = quickValidateReceipt;
exports.quickValidateBusinessRules = quickValidateBusinessRules;
exports.quickValidateCrossSystem = quickValidateCrossSystem;
exports.quickSanitizeData = quickSanitizeData;
exports.comprehensiveValidation = comprehensiveValidation;
exports.validateAndSanitize = validateAndSanitize;
exports.getValidationSummary = getValidationSummary;
exports.getPackageInfo = getPackageInfo;
// ============================================================================
// CORE EXPORTS
// ============================================================================
// Main validation classes
var business_rule_validator_1 = require("./core/business-rule-validator");
Object.defineProperty(exports, "BusinessRuleValidator", { enumerable: true, get: function () { return business_rule_validator_1.BusinessRuleValidator; } });
// Note: CrossSystemValidator and ReceiptDataValidator are integrated into validators.ts
// export { CrossSystemValidator } from './core/cross-system-validator';
// export { ReceiptDataValidator } from './core/receipt-data-validator';
// Data sanitization functions
var data_sanitizer_1 = require("./core/data-sanitizer");
Object.defineProperty(exports, "sanitizeReceiptData", { enumerable: true, get: function () { return data_sanitizer_1.sanitizeReceiptData; } });
Object.defineProperty(exports, "sanitizePhoneNumber", { enumerable: true, get: function () { return data_sanitizer_1.sanitizePhoneNumber; } });
Object.defineProperty(exports, "sanitizeAmount", { enumerable: true, get: function () { return data_sanitizer_1.sanitizeAmount; } });
Object.defineProperty(exports, "sanitizeText", { enumerable: true, get: function () { return data_sanitizer_1.sanitizeText; } });
Object.defineProperty(exports, "normalizeReceiptData", { enumerable: true, get: function () { return data_sanitizer_1.normalizeReceiptData; } });
Object.defineProperty(exports, "applySanitizationRules", { enumerable: true, get: function () { return data_sanitizer_1.applySanitizationRules; } });
// Validation utilities
var validators_1 = require("./core/validators");
Object.defineProperty(exports, "validateReceiptData", { enumerable: true, get: function () { return validators_1.validateReceiptData; } });
Object.defineProperty(exports, "validateBusinessRules", { enumerable: true, get: function () { return validators_1.validateBusinessRules; } });
Object.defineProperty(exports, "validateDataConsistency", { enumerable: true, get: function () { return validators_1.validateDataConsistency; } });
Object.defineProperty(exports, "validateCrossSystemCompatibility", { enumerable: true, get: function () { return validators_1.validateCrossSystemCompatibility; } });
Object.defineProperty(exports, "validateReceiptStructure", { enumerable: true, get: function () { return validators_1.validateReceiptStructure; } });
Object.defineProperty(exports, "validateReceiptCalculations", { enumerable: true, get: function () { return validators_1.validateReceiptCalculations; } });
Object.defineProperty(exports, "validateReceiptTimestamps", { enumerable: true, get: function () { return validators_1.validateReceiptTimestamps; } });
// Error types
var types_1 = require("./types");
Object.defineProperty(exports, "TabezaValidationError", { enumerable: true, get: function () { return types_1.TabezaValidationError; } });
Object.defineProperty(exports, "SanitizationError", { enumerable: true, get: function () { return types_1.SanitizationError; } });
Object.defineProperty(exports, "BusinessRuleViolationError", { enumerable: true, get: function () { return types_1.BusinessRuleViolationError; } });
Object.defineProperty(exports, "CrossSystemCompatibilityError", { enumerable: true, get: function () { return types_1.CrossSystemCompatibilityError; } });
// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
var constants_1 = require("./constants");
// Validation patterns
Object.defineProperty(exports, "VALIDATION_PATTERNS", { enumerable: true, get: function () { return constants_1.VALIDATION_PATTERNS; } });
// Validation limits
Object.defineProperty(exports, "VALIDATION_LIMITS", { enumerable: true, get: function () { return constants_1.VALIDATION_LIMITS; } });
// Business rules
Object.defineProperty(exports, "BUSINESS_RULES", { enumerable: true, get: function () { return constants_1.BUSINESS_RULES; } });
// Business rule weights
Object.defineProperty(exports, "BUSINESS_RULE_WEIGHTS", { enumerable: true, get: function () { return constants_1.BUSINESS_RULE_WEIGHTS; } });
// Sanitization rules
Object.defineProperty(exports, "SANITIZATION_RULES", { enumerable: true, get: function () { return constants_1.SANITIZATION_RULES; } });
// Error messages
Object.defineProperty(exports, "ERROR_MESSAGES", { enumerable: true, get: function () { return constants_1.ERROR_MESSAGES; } });
// System compatibility rules
Object.defineProperty(exports, "CLOUD_COMPATIBILITY_RULES", { enumerable: true, get: function () { return constants_1.CLOUD_COMPATIBILITY_RULES; } });
Object.defineProperty(exports, "AGENT_COMPATIBILITY_RULES", { enumerable: true, get: function () { return constants_1.AGENT_COMPATIBILITY_RULES; } });
// Validation categories
Object.defineProperty(exports, "VALIDATION_CATEGORIES", { enumerable: true, get: function () { return constants_1.VALIDATION_CATEGORIES; } });
// Default configurations
var types_2 = require("./types");
Object.defineProperty(exports, "DEFAULT_VALIDATION_CONFIG", { enumerable: true, get: function () { return types_2.DEFAULT_VALIDATION_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_SANITIZATION_OPTIONS", { enumerable: true, get: function () { return types_2.DEFAULT_SANITIZATION_OPTIONS; } });
Object.defineProperty(exports, "VALIDATION_THRESHOLDS", { enumerable: true, get: function () { return types_2.VALIDATION_THRESHOLDS; } });
const constants_2 = require("./constants");
/**
 * Quick validation for a receipt with default settings
 */
function quickValidateReceipt(receipt) {
    const { validateReceiptData } = require('./core/validators');
    return validateReceiptData({ receipt });
}
/**
 * Quick business rule validation
 */
function quickValidateBusinessRules(receipt) {
    const { validateBusinessRules } = require('./core/validators');
    return validateBusinessRules({ receipt });
}
/**
 * Quick cross-system compatibility check
 */
function quickValidateCrossSystem(data) {
    const { validateCrossSystemCompatibility } = require('./core/validators');
    return validateCrossSystemCompatibility({
        data,
        targetSystems: ['CLOUD', 'AGENT']
    });
}
/**
 * Quick data sanitization
 */
function quickSanitizeData(data) {
    const { sanitizeReceiptData } = require('./core/data-sanitizer');
    return sanitizeReceiptData(data);
}
/**
 * Comprehensive validation (structure + business rules + cross-system)
 */
function comprehensiveValidation(receipt) {
    const structure = quickValidateReceipt(receipt);
    const businessRules = quickValidateBusinessRules(receipt);
    const crossSystem = quickValidateCrossSystem(receipt);
    const overallScore = Math.round((structure.score + businessRules.score + crossSystem.consistencyScore) / 3);
    const isValid = structure.valid && businessRules.valid &&
        crossSystem.cloudCompatible && crossSystem.agentCompatible;
    return {
        structure,
        businessRules,
        crossSystem,
        overallScore,
        isValid
    };
}
/**
 * Validate and sanitize in one operation
 */
function validateAndSanitize(receipt) {
    const { sanitizeReceiptData } = require('./core/data-sanitizer');
    const { validateReceiptData } = require('./core/validators');
    const sanitizationResult = sanitizeReceiptData(receipt);
    const validation = validateReceiptData({ receipt: sanitizationResult.sanitized });
    return {
        sanitized: sanitizationResult.sanitized,
        validation,
        changes: sanitizationResult.changes
    };
}
/**
 * Get validation summary for display
 */
function getValidationSummary(receipt) {
    const { VALIDATION_THRESHOLDS } = require('./types');
    const comprehensive = comprehensiveValidation(receipt);
    let status;
    if (comprehensive.overallScore >= VALIDATION_THRESHOLDS.EXCELLENT)
        status = 'EXCELLENT';
    else if (comprehensive.overallScore >= VALIDATION_THRESHOLDS.GOOD)
        status = 'GOOD';
    else if (comprehensive.overallScore >= VALIDATION_THRESHOLDS.ACCEPTABLE)
        status = 'ACCEPTABLE';
    else if (comprehensive.overallScore >= VALIDATION_THRESHOLDS.POOR)
        status = 'POOR';
    else
        status = 'CRITICAL';
    const issues = [
        ...comprehensive.structure.errors,
        ...comprehensive.businessRules.rules
            .filter((rule) => !rule.passed)
            .map((rule) => rule.message),
        ...comprehensive.crossSystem.issues
            .filter((issue) => issue.severity === 'BLOCKING')
            .map((issue) => issue.issue)
    ];
    const recommendations = [
        ...comprehensive.structure.warnings,
        ...comprehensive.crossSystem.issues
            .filter((issue) => issue.recommendation)
            .map((issue) => issue.recommendation)
    ];
    return {
        score: comprehensive.overallScore,
        status,
        issues,
        recommendations,
        validatedAt: new Date().toISOString()
    };
}
// ============================================================================
// VERSION & METADATA
// ============================================================================
exports.VERSION = '1.0.0';
exports.PACKAGE_NAME = '@tabeza/validation';
exports.DESCRIPTION = 'Pure validation logic - cross-system consistency';
/**
 * Get package information
 */
function getPackageInfo() {
    return {
        name: exports.PACKAGE_NAME,
        version: exports.VERSION,
        description: exports.DESCRIPTION,
        features: [
            'Receipt data validation',
            'Business rule validation',
            'Data sanitization and normalization',
            'Cross-system compatibility validation',
            'Pure functions - no OS dependencies',
            'Serverless compatible',
            'Property-based testing support'
        ],
        validationCategories: Object.values(constants_2.VALIDATION_CATEGORIES),
        architecture: 'Pure logic extraction for cloud/agent separation'
    };
}
//# sourceMappingURL=index.js.map