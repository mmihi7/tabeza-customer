/**
 * TABEZA Validation Library - Business Rule Validator
 * Extracted business rule validation logic from virtual-printer
 */
import type { CompleteReceiptSession } from '@tabeza/receipt-schema';
import type { BusinessRuleResult, ValidationRule, BusinessRuleSeverity } from '../types';
/**
 * Business Rule Validator Class
 * Handles validation of business rules against receipt data
 */
export declare class BusinessRuleValidator {
    private customRules;
    private strictMode;
    constructor(options?: {
        customRules?: ValidationRule[];
        strictMode?: boolean;
    });
    /**
     * Validate business rules against a receipt
     */
    validate(receipt: CompleteReceiptSession): BusinessRuleResult;
    /**
     * Add custom business rule
     */
    addRule(rule: ValidationRule): void;
    /**
     * Remove custom business rule
     */
    removeRule(ruleName: string): boolean;
    /**
     * Get all rules (built-in + custom)
     */
    getAllRules(): ValidationRule[];
    /**
     * Get rule by name
     */
    getRule(ruleName: string): ValidationRule | undefined;
    /**
     * Validate specific rule against receipt
     */
    validateRule(ruleName: string, receipt: CompleteReceiptSession): {
        passed: boolean;
        message: string;
        severity: BusinessRuleSeverity;
    } | null;
    /**
     * Get validation summary
     */
    getSummary(receipt: CompleteReceiptSession): {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalIssues: number;
        score: number;
        worstSeverity: BusinessRuleSeverity | null;
    };
    /**
     * Set strict mode
     */
    setStrictMode(strict: boolean): void;
    /**
     * Get strict mode status
     */
    isStrictMode(): boolean;
}
//# sourceMappingURL=business-rule-validator.d.ts.map