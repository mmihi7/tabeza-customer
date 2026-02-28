/**
 * TABEZA Tax Rules Engine - Constants
 * Tax rates, categories, and jurisdiction-specific rules
 */
import type { JurisdictionRules, SupportedJurisdiction, TaxCategory } from './types';
export declare const SUPPORTED_JURISDICTIONS: SupportedJurisdiction[];
export declare const TAX_CATEGORIES: Record<TaxCategory, string>;
export declare const KENYA_TAX_RULES: JurisdictionRules;
export declare const UGANDA_TAX_RULES: JurisdictionRules;
export declare const TANZANIA_TAX_RULES: JurisdictionRules;
export declare const RWANDA_TAX_RULES: JurisdictionRules;
export declare const JURISDICTION_RULES: Record<SupportedJurisdiction, JurisdictionRules>;
export declare const DEFAULT_VAT_RATE = 0.16;
export declare const DEFAULT_JURISDICTION: SupportedJurisdiction;
export declare const VAT_CALCULATION_PRECISION = 2;
export declare const EXCISE_CALCULATION_PRECISION = 2;
export declare const MIN_TAX_RATE = 0;
export declare const MAX_TAX_RATE = 1;
export declare const MIN_AMOUNT = 0.01;
export declare const MAX_AMOUNT = 999999999.99;
export declare const KRA_PIN_PATTERNS: {
    INDIVIDUAL: RegExp;
    COMPANY: RegExp;
    FULL_FORMAT: RegExp;
};
export declare const CATEGORY_KEYWORDS: Record<string, TaxCategory>;
export declare const ERROR_MESSAGES: {
    readonly INVALID_JURISDICTION: "Invalid or unsupported jurisdiction";
    readonly INVALID_TAX_RATE: "Tax rate must be between 0 and 1";
    readonly INVALID_AMOUNT: "Amount must be positive";
    readonly INVALID_KRA_PIN: "Invalid KRA PIN format";
    readonly MISSING_REQUIRED_FIELD: "Required field is missing";
    readonly CALCULATION_ERROR: "Error in tax calculation";
    readonly COMPLIANCE_VIOLATION: "Tax compliance violation detected";
};
//# sourceMappingURL=constants.d.ts.map