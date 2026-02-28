/**
 * TABEZA Tax Rules Engine - Excise Tax Calculator
 * Pure excise tax calculation functions for applicable items
 */
import type { ExciseTaxCalculation, ExciseTaxCalculationParams, TaxableItem, SupportedJurisdiction, ExciseRateType } from '../types';
/**
 * Calculate excise tax for a single amount
 */
export declare function calculateExciseTax(params: ExciseTaxCalculationParams): ExciseTaxCalculation;
/**
 * Calculate excise tax for multiple items
 */
export declare function calculateExciseTaxForItems(items: TaxableItem[], jurisdiction: SupportedJurisdiction): Array<{
    item: TaxableItem;
    excise: ExciseTaxCalculation | null;
}>;
/**
 * Get excise tax information for a specific item
 */
export declare function getExciseInfoForItem(item: TaxableItem, jurisdiction: SupportedJurisdiction): {
    rate: number;
    rateType: ExciseRateType;
} | null;
/**
 * Check if an item is subject to excise tax
 */
export declare function isSubjectToExciseTax(item: TaxableItem, jurisdiction: SupportedJurisdiction): boolean;
/**
 * Get all excise tax rates for a jurisdiction
 */
export declare function getExciseTaxRates(jurisdiction: SupportedJurisdiction): Array<{
    category: string;
    rate: number;
    rateType: ExciseRateType;
    description?: string;
}>;
/**
 * Calculate total excise tax for multiple calculations
 */
export declare function calculateTotalExciseTax(exciseCalculations: (ExciseTaxCalculation | null)[]): number;
/**
 * Validate excise tax calculation
 */
export declare function validateExciseTaxCalculation(baseAmount: number, exciseAmount: number, rate: number, rateType: ExciseRateType): {
    valid: boolean;
    errors: string[];
};
/**
 * Get excise tax categories for a jurisdiction
 */
export declare function getExciseTaxCategories(jurisdiction: SupportedJurisdiction): string[];
/**
 * Calculate excise tax impact on final price
 */
export declare function calculateExciseImpact(basePrice: number, exciseRate: number, exciseRateType: ExciseRateType, vatRate?: number): {
    basePrice: number;
    exciseAmount: number;
    priceAfterExcise: number;
    vatOnTotal: number;
    finalPrice: number;
};
//# sourceMappingURL=excise-calculator.d.ts.map