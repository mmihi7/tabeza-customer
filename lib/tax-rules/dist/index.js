"use strict";
/**
 * TABEZA Tax Rules Engine
 * Pure tax calculation logic extracted for serverless compatibility
 *
 * This package contains only pure functions with no OS dependencies,
 * making it suitable for both cloud (Vercel) and agent (Windows) systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESCRIPTION = exports.PACKAGE_NAME = exports.VERSION = exports.ERROR_MESSAGES = exports.CATEGORY_KEYWORDS = exports.KRA_PIN_PATTERNS = exports.MAX_AMOUNT = exports.MIN_AMOUNT = exports.MAX_TAX_RATE = exports.MIN_TAX_RATE = exports.EXCISE_CALCULATION_PRECISION = exports.VAT_CALCULATION_PRECISION = exports.DEFAULT_JURISDICTION = exports.DEFAULT_VAT_RATE = exports.RWANDA_TAX_RULES = exports.TANZANIA_TAX_RULES = exports.UGANDA_TAX_RULES = exports.KENYA_TAX_RULES = exports.JURISDICTION_RULES = exports.TAX_CATEGORIES = exports.SUPPORTED_JURISDICTIONS = exports.UnsupportedJurisdictionError = exports.ComplianceValidationError = exports.TaxCalculationError = exports.validateKRAPinWithBusinessRules = exports.getKRAPinValidationRules = exports.formatKRAPinForDisplay = exports.isTestKRAPin = exports.validateMultipleKRAPins = exports.generateSampleKRAPin = exports.extractKRAPinInfo = exports.validateKRAPin = exports.calculateExciseImpact = exports.getExciseTaxCategories = exports.validateExciseTaxCalculation = exports.calculateTotalExciseTax = exports.getExciseTaxRates = exports.isSubjectToExciseTax = exports.getExciseInfoForItem = exports.calculateExciseTaxForItems = exports.calculateExciseTax = exports.getApplicableVATRates = exports.isVATExempt = exports.calculateEffectiveVATRate = exports.validateVATCalculation = exports.getVATRateForItem = exports.calculateVATForItems = exports.calculateVAT = exports.TaxRuleEngine = void 0;
exports.quickVATCalculation = quickVATCalculation;
exports.quickComplianceCheck = quickComplianceCheck;
exports.getJurisdictionTaxInfo = getJurisdictionTaxInfo;
exports.validateAndCalculateTaxes = validateAndCalculateTaxes;
exports.getPackageInfo = getPackageInfo;
const constants_1 = require("./constants");
const tax_rule_engine_1 = require("./core/tax-rule-engine");
const vat_calculator_1 = require("./core/vat-calculator");
const excise_calculator_1 = require("./core/excise-calculator");
// ============================================================================
// CORE EXPORTS
// ============================================================================
// Main tax rule engine
var tax_rule_engine_2 = require("./core/tax-rule-engine");
Object.defineProperty(exports, "TaxRuleEngine", { enumerable: true, get: function () { return tax_rule_engine_2.TaxRuleEngine; } });
// Individual calculators
var vat_calculator_2 = require("./core/vat-calculator");
Object.defineProperty(exports, "calculateVAT", { enumerable: true, get: function () { return vat_calculator_2.calculateVAT; } });
Object.defineProperty(exports, "calculateVATForItems", { enumerable: true, get: function () { return vat_calculator_2.calculateVATForItems; } });
Object.defineProperty(exports, "getVATRateForItem", { enumerable: true, get: function () { return vat_calculator_2.getVATRateForItem; } });
Object.defineProperty(exports, "validateVATCalculation", { enumerable: true, get: function () { return vat_calculator_2.validateVATCalculation; } });
Object.defineProperty(exports, "calculateEffectiveVATRate", { enumerable: true, get: function () { return vat_calculator_2.calculateEffectiveVATRate; } });
Object.defineProperty(exports, "isVATExempt", { enumerable: true, get: function () { return vat_calculator_2.isVATExempt; } });
Object.defineProperty(exports, "getApplicableVATRates", { enumerable: true, get: function () { return vat_calculator_2.getApplicableVATRates; } });
var excise_calculator_2 = require("./core/excise-calculator");
Object.defineProperty(exports, "calculateExciseTax", { enumerable: true, get: function () { return excise_calculator_2.calculateExciseTax; } });
Object.defineProperty(exports, "calculateExciseTaxForItems", { enumerable: true, get: function () { return excise_calculator_2.calculateExciseTaxForItems; } });
Object.defineProperty(exports, "getExciseInfoForItem", { enumerable: true, get: function () { return excise_calculator_2.getExciseInfoForItem; } });
Object.defineProperty(exports, "isSubjectToExciseTax", { enumerable: true, get: function () { return excise_calculator_2.isSubjectToExciseTax; } });
Object.defineProperty(exports, "getExciseTaxRates", { enumerable: true, get: function () { return excise_calculator_2.getExciseTaxRates; } });
Object.defineProperty(exports, "calculateTotalExciseTax", { enumerable: true, get: function () { return excise_calculator_2.calculateTotalExciseTax; } });
Object.defineProperty(exports, "validateExciseTaxCalculation", { enumerable: true, get: function () { return excise_calculator_2.validateExciseTaxCalculation; } });
Object.defineProperty(exports, "getExciseTaxCategories", { enumerable: true, get: function () { return excise_calculator_2.getExciseTaxCategories; } });
Object.defineProperty(exports, "calculateExciseImpact", { enumerable: true, get: function () { return excise_calculator_2.calculateExciseImpact; } });
var kra_pin_validator_1 = require("./core/kra-pin-validator");
Object.defineProperty(exports, "validateKRAPin", { enumerable: true, get: function () { return kra_pin_validator_1.validateKRAPin; } });
Object.defineProperty(exports, "extractKRAPinInfo", { enumerable: true, get: function () { return kra_pin_validator_1.extractKRAPinInfo; } });
Object.defineProperty(exports, "generateSampleKRAPin", { enumerable: true, get: function () { return kra_pin_validator_1.generateSampleKRAPin; } });
Object.defineProperty(exports, "validateMultipleKRAPins", { enumerable: true, get: function () { return kra_pin_validator_1.validateMultipleKRAPins; } });
Object.defineProperty(exports, "isTestKRAPin", { enumerable: true, get: function () { return kra_pin_validator_1.isTestKRAPin; } });
Object.defineProperty(exports, "formatKRAPinForDisplay", { enumerable: true, get: function () { return kra_pin_validator_1.formatKRAPinForDisplay; } });
Object.defineProperty(exports, "getKRAPinValidationRules", { enumerable: true, get: function () { return kra_pin_validator_1.getKRAPinValidationRules; } });
Object.defineProperty(exports, "validateKRAPinWithBusinessRules", { enumerable: true, get: function () { return kra_pin_validator_1.validateKRAPinWithBusinessRules; } });
// Error types
var types_1 = require("./types");
Object.defineProperty(exports, "TaxCalculationError", { enumerable: true, get: function () { return types_1.TaxCalculationError; } });
Object.defineProperty(exports, "ComplianceValidationError", { enumerable: true, get: function () { return types_1.ComplianceValidationError; } });
Object.defineProperty(exports, "UnsupportedJurisdictionError", { enumerable: true, get: function () { return types_1.UnsupportedJurisdictionError; } });
// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
var constants_2 = require("./constants");
// Supported jurisdictions
Object.defineProperty(exports, "SUPPORTED_JURISDICTIONS", { enumerable: true, get: function () { return constants_2.SUPPORTED_JURISDICTIONS; } });
// Tax categories
Object.defineProperty(exports, "TAX_CATEGORIES", { enumerable: true, get: function () { return constants_2.TAX_CATEGORIES; } });
// Jurisdiction rules
Object.defineProperty(exports, "JURISDICTION_RULES", { enumerable: true, get: function () { return constants_2.JURISDICTION_RULES; } });
Object.defineProperty(exports, "KENYA_TAX_RULES", { enumerable: true, get: function () { return constants_2.KENYA_TAX_RULES; } });
Object.defineProperty(exports, "UGANDA_TAX_RULES", { enumerable: true, get: function () { return constants_2.UGANDA_TAX_RULES; } });
Object.defineProperty(exports, "TANZANIA_TAX_RULES", { enumerable: true, get: function () { return constants_2.TANZANIA_TAX_RULES; } });
Object.defineProperty(exports, "RWANDA_TAX_RULES", { enumerable: true, get: function () { return constants_2.RWANDA_TAX_RULES; } });
// Default values
Object.defineProperty(exports, "DEFAULT_VAT_RATE", { enumerable: true, get: function () { return constants_2.DEFAULT_VAT_RATE; } });
Object.defineProperty(exports, "DEFAULT_JURISDICTION", { enumerable: true, get: function () { return constants_2.DEFAULT_JURISDICTION; } });
Object.defineProperty(exports, "VAT_CALCULATION_PRECISION", { enumerable: true, get: function () { return constants_2.VAT_CALCULATION_PRECISION; } });
Object.defineProperty(exports, "EXCISE_CALCULATION_PRECISION", { enumerable: true, get: function () { return constants_2.EXCISE_CALCULATION_PRECISION; } });
// Validation constants
Object.defineProperty(exports, "MIN_TAX_RATE", { enumerable: true, get: function () { return constants_2.MIN_TAX_RATE; } });
Object.defineProperty(exports, "MAX_TAX_RATE", { enumerable: true, get: function () { return constants_2.MAX_TAX_RATE; } });
Object.defineProperty(exports, "MIN_AMOUNT", { enumerable: true, get: function () { return constants_2.MIN_AMOUNT; } });
Object.defineProperty(exports, "MAX_AMOUNT", { enumerable: true, get: function () { return constants_2.MAX_AMOUNT; } });
// KRA PIN patterns
Object.defineProperty(exports, "KRA_PIN_PATTERNS", { enumerable: true, get: function () { return constants_2.KRA_PIN_PATTERNS; } });
// Category mappings
Object.defineProperty(exports, "CATEGORY_KEYWORDS", { enumerable: true, get: function () { return constants_2.CATEGORY_KEYWORDS; } });
// Error messages
Object.defineProperty(exports, "ERROR_MESSAGES", { enumerable: true, get: function () { return constants_2.ERROR_MESSAGES; } });
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Quick VAT calculation for a single amount
 */
function quickVATCalculation(amount, jurisdiction = 'KE', inclusive = false) {
    const engine = new tax_rule_engine_1.TaxRuleEngine(jurisdiction);
    const rules = engine.getJurisdictionInfo();
    return (0, vat_calculator_1.calculateVAT)({
        amount,
        rate: rules.standardVATRate,
        inclusive
    });
}
/**
 * Quick compliance check for a receipt
 */
function quickComplianceCheck(receipt, jurisdiction = 'KE') {
    const engine = new tax_rule_engine_1.TaxRuleEngine(jurisdiction);
    return engine.validateReceipt({ receipt, jurisdiction });
}
/**
 * Get tax information for a jurisdiction
 */
function getJurisdictionTaxInfo(jurisdiction) {
    const engine = new tax_rule_engine_1.TaxRuleEngine(jurisdiction);
    const info = engine.getJurisdictionInfo();
    const vatRates = (0, vat_calculator_1.getApplicableVATRates)(jurisdiction);
    const exciseRates = (0, excise_calculator_1.getExciseTaxRates)(jurisdiction);
    return {
        ...info,
        vatRates,
        exciseRates,
        complianceFeatures: info.supportedFeatures
    };
}
/**
 * Validate and calculate taxes for items in one call
 */
function validateAndCalculateTaxes(items, jurisdiction = 'KE', merchantKRAPin) {
    const engine = new tax_rule_engine_1.TaxRuleEngine(jurisdiction);
    // Calculate taxes
    const calculation = engine.calculateTaxes({
        items,
        jurisdiction,
        merchantKRAPin
    });
    // Create receipt format for validation
    const receipt = {
        merchant: {
            kraPin: merchantKRAPin,
            name: 'Validation Merchant'
        },
        items: items.map(item => ({
            name: item.name,
            amount: item.amount * item.quantity,
            category: item.category,
            vatRate: item.vatRate
        })),
        totals: {
            subtotal: calculation.totals.subtotal,
            tax: calculation.totals.totalVAT + calculation.totals.totalExcise,
            total: calculation.totals.grandTotal
        }
    };
    // Validate compliance
    const validation = engine.validateReceipt({ receipt, jurisdiction });
    return { calculation, validation };
}
// ============================================================================
// VERSION & METADATA
// ============================================================================
exports.VERSION = '1.0.0';
exports.PACKAGE_NAME = '@tabeza/tax-rules';
exports.DESCRIPTION = 'Pure tax calculation logic - serverless compatible';
/**
 * Get package information
 */
function getPackageInfo() {
    return {
        name: exports.PACKAGE_NAME,
        version: exports.VERSION,
        description: exports.DESCRIPTION,
        features: [
            'VAT calculation for multiple jurisdictions',
            'Excise tax calculation',
            'KRA PIN validation (Kenya)',
            'Tax compliance validation',
            'Pure functions - no OS dependencies',
            'Serverless compatible',
            'Property-based testing support'
        ],
        supportedJurisdictions: constants_1.SUPPORTED_JURISDICTIONS,
        architecture: 'Pure logic extraction for cloud/agent separation'
    };
}
//# sourceMappingURL=index.js.map