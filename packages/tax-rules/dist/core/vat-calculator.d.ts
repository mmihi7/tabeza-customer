/**
 * TABEZA Tax Rules Engine - VAT Calculator
 * Pure VAT calculation functions with no OS dependencies
 */
import type { VATCalculation, VATCalculationParams, TaxableItem, SupportedJurisdiction } from '../types';
/**
 * Calculate VAT for a single amount
 */
export declare function calculateVAT(params: VATCalculationParams): VATCalculation;
/**
 * Calculate VAT for multiple items
 */
export declare function calculateVATForItems(items: TaxableItem[], jurisdiction: SupportedJurisdiction): Array<{
    item: TaxableItem;
    vat: VATCalculation;
}>;
/**
 * Get VAT rate for a specific item based on jurisdiction rules
 */
export declare function getVATRateForItem(item: TaxableItem, jurisdiction: SupportedJurisdiction): number;
/**
 * Validate VAT calculation accuracy
 */
export declare function validateVATCalculation(subtotal: number, vatAmount: number, total: number, rate: number, inclusive?: boolean): {
    valid: boolean;
    errors: string[];
};
/**
 * Calculate effective VAT rate from amounts
 */
export declare function calculateEffectiveVATRate(subtotal: number, vatAmount: number): number;
/**
 * Check if an item category is VAT exempt in a jurisdiction
 */
export declare function isVATExempt(category: string, jurisdiction: SupportedJurisdiction): boolean;
/**
 * Get all applicable VAT rates for a jurisdiction
 */
export declare function getApplicableVATRates(jurisdiction: SupportedJurisdiction): Array<{
    category: string;
    rate: number;
    description?: string;
}>;
//# sourceMappingURL=vat-calculator.d.ts.map