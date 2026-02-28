/**
 * TABEZA Tax Rules Engine
 * Pure tax calculation logic extracted for serverless compatibility
 *
 * This package contains only pure functions with no OS dependencies,
 * making it suitable for both cloud (Vercel) and agent (Windows) systems.
 */
import type { VATCalculation, TaxableItem, TaxCalculationResult, ComplianceValidation, SupportedJurisdiction, ExciseRateType, ComplianceValidationParams } from './types';
export { TaxRuleEngine } from './core/tax-rule-engine';
export { calculateVAT, calculateVATForItems, getVATRateForItem, validateVATCalculation, calculateEffectiveVATRate, isVATExempt, getApplicableVATRates } from './core/vat-calculator';
export { calculateExciseTax, calculateExciseTaxForItems, getExciseInfoForItem, isSubjectToExciseTax, getExciseTaxRates, calculateTotalExciseTax, validateExciseTaxCalculation, getExciseTaxCategories, calculateExciseImpact } from './core/excise-calculator';
export { validateKRAPin, extractKRAPinInfo, generateSampleKRAPin, validateMultipleKRAPins, isTestKRAPin, formatKRAPinForDisplay, getKRAPinValidationRules, validateKRAPinWithBusinessRules } from './core/kra-pin-validator';
export type { VATCalculation, ExciseTaxCalculation, TaxableItem, TaxCalculationResult, KRAPinValidation, ComplianceValidation, TaxRate, JurisdictionRules, SupportedJurisdiction, TaxCategory, VATRateType, ExciseRateType, VATCalculationParams, ExciseTaxCalculationParams, TaxCalculationParams, ComplianceValidationParams } from './types';
export { TaxCalculationError, ComplianceValidationError, UnsupportedJurisdictionError } from './types';
export { SUPPORTED_JURISDICTIONS, TAX_CATEGORIES, JURISDICTION_RULES, KENYA_TAX_RULES, UGANDA_TAX_RULES, TANZANIA_TAX_RULES, RWANDA_TAX_RULES, DEFAULT_VAT_RATE, DEFAULT_JURISDICTION, VAT_CALCULATION_PRECISION, EXCISE_CALCULATION_PRECISION, MIN_TAX_RATE, MAX_TAX_RATE, MIN_AMOUNT, MAX_AMOUNT, KRA_PIN_PATTERNS, CATEGORY_KEYWORDS, ERROR_MESSAGES } from './constants';
/**
 * Quick VAT calculation for a single amount
 */
export declare function quickVATCalculation(amount: number, jurisdiction?: SupportedJurisdiction, inclusive?: boolean): VATCalculation;
/**
 * Quick compliance check for a receipt
 */
export declare function quickComplianceCheck(receipt: ComplianceValidationParams['receipt'], jurisdiction?: SupportedJurisdiction): ComplianceValidation;
/**
 * Get tax information for a jurisdiction
 */
export declare function getJurisdictionTaxInfo(jurisdiction: SupportedJurisdiction): {
    jurisdiction: SupportedJurisdiction;
    currency: string;
    standardVATRate: number;
    vatRates: Array<{
        category: string;
        rate: number;
        description?: string;
    }>;
    exciseRates: Array<{
        category: string;
        rate: number;
        rateType: ExciseRateType;
        description?: string;
    }>;
    complianceFeatures: string[];
};
/**
 * Validate and calculate taxes for items in one call
 */
export declare function validateAndCalculateTaxes(items: TaxableItem[], jurisdiction?: SupportedJurisdiction, merchantKRAPin?: string): {
    calculation: TaxCalculationResult;
    validation: ComplianceValidation;
};
export declare const VERSION = "1.0.0";
export declare const PACKAGE_NAME = "@tabeza/tax-rules";
export declare const DESCRIPTION = "Pure tax calculation logic - serverless compatible";
/**
 * Get package information
 */
export declare function getPackageInfo(): {
    name: string;
    version: string;
    description: string;
    features: string[];
    supportedJurisdictions: SupportedJurisdiction[];
    architecture: string;
};
//# sourceMappingURL=index.d.ts.map