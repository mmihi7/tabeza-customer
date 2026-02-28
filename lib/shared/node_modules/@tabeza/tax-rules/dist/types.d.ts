/**
 * TABEZA Tax Rules Engine - Type Definitions
 * Pure types for tax calculations and compliance validation
 */
import { z } from 'zod';
export declare const VATCalculationSchema: z.ZodObject<{
    subtotal: z.ZodNumber;
    vatAmount: z.ZodNumber;
    total: z.ZodNumber;
    rate: z.ZodNumber;
    inclusive: z.ZodBoolean;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subtotal: number;
    vatAmount: number;
    total: number;
    rate: number;
    inclusive: boolean;
    category?: string | undefined;
}, {
    subtotal: number;
    vatAmount: number;
    total: number;
    rate: number;
    inclusive: boolean;
    category?: string | undefined;
}>;
export declare const ExciseTaxCalculationSchema: z.ZodObject<{
    baseAmount: z.ZodNumber;
    exciseAmount: z.ZodNumber;
    rate: z.ZodNumber;
    rateType: z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>;
    category: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rate: number;
    category: string;
    baseAmount: number;
    exciseAmount: number;
    rateType: "PERCENTAGE" | "FIXED_AMOUNT";
}, {
    rate: number;
    category: string;
    baseAmount: number;
    exciseAmount: number;
    rateType: "PERCENTAGE" | "FIXED_AMOUNT";
}>;
export declare const TaxableItemSchema: z.ZodObject<{
    name: z.ZodString;
    amount: z.ZodNumber;
    quantity: z.ZodDefault<z.ZodNumber>;
    category: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    vatRate: z.ZodOptional<z.ZodNumber>;
    exciseRate: z.ZodOptional<z.ZodNumber>;
    exciseRateType: z.ZodOptional<z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>>;
}, "strip", z.ZodTypeAny, {
    category: string;
    name: string;
    amount: number;
    quantity: number;
    sku?: string | undefined;
    vatRate?: number | undefined;
    exciseRate?: number | undefined;
    exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
}, {
    category: string;
    name: string;
    amount: number;
    quantity?: number | undefined;
    sku?: string | undefined;
    vatRate?: number | undefined;
    exciseRate?: number | undefined;
    exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
}>;
export declare const TaxCalculationResultSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        item: z.ZodObject<{
            name: z.ZodString;
            amount: z.ZodNumber;
            quantity: z.ZodDefault<z.ZodNumber>;
            category: z.ZodString;
            sku: z.ZodOptional<z.ZodString>;
            vatRate: z.ZodOptional<z.ZodNumber>;
            exciseRate: z.ZodOptional<z.ZodNumber>;
            exciseRateType: z.ZodOptional<z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>>;
        }, "strip", z.ZodTypeAny, {
            category: string;
            name: string;
            amount: number;
            quantity: number;
            sku?: string | undefined;
            vatRate?: number | undefined;
            exciseRate?: number | undefined;
            exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        }, {
            category: string;
            name: string;
            amount: number;
            quantity?: number | undefined;
            sku?: string | undefined;
            vatRate?: number | undefined;
            exciseRate?: number | undefined;
            exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        }>;
        vat: z.ZodObject<{
            subtotal: z.ZodNumber;
            vatAmount: z.ZodNumber;
            total: z.ZodNumber;
            rate: z.ZodNumber;
            inclusive: z.ZodBoolean;
            category: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            subtotal: number;
            vatAmount: number;
            total: number;
            rate: number;
            inclusive: boolean;
            category?: string | undefined;
        }, {
            subtotal: number;
            vatAmount: number;
            total: number;
            rate: number;
            inclusive: boolean;
            category?: string | undefined;
        }>;
        excise: z.ZodOptional<z.ZodObject<{
            baseAmount: z.ZodNumber;
            exciseAmount: z.ZodNumber;
            rate: z.ZodNumber;
            rateType: z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>;
            category: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            rate: number;
            category: string;
            baseAmount: number;
            exciseAmount: number;
            rateType: "PERCENTAGE" | "FIXED_AMOUNT";
        }, {
            rate: number;
            category: string;
            baseAmount: number;
            exciseAmount: number;
            rateType: "PERCENTAGE" | "FIXED_AMOUNT";
        }>>;
    }, "strip", z.ZodTypeAny, {
        item: {
            category: string;
            name: string;
            amount: number;
            quantity: number;
            sku?: string | undefined;
            vatRate?: number | undefined;
            exciseRate?: number | undefined;
            exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        };
        vat: {
            subtotal: number;
            vatAmount: number;
            total: number;
            rate: number;
            inclusive: boolean;
            category?: string | undefined;
        };
        excise?: {
            rate: number;
            category: string;
            baseAmount: number;
            exciseAmount: number;
            rateType: "PERCENTAGE" | "FIXED_AMOUNT";
        } | undefined;
    }, {
        item: {
            category: string;
            name: string;
            amount: number;
            quantity?: number | undefined;
            sku?: string | undefined;
            vatRate?: number | undefined;
            exciseRate?: number | undefined;
            exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        };
        vat: {
            subtotal: number;
            vatAmount: number;
            total: number;
            rate: number;
            inclusive: boolean;
            category?: string | undefined;
        };
        excise?: {
            rate: number;
            category: string;
            baseAmount: number;
            exciseAmount: number;
            rateType: "PERCENTAGE" | "FIXED_AMOUNT";
        } | undefined;
    }>, "many">;
    totals: z.ZodObject<{
        subtotal: z.ZodNumber;
        totalVAT: z.ZodNumber;
        totalExcise: z.ZodNumber;
        grandTotal: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        subtotal: number;
        totalVAT: number;
        totalExcise: number;
        grandTotal: number;
    }, {
        subtotal: number;
        totalVAT: number;
        totalExcise: number;
        grandTotal: number;
    }>;
    jurisdiction: z.ZodString;
    calculatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    items: {
        item: {
            category: string;
            name: string;
            amount: number;
            quantity: number;
            sku?: string | undefined;
            vatRate?: number | undefined;
            exciseRate?: number | undefined;
            exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        };
        vat: {
            subtotal: number;
            vatAmount: number;
            total: number;
            rate: number;
            inclusive: boolean;
            category?: string | undefined;
        };
        excise?: {
            rate: number;
            category: string;
            baseAmount: number;
            exciseAmount: number;
            rateType: "PERCENTAGE" | "FIXED_AMOUNT";
        } | undefined;
    }[];
    totals: {
        subtotal: number;
        totalVAT: number;
        totalExcise: number;
        grandTotal: number;
    };
    jurisdiction: string;
    calculatedAt: string;
}, {
    items: {
        item: {
            category: string;
            name: string;
            amount: number;
            quantity?: number | undefined;
            sku?: string | undefined;
            vatRate?: number | undefined;
            exciseRate?: number | undefined;
            exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        };
        vat: {
            subtotal: number;
            vatAmount: number;
            total: number;
            rate: number;
            inclusive: boolean;
            category?: string | undefined;
        };
        excise?: {
            rate: number;
            category: string;
            baseAmount: number;
            exciseAmount: number;
            rateType: "PERCENTAGE" | "FIXED_AMOUNT";
        } | undefined;
    }[];
    totals: {
        subtotal: number;
        totalVAT: number;
        totalExcise: number;
        grandTotal: number;
    };
    jurisdiction: string;
    calculatedAt: string;
}>;
export declare const KRAPinValidationSchema: z.ZodObject<{
    pin: z.ZodString;
    valid: z.ZodBoolean;
    format: z.ZodEnum<["INDIVIDUAL", "COMPANY", "INVALID"]>;
    errors: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    pin: string;
    format: "INDIVIDUAL" | "COMPANY" | "INVALID";
    errors: string[];
}, {
    valid: boolean;
    pin: string;
    format: "INDIVIDUAL" | "COMPANY" | "INVALID";
    errors: string[];
}>;
export declare const ComplianceValidationSchema: z.ZodObject<{
    isCompliant: z.ZodBoolean;
    jurisdiction: z.ZodString;
    issues: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
    score: z.ZodNumber;
    validatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    issues: string[];
    jurisdiction: string;
    isCompliant: boolean;
    warnings: string[];
    score: number;
    validatedAt: string;
}, {
    issues: string[];
    jurisdiction: string;
    isCompliant: boolean;
    warnings: string[];
    score: number;
    validatedAt: string;
}>;
export declare const TaxRateSchema: z.ZodObject<{
    category: z.ZodString;
    vatRate: z.ZodNumber;
    exciseRate: z.ZodOptional<z.ZodNumber>;
    exciseRateType: z.ZodOptional<z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>>;
    description: z.ZodOptional<z.ZodString>;
    effectiveFrom: z.ZodOptional<z.ZodString>;
    effectiveTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: string;
    vatRate: number;
    exciseRate?: number | undefined;
    exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
    description?: string | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
}, {
    category: string;
    vatRate: number;
    exciseRate?: number | undefined;
    exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
    description?: string | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
}>;
export declare const JurisdictionRulesSchema: z.ZodObject<{
    jurisdiction: z.ZodString;
    currency: z.ZodString;
    standardVATRate: z.ZodNumber;
    zeroRatedCategories: z.ZodArray<z.ZodString, "many">;
    exemptCategories: z.ZodArray<z.ZodString, "many">;
    taxRates: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        vatRate: z.ZodNumber;
        exciseRate: z.ZodOptional<z.ZodNumber>;
        exciseRateType: z.ZodOptional<z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>>;
        description: z.ZodOptional<z.ZodString>;
        effectiveFrom: z.ZodOptional<z.ZodString>;
        effectiveTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        vatRate: number;
        exciseRate?: number | undefined;
        exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        description?: string | undefined;
        effectiveFrom?: string | undefined;
        effectiveTo?: string | undefined;
    }, {
        category: string;
        vatRate: number;
        exciseRate?: number | undefined;
        exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        description?: string | undefined;
        effectiveFrom?: string | undefined;
        effectiveTo?: string | undefined;
    }>, "many">;
    pinValidationRules: z.ZodObject<{
        format: z.ZodString;
        length: z.ZodNumber;
        checkDigit: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        length: number;
        format: string;
        checkDigit: boolean;
    }, {
        length: number;
        format: string;
        checkDigit: boolean;
    }>;
    complianceRules: z.ZodArray<z.ZodObject<{
        rule: z.ZodString;
        description: z.ZodString;
        severity: z.ZodEnum<["ERROR", "WARNING", "INFO"]>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        rule: string;
        severity: "ERROR" | "WARNING" | "INFO";
    }, {
        description: string;
        rule: string;
        severity: "ERROR" | "WARNING" | "INFO";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    jurisdiction: string;
    currency: string;
    standardVATRate: number;
    zeroRatedCategories: string[];
    exemptCategories: string[];
    taxRates: {
        category: string;
        vatRate: number;
        exciseRate?: number | undefined;
        exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        description?: string | undefined;
        effectiveFrom?: string | undefined;
        effectiveTo?: string | undefined;
    }[];
    pinValidationRules: {
        length: number;
        format: string;
        checkDigit: boolean;
    };
    complianceRules: {
        description: string;
        rule: string;
        severity: "ERROR" | "WARNING" | "INFO";
    }[];
}, {
    jurisdiction: string;
    currency: string;
    standardVATRate: number;
    zeroRatedCategories: string[];
    exemptCategories: string[];
    taxRates: {
        category: string;
        vatRate: number;
        exciseRate?: number | undefined;
        exciseRateType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
        description?: string | undefined;
        effectiveFrom?: string | undefined;
        effectiveTo?: string | undefined;
    }[];
    pinValidationRules: {
        length: number;
        format: string;
        checkDigit: boolean;
    };
    complianceRules: {
        description: string;
        rule: string;
        severity: "ERROR" | "WARNING" | "INFO";
    }[];
}>;
export type VATCalculation = z.infer<typeof VATCalculationSchema>;
export type ExciseTaxCalculation = z.infer<typeof ExciseTaxCalculationSchema>;
export type TaxableItem = z.infer<typeof TaxableItemSchema>;
export type TaxCalculationResult = z.infer<typeof TaxCalculationResultSchema>;
export type KRAPinValidation = z.infer<typeof KRAPinValidationSchema>;
export type ComplianceValidation = z.infer<typeof ComplianceValidationSchema>;
export type TaxRate = z.infer<typeof TaxRateSchema>;
export type JurisdictionRules = z.infer<typeof JurisdictionRulesSchema>;
export type SupportedJurisdiction = 'KE' | 'UG' | 'TZ' | 'RW';
export type TaxCategory = 'FOOD_BASIC' | 'FOOD_PREPARED' | 'BEVERAGE_NON_ALCOHOLIC' | 'BEVERAGE_ALCOHOLIC' | 'ALCOHOL' | 'TOBACCO' | 'FUEL' | 'MEDICAL' | 'EDUCATION' | 'TRANSPORT' | 'ACCOMMODATION' | 'RETAIL' | 'SERVICE' | 'OTHER';
export type VATRateType = 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
export type ExciseRateType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export interface VATCalculationParams {
    amount: number;
    rate: number;
    inclusive?: boolean;
    category?: string;
}
export interface ExciseTaxCalculationParams {
    amount: number;
    rate: number;
    rateType: ExciseRateType;
    category: string;
}
export interface TaxCalculationParams {
    items: TaxableItem[];
    jurisdiction: SupportedJurisdiction;
    merchantKRAPin?: string;
    calculationDate?: string;
}
export interface ComplianceValidationParams {
    receipt: {
        merchant: {
            kraPin?: string;
            name: string;
            registrationNo?: string;
        };
        items: Array<{
            name: string;
            amount: number;
            category?: string;
            vatRate?: number;
        }>;
        totals: {
            subtotal: number;
            tax: number;
            total: number;
        };
    };
    jurisdiction: SupportedJurisdiction;
    strictMode?: boolean;
}
export declare class TaxCalculationError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class ComplianceValidationError extends Error {
    violations: string[];
    jurisdiction: string;
    constructor(message: string, violations: string[], jurisdiction: string);
}
export declare class UnsupportedJurisdictionError extends Error {
    constructor(jurisdiction: string);
}
//# sourceMappingURL=types.d.ts.map