/**
 * TABEZA Tax Rules Engine - Main Tax Rule Engine
 * Orchestrates all tax calculations and compliance validation
 */
import type { TaxCalculationResult, TaxCalculationParams, SupportedJurisdiction, ComplianceValidation, ComplianceValidationParams } from '../types';
/**
 * Main Tax Rule Engine class
 */
export declare class TaxRuleEngine {
    private jurisdiction;
    private rules;
    constructor(jurisdiction: SupportedJurisdiction);
    /**
     * Calculate taxes for multiple items
     */
    calculateTaxes(params: TaxCalculationParams): TaxCalculationResult;
    /**
     * Calculate totals from individual item calculations
     */
    private calculateTotals;
    /**
     * Get applicable tax rates for a category
     */
    getApplicableRates(category: string): {
        vatRate: number;
        exciseRate?: number;
        exciseRateType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
        description?: string;
    };
    /**
     * Validate receipt tax calculations
     */
    validateReceipt(params: ComplianceValidationParams): ComplianceValidation;
    /**
     * Validate tax calculations in receipt
     */
    private validateTaxCalculations;
    /**
     * Apply jurisdiction-specific compliance rules
     */
    private applyComplianceRules;
    /**
     * Get jurisdiction information
     */
    getJurisdictionInfo(): {
        jurisdiction: SupportedJurisdiction;
        currency: string;
        standardVATRate: number;
        supportedFeatures: string[];
    };
    /**
     * Update jurisdiction (creates new engine instance)
     */
    static createForJurisdiction(jurisdiction: SupportedJurisdiction): TaxRuleEngine;
}
//# sourceMappingURL=tax-rule-engine.d.ts.map