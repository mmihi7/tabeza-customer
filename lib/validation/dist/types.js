"use strict";
/**
 * TABEZA Validation Library - Type Definitions
 * Pure types for validation and data sanitization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_RULE_WEIGHTS = exports.VALIDATION_THRESHOLDS = exports.DEFAULT_SANITIZATION_OPTIONS = exports.DEFAULT_VALIDATION_CONFIG = exports.CrossSystemCompatibilityError = exports.BusinessRuleViolationError = exports.SanitizationError = exports.TabezaValidationError = exports.ReceiptValidationResultSchema = exports.ReceiptValidationConfigSchema = exports.CrossSystemValidationSchema = exports.SanitizationResultSchema = exports.SanitizationOptionsSchema = exports.BusinessRuleResultSchema = exports.BusinessRuleValidationSchema = exports.ValidationWarningSchema = exports.ValidationErrorSchema = exports.ValidationResultSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================
exports.ValidationResultSchema = zod_1.z.object({
    valid: zod_1.z.boolean(),
    score: zod_1.z.number().min(0).max(100),
    errors: zod_1.z.array(zod_1.z.string()),
    warnings: zod_1.z.array(zod_1.z.string()),
    validatedAt: zod_1.z.string().datetime()
});
exports.ValidationErrorSchema = zod_1.z.object({
    field: zod_1.z.string(),
    message: zod_1.z.string(),
    code: zod_1.z.string(),
    severity: zod_1.z.enum(['ERROR', 'WARNING', 'INFO']),
    context: zod_1.z.record(zod_1.z.any()).optional()
});
exports.ValidationWarningSchema = zod_1.z.object({
    field: zod_1.z.string(),
    message: zod_1.z.string(),
    suggestion: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.any()).optional()
});
// ============================================================================
// BUSINESS RULE VALIDATION TYPES
// ============================================================================
exports.BusinessRuleValidationSchema = zod_1.z.object({
    ruleName: zod_1.z.string(),
    passed: zod_1.z.boolean(),
    message: zod_1.z.string(),
    severity: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    details: zod_1.z.record(zod_1.z.any()).optional()
});
exports.BusinessRuleResultSchema = zod_1.z.object({
    valid: zod_1.z.boolean(),
    score: zod_1.z.number().min(0).max(100),
    rules: zod_1.z.array(exports.BusinessRuleValidationSchema),
    summary: zod_1.z.object({
        totalRules: zod_1.z.number(),
        passedRules: zod_1.z.number(),
        failedRules: zod_1.z.number(),
        criticalIssues: zod_1.z.number(),
        highIssues: zod_1.z.number(),
        mediumIssues: zod_1.z.number(),
        lowIssues: zod_1.z.number()
    }),
    validatedAt: zod_1.z.string().datetime()
});
// ============================================================================
// DATA SANITIZATION TYPES
// ============================================================================
exports.SanitizationOptionsSchema = zod_1.z.object({
    trimWhitespace: zod_1.z.boolean().default(true),
    normalizeUnicode: zod_1.z.boolean().default(true),
    removeControlChars: zod_1.z.boolean().default(true),
    validateFormat: zod_1.z.boolean().default(true),
    strictMode: zod_1.z.boolean().default(false)
});
exports.SanitizationResultSchema = zod_1.z.object({
    original: zod_1.z.any(),
    sanitized: zod_1.z.any(),
    changes: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        originalValue: zod_1.z.any(),
        sanitizedValue: zod_1.z.any(),
        reason: zod_1.z.string()
    })),
    warnings: zod_1.z.array(zod_1.z.string())
});
// ============================================================================
// CROSS-SYSTEM VALIDATION TYPES
// ============================================================================
exports.CrossSystemValidationSchema = zod_1.z.object({
    cloudCompatible: zod_1.z.boolean(),
    agentCompatible: zod_1.z.boolean(),
    consistencyScore: zod_1.z.number().min(0).max(100),
    issues: zod_1.z.array(zod_1.z.object({
        system: zod_1.z.enum(['CLOUD', 'AGENT', 'BOTH']),
        issue: zod_1.z.string(),
        severity: zod_1.z.enum(['BLOCKING', 'WARNING', 'INFO']),
        recommendation: zod_1.z.string().optional()
    })),
    validatedAt: zod_1.z.string().datetime()
});
// ============================================================================
// RECEIPT VALIDATION TYPES
// ============================================================================
exports.ReceiptValidationConfigSchema = zod_1.z.object({
    validateStructure: zod_1.z.boolean().default(true),
    validateBusinessRules: zod_1.z.boolean().default(true),
    validateCalculations: zod_1.z.boolean().default(true),
    validateTimestamps: zod_1.z.boolean().default(true),
    validateReferences: zod_1.z.boolean().default(true),
    strictMode: zod_1.z.boolean().default(false),
    allowPartialData: zod_1.z.boolean().default(false)
});
exports.ReceiptValidationResultSchema = zod_1.z.object({
    valid: zod_1.z.boolean(),
    score: zod_1.z.number().min(0).max(100),
    structureValidation: exports.ValidationResultSchema,
    businessRuleValidation: exports.BusinessRuleResultSchema,
    calculationValidation: exports.ValidationResultSchema,
    crossSystemValidation: exports.CrossSystemValidationSchema,
    summary: zod_1.z.object({
        totalChecks: zod_1.z.number(),
        passedChecks: zod_1.z.number(),
        failedChecks: zod_1.z.number(),
        overallScore: zod_1.z.number().min(0).max(100)
    }),
    validatedAt: zod_1.z.string().datetime()
});
// ============================================================================
// ERROR TYPES
// ============================================================================
class TabezaValidationError extends Error {
    constructor(message, code, field, context) {
        super(message);
        this.code = code;
        this.field = field;
        this.context = context;
        this.name = 'TabezaValidationError';
    }
}
exports.TabezaValidationError = TabezaValidationError;
class SanitizationError extends Error {
    constructor(message, field, originalValue, context) {
        super(message);
        this.field = field;
        this.originalValue = originalValue;
        this.context = context;
        this.name = 'SanitizationError';
    }
}
exports.SanitizationError = SanitizationError;
class BusinessRuleViolationError extends Error {
    constructor(message, ruleName, severity, context) {
        super(message);
        this.ruleName = ruleName;
        this.severity = severity;
        this.context = context;
        this.name = 'BusinessRuleViolationError';
    }
}
exports.BusinessRuleViolationError = BusinessRuleViolationError;
class CrossSystemCompatibilityError extends Error {
    constructor(message, incompatibleSystems, issues, context) {
        super(message);
        this.incompatibleSystems = incompatibleSystems;
        this.issues = issues;
        this.context = context;
        this.name = 'CrossSystemCompatibilityError';
    }
}
exports.CrossSystemCompatibilityError = CrossSystemCompatibilityError;
// ============================================================================
// CONSTANTS
// ============================================================================
exports.DEFAULT_VALIDATION_CONFIG = {
    validateStructure: true,
    validateBusinessRules: true,
    validateCalculations: true,
    validateTimestamps: true,
    validateReferences: true,
    strictMode: false,
    allowPartialData: false
};
exports.DEFAULT_SANITIZATION_OPTIONS = {
    trimWhitespace: true,
    normalizeUnicode: true,
    removeControlChars: true,
    validateFormat: true,
    strictMode: false
};
// ============================================================================
// VALIDATION THRESHOLDS
// ============================================================================
exports.VALIDATION_THRESHOLDS = {
    EXCELLENT: 95,
    GOOD: 85,
    ACCEPTABLE: 70,
    POOR: 50,
    CRITICAL: 30
};
exports.BUSINESS_RULE_WEIGHTS = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 10,
    LOW: 5
};
//# sourceMappingURL=types.js.map