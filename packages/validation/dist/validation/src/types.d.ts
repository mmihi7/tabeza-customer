/**
 * TABEZA Validation Library - Type Definitions
 * Pure types for validation and data sanitization
 */
import { z } from 'zod';
import type { CompleteReceiptSession } from '@tabeza/receipt-schema';
export declare const ValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    score: z.ZodNumber;
    errors: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
    validatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    score: number;
    errors: string[];
    warnings: string[];
    validatedAt: string;
}, {
    valid: boolean;
    score: number;
    errors: string[];
    warnings: string[];
    validatedAt: string;
}>;
export declare const ValidationErrorSchema: z.ZodObject<{
    field: z.ZodString;
    message: z.ZodString;
    code: z.ZodString;
    severity: z.ZodEnum<["ERROR", "WARNING", "INFO"]>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    field: string;
    severity: "ERROR" | "WARNING" | "INFO";
    context?: Record<string, any> | undefined;
}, {
    code: string;
    message: string;
    field: string;
    severity: "ERROR" | "WARNING" | "INFO";
    context?: Record<string, any> | undefined;
}>;
export declare const ValidationWarningSchema: z.ZodObject<{
    field: z.ZodString;
    message: z.ZodString;
    suggestion: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    field: string;
    context?: Record<string, any> | undefined;
    suggestion?: string | undefined;
}, {
    message: string;
    field: string;
    context?: Record<string, any> | undefined;
    suggestion?: string | undefined;
}>;
export declare const BusinessRuleValidationSchema: z.ZodObject<{
    ruleName: z.ZodString;
    passed: z.ZodBoolean;
    message: z.ZodString;
    severity: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    ruleName: string;
    passed: boolean;
    details?: Record<string, any> | undefined;
}, {
    message: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    ruleName: string;
    passed: boolean;
    details?: Record<string, any> | undefined;
}>;
export declare const BusinessRuleResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    score: z.ZodNumber;
    rules: z.ZodArray<z.ZodObject<{
        ruleName: z.ZodString;
        passed: z.ZodBoolean;
        message: z.ZodString;
        severity: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
        ruleName: string;
        passed: boolean;
        details?: Record<string, any> | undefined;
    }, {
        message: string;
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
        ruleName: string;
        passed: boolean;
        details?: Record<string, any> | undefined;
    }>, "many">;
    summary: z.ZodObject<{
        totalRules: z.ZodNumber;
        passedRules: z.ZodNumber;
        failedRules: z.ZodNumber;
        criticalIssues: z.ZodNumber;
        highIssues: z.ZodNumber;
        mediumIssues: z.ZodNumber;
        lowIssues: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
    }, {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
    }>;
    validatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    score: number;
    validatedAt: string;
    rules: {
        message: string;
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
        ruleName: string;
        passed: boolean;
        details?: Record<string, any> | undefined;
    }[];
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
    };
}, {
    valid: boolean;
    score: number;
    validatedAt: string;
    rules: {
        message: string;
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
        ruleName: string;
        passed: boolean;
        details?: Record<string, any> | undefined;
    }[];
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
    };
}>;
export declare const SanitizationOptionsSchema: z.ZodObject<{
    trimWhitespace: z.ZodDefault<z.ZodBoolean>;
    normalizeUnicode: z.ZodDefault<z.ZodBoolean>;
    removeControlChars: z.ZodDefault<z.ZodBoolean>;
    validateFormat: z.ZodDefault<z.ZodBoolean>;
    strictMode: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    trimWhitespace: boolean;
    normalizeUnicode: boolean;
    removeControlChars: boolean;
    validateFormat: boolean;
    strictMode: boolean;
}, {
    trimWhitespace?: boolean | undefined;
    normalizeUnicode?: boolean | undefined;
    removeControlChars?: boolean | undefined;
    validateFormat?: boolean | undefined;
    strictMode?: boolean | undefined;
}>;
export declare const SanitizationResultSchema: z.ZodObject<{
    original: z.ZodAny;
    sanitized: z.ZodAny;
    changes: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        originalValue: z.ZodAny;
        sanitizedValue: z.ZodAny;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        field: string;
        reason: string;
        originalValue?: any;
        sanitizedValue?: any;
    }, {
        field: string;
        reason: string;
        originalValue?: any;
        sanitizedValue?: any;
    }>, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    warnings: string[];
    changes: {
        field: string;
        reason: string;
        originalValue?: any;
        sanitizedValue?: any;
    }[];
    original?: any;
    sanitized?: any;
}, {
    warnings: string[];
    changes: {
        field: string;
        reason: string;
        originalValue?: any;
        sanitizedValue?: any;
    }[];
    original?: any;
    sanitized?: any;
}>;
export declare const CrossSystemValidationSchema: z.ZodObject<{
    cloudCompatible: z.ZodBoolean;
    agentCompatible: z.ZodBoolean;
    consistencyScore: z.ZodNumber;
    issues: z.ZodArray<z.ZodObject<{
        system: z.ZodEnum<["CLOUD", "AGENT", "BOTH"]>;
        issue: z.ZodString;
        severity: z.ZodEnum<["BLOCKING", "WARNING", "INFO"]>;
        recommendation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        severity: "WARNING" | "INFO" | "BLOCKING";
        system: "CLOUD" | "AGENT" | "BOTH";
        issue: string;
        recommendation?: string | undefined;
    }, {
        severity: "WARNING" | "INFO" | "BLOCKING";
        system: "CLOUD" | "AGENT" | "BOTH";
        issue: string;
        recommendation?: string | undefined;
    }>, "many">;
    validatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    issues: {
        severity: "WARNING" | "INFO" | "BLOCKING";
        system: "CLOUD" | "AGENT" | "BOTH";
        issue: string;
        recommendation?: string | undefined;
    }[];
    validatedAt: string;
    cloudCompatible: boolean;
    agentCompatible: boolean;
    consistencyScore: number;
}, {
    issues: {
        severity: "WARNING" | "INFO" | "BLOCKING";
        system: "CLOUD" | "AGENT" | "BOTH";
        issue: string;
        recommendation?: string | undefined;
    }[];
    validatedAt: string;
    cloudCompatible: boolean;
    agentCompatible: boolean;
    consistencyScore: number;
}>;
export declare const ReceiptValidationConfigSchema: z.ZodObject<{
    validateStructure: z.ZodDefault<z.ZodBoolean>;
    validateBusinessRules: z.ZodDefault<z.ZodBoolean>;
    validateCalculations: z.ZodDefault<z.ZodBoolean>;
    validateTimestamps: z.ZodDefault<z.ZodBoolean>;
    validateReferences: z.ZodDefault<z.ZodBoolean>;
    strictMode: z.ZodDefault<z.ZodBoolean>;
    allowPartialData: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    validateBusinessRules: boolean;
    strictMode: boolean;
    validateStructure: boolean;
    validateCalculations: boolean;
    validateTimestamps: boolean;
    validateReferences: boolean;
    allowPartialData: boolean;
}, {
    validateBusinessRules?: boolean | undefined;
    strictMode?: boolean | undefined;
    validateStructure?: boolean | undefined;
    validateCalculations?: boolean | undefined;
    validateTimestamps?: boolean | undefined;
    validateReferences?: boolean | undefined;
    allowPartialData?: boolean | undefined;
}>;
export declare const ReceiptValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    score: z.ZodNumber;
    structureValidation: z.ZodObject<{
        valid: z.ZodBoolean;
        score: z.ZodNumber;
        errors: z.ZodArray<z.ZodString, "many">;
        warnings: z.ZodArray<z.ZodString, "many">;
        validatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    }, {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    }>;
    businessRuleValidation: z.ZodObject<{
        valid: z.ZodBoolean;
        score: z.ZodNumber;
        rules: z.ZodArray<z.ZodObject<{
            ruleName: z.ZodString;
            passed: z.ZodBoolean;
            message: z.ZodString;
            severity: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            ruleName: string;
            passed: boolean;
            details?: Record<string, any> | undefined;
        }, {
            message: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            ruleName: string;
            passed: boolean;
            details?: Record<string, any> | undefined;
        }>, "many">;
        summary: z.ZodObject<{
            totalRules: z.ZodNumber;
            passedRules: z.ZodNumber;
            failedRules: z.ZodNumber;
            criticalIssues: z.ZodNumber;
            highIssues: z.ZodNumber;
            mediumIssues: z.ZodNumber;
            lowIssues: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalRules: number;
            passedRules: number;
            failedRules: number;
            criticalIssues: number;
            highIssues: number;
            mediumIssues: number;
            lowIssues: number;
        }, {
            totalRules: number;
            passedRules: number;
            failedRules: number;
            criticalIssues: number;
            highIssues: number;
            mediumIssues: number;
            lowIssues: number;
        }>;
        validatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        valid: boolean;
        score: number;
        validatedAt: string;
        rules: {
            message: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            ruleName: string;
            passed: boolean;
            details?: Record<string, any> | undefined;
        }[];
        summary: {
            totalRules: number;
            passedRules: number;
            failedRules: number;
            criticalIssues: number;
            highIssues: number;
            mediumIssues: number;
            lowIssues: number;
        };
    }, {
        valid: boolean;
        score: number;
        validatedAt: string;
        rules: {
            message: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            ruleName: string;
            passed: boolean;
            details?: Record<string, any> | undefined;
        }[];
        summary: {
            totalRules: number;
            passedRules: number;
            failedRules: number;
            criticalIssues: number;
            highIssues: number;
            mediumIssues: number;
            lowIssues: number;
        };
    }>;
    calculationValidation: z.ZodObject<{
        valid: z.ZodBoolean;
        score: z.ZodNumber;
        errors: z.ZodArray<z.ZodString, "many">;
        warnings: z.ZodArray<z.ZodString, "many">;
        validatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    }, {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    }>;
    crossSystemValidation: z.ZodObject<{
        cloudCompatible: z.ZodBoolean;
        agentCompatible: z.ZodBoolean;
        consistencyScore: z.ZodNumber;
        issues: z.ZodArray<z.ZodObject<{
            system: z.ZodEnum<["CLOUD", "AGENT", "BOTH"]>;
            issue: z.ZodString;
            severity: z.ZodEnum<["BLOCKING", "WARNING", "INFO"]>;
            recommendation: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            severity: "WARNING" | "INFO" | "BLOCKING";
            system: "CLOUD" | "AGENT" | "BOTH";
            issue: string;
            recommendation?: string | undefined;
        }, {
            severity: "WARNING" | "INFO" | "BLOCKING";
            system: "CLOUD" | "AGENT" | "BOTH";
            issue: string;
            recommendation?: string | undefined;
        }>, "many">;
        validatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        issues: {
            severity: "WARNING" | "INFO" | "BLOCKING";
            system: "CLOUD" | "AGENT" | "BOTH";
            issue: string;
            recommendation?: string | undefined;
        }[];
        validatedAt: string;
        cloudCompatible: boolean;
        agentCompatible: boolean;
        consistencyScore: number;
    }, {
        issues: {
            severity: "WARNING" | "INFO" | "BLOCKING";
            system: "CLOUD" | "AGENT" | "BOTH";
            issue: string;
            recommendation?: string | undefined;
        }[];
        validatedAt: string;
        cloudCompatible: boolean;
        agentCompatible: boolean;
        consistencyScore: number;
    }>;
    summary: z.ZodObject<{
        totalChecks: z.ZodNumber;
        passedChecks: z.ZodNumber;
        failedChecks: z.ZodNumber;
        overallScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        overallScore: number;
    }, {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        overallScore: number;
    }>;
    validatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    score: number;
    validatedAt: string;
    summary: {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        overallScore: number;
    };
    structureValidation: {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    };
    businessRuleValidation: {
        valid: boolean;
        score: number;
        validatedAt: string;
        rules: {
            message: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            ruleName: string;
            passed: boolean;
            details?: Record<string, any> | undefined;
        }[];
        summary: {
            totalRules: number;
            passedRules: number;
            failedRules: number;
            criticalIssues: number;
            highIssues: number;
            mediumIssues: number;
            lowIssues: number;
        };
    };
    calculationValidation: {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    };
    crossSystemValidation: {
        issues: {
            severity: "WARNING" | "INFO" | "BLOCKING";
            system: "CLOUD" | "AGENT" | "BOTH";
            issue: string;
            recommendation?: string | undefined;
        }[];
        validatedAt: string;
        cloudCompatible: boolean;
        agentCompatible: boolean;
        consistencyScore: number;
    };
}, {
    valid: boolean;
    score: number;
    validatedAt: string;
    summary: {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        overallScore: number;
    };
    structureValidation: {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    };
    businessRuleValidation: {
        valid: boolean;
        score: number;
        validatedAt: string;
        rules: {
            message: string;
            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            ruleName: string;
            passed: boolean;
            details?: Record<string, any> | undefined;
        }[];
        summary: {
            totalRules: number;
            passedRules: number;
            failedRules: number;
            criticalIssues: number;
            highIssues: number;
            mediumIssues: number;
            lowIssues: number;
        };
    };
    calculationValidation: {
        valid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        validatedAt: string;
    };
    crossSystemValidation: {
        issues: {
            severity: "WARNING" | "INFO" | "BLOCKING";
            system: "CLOUD" | "AGENT" | "BOTH";
            issue: string;
            recommendation?: string | undefined;
        }[];
        validatedAt: string;
        cloudCompatible: boolean;
        agentCompatible: boolean;
        consistencyScore: number;
    };
}>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type TabezaValidationErrorType = z.infer<typeof ValidationErrorSchema>;
export type ValidationWarning = z.infer<typeof ValidationWarningSchema>;
export type BusinessRuleValidation = z.infer<typeof BusinessRuleValidationSchema>;
export type BusinessRuleResult = z.infer<typeof BusinessRuleResultSchema>;
export type SanitizationOptions = z.infer<typeof SanitizationOptionsSchema>;
export type SanitizationResult = z.infer<typeof SanitizationResultSchema>;
export type CrossSystemValidation = z.infer<typeof CrossSystemValidationSchema>;
export type ReceiptValidationConfig = z.infer<typeof ReceiptValidationConfigSchema>;
export type ReceiptValidationResult = z.infer<typeof ReceiptValidationResultSchema>;
export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';
export type BusinessRuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SystemType = 'CLOUD' | 'AGENT' | 'BOTH';
export type IssueSeverity = 'BLOCKING' | 'WARNING' | 'INFO';
export interface ValidationRule {
    name: string;
    description: string;
    severity: BusinessRuleSeverity;
    validate: (data: any) => boolean;
    getMessage: (data: any) => string;
    getDetails?: (data: any) => Record<string, any>;
}
export interface SanitizationRule {
    name: string;
    description: string;
    sanitize: (value: any) => any;
    validate?: (value: any) => boolean;
}
export interface ValidateReceiptDataParams {
    receipt: CompleteReceiptSession;
    config?: ReceiptValidationConfig;
}
export interface ValidateBusinessRulesParams {
    receipt: CompleteReceiptSession;
    strictMode?: boolean;
    customRules?: ValidationRule[];
}
export interface SanitizeDataParams {
    data: any;
    options?: SanitizationOptions;
    customRules?: SanitizationRule[];
}
export interface CrossSystemValidationParams {
    data: any;
    targetSystems: SystemType[];
    strictMode?: boolean;
}
export declare class TabezaValidationError extends Error {
    code: string;
    field?: string | undefined;
    context?: Record<string, any> | undefined;
    constructor(message: string, code: string, field?: string | undefined, context?: Record<string, any> | undefined);
}
export declare class SanitizationError extends Error {
    field: string;
    originalValue: any;
    context?: Record<string, any> | undefined;
    constructor(message: string, field: string, originalValue: any, context?: Record<string, any> | undefined);
}
export declare class BusinessRuleViolationError extends Error {
    ruleName: string;
    severity: BusinessRuleSeverity;
    context?: Record<string, any> | undefined;
    constructor(message: string, ruleName: string, severity: BusinessRuleSeverity, context?: Record<string, any> | undefined);
}
export declare class CrossSystemCompatibilityError extends Error {
    incompatibleSystems: SystemType[];
    issues: string[];
    context?: Record<string, any> | undefined;
    constructor(message: string, incompatibleSystems: SystemType[], issues: string[], context?: Record<string, any> | undefined);
}
export declare const DEFAULT_VALIDATION_CONFIG: ReceiptValidationConfig;
export declare const DEFAULT_SANITIZATION_OPTIONS: SanitizationOptions;
export declare const VALIDATION_THRESHOLDS: {
    readonly EXCELLENT: 95;
    readonly GOOD: 85;
    readonly ACCEPTABLE: 70;
    readonly POOR: 50;
    readonly CRITICAL: 30;
};
export declare const BUSINESS_RULE_WEIGHTS: {
    readonly CRITICAL: 25;
    readonly HIGH: 15;
    readonly MEDIUM: 10;
    readonly LOW: 5;
};
//# sourceMappingURL=types.d.ts.map