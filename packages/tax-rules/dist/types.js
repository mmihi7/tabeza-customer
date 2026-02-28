"use strict";
/**
 * TABEZA Tax Rules Engine - Type Definitions
 * Pure types for tax calculations and compliance validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedJurisdictionError = exports.ComplianceValidationError = exports.TaxCalculationError = exports.JurisdictionRulesSchema = exports.TaxRateSchema = exports.ComplianceValidationSchema = exports.KRAPinValidationSchema = exports.TaxCalculationResultSchema = exports.TaxableItemSchema = exports.ExciseTaxCalculationSchema = exports.VATCalculationSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// CORE TAX TYPES
// ============================================================================
exports.VATCalculationSchema = zod_1.z.object({
    subtotal: zod_1.z.number().nonnegative('Subtotal cannot be negative'),
    vatAmount: zod_1.z.number().nonnegative('VAT amount cannot be negative'),
    total: zod_1.z.number().nonnegative('Total cannot be negative'),
    rate: zod_1.z.number().min(0).max(1, 'VAT rate must be between 0 and 1'),
    inclusive: zod_1.z.boolean(),
    category: zod_1.z.string().optional()
});
exports.ExciseTaxCalculationSchema = zod_1.z.object({
    baseAmount: zod_1.z.number().nonnegative('Base amount cannot be negative'),
    exciseAmount: zod_1.z.number().nonnegative('Excise amount cannot be negative'),
    rate: zod_1.z.number().nonnegative('Excise rate cannot be negative'),
    rateType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    category: zod_1.z.string()
});
exports.TaxableItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Item name is required'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    quantity: zod_1.z.number().positive('Quantity must be positive').default(1),
    category: zod_1.z.string().min(1, 'Category is required'),
    sku: zod_1.z.string().optional(),
    vatRate: zod_1.z.number().min(0).max(1).optional(),
    exciseRate: zod_1.z.number().nonnegative().optional(),
    exciseRateType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional()
});
exports.TaxCalculationResultSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        item: exports.TaxableItemSchema,
        vat: exports.VATCalculationSchema,
        excise: exports.ExciseTaxCalculationSchema.optional()
    })),
    totals: zod_1.z.object({
        subtotal: zod_1.z.number().nonnegative(),
        totalVAT: zod_1.z.number().nonnegative(),
        totalExcise: zod_1.z.number().nonnegative(),
        grandTotal: zod_1.z.number().nonnegative()
    }),
    jurisdiction: zod_1.z.string(),
    calculatedAt: zod_1.z.string().datetime()
});
// ============================================================================
// COMPLIANCE TYPES
// ============================================================================
exports.KRAPinValidationSchema = zod_1.z.object({
    pin: zod_1.z.string(),
    valid: zod_1.z.boolean(),
    format: zod_1.z.enum(['INDIVIDUAL', 'COMPANY', 'INVALID']),
    errors: zod_1.z.array(zod_1.z.string())
});
exports.ComplianceValidationSchema = zod_1.z.object({
    isCompliant: zod_1.z.boolean(),
    jurisdiction: zod_1.z.string(),
    issues: zod_1.z.array(zod_1.z.string()),
    warnings: zod_1.z.array(zod_1.z.string()),
    score: zod_1.z.number().min(0).max(100),
    validatedAt: zod_1.z.string().datetime()
});
// ============================================================================
// TAX RATES & RULES
// ============================================================================
exports.TaxRateSchema = zod_1.z.object({
    category: zod_1.z.string(),
    vatRate: zod_1.z.number().min(0).max(1),
    exciseRate: zod_1.z.number().nonnegative().optional(),
    exciseRateType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    description: zod_1.z.string().optional(),
    effectiveFrom: zod_1.z.string().datetime().optional(),
    effectiveTo: zod_1.z.string().datetime().optional()
});
exports.JurisdictionRulesSchema = zod_1.z.object({
    jurisdiction: zod_1.z.string(),
    currency: zod_1.z.string(),
    standardVATRate: zod_1.z.number().min(0).max(1),
    zeroRatedCategories: zod_1.z.array(zod_1.z.string()),
    exemptCategories: zod_1.z.array(zod_1.z.string()),
    taxRates: zod_1.z.array(exports.TaxRateSchema),
    pinValidationRules: zod_1.z.object({
        format: zod_1.z.string(), // Regex pattern
        length: zod_1.z.number().int().positive(),
        checkDigit: zod_1.z.boolean()
    }),
    complianceRules: zod_1.z.array(zod_1.z.object({
        rule: zod_1.z.string(),
        description: zod_1.z.string(),
        severity: zod_1.z.enum(['ERROR', 'WARNING', 'INFO'])
    }))
});
// ============================================================================
// ERROR TYPES
// ============================================================================
class TaxCalculationError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'TaxCalculationError';
    }
}
exports.TaxCalculationError = TaxCalculationError;
class ComplianceValidationError extends Error {
    constructor(message, violations, jurisdiction) {
        super(message);
        this.violations = violations;
        this.jurisdiction = jurisdiction;
        this.name = 'ComplianceValidationError';
    }
}
exports.ComplianceValidationError = ComplianceValidationError;
class UnsupportedJurisdictionError extends Error {
    constructor(jurisdiction) {
        super(`Jurisdiction '${jurisdiction}' is not supported`);
        this.name = 'UnsupportedJurisdictionError';
    }
}
exports.UnsupportedJurisdictionError = UnsupportedJurisdictionError;
//# sourceMappingURL=types.js.map