"use strict";
/**
 * TABEZA Tax Rules Engine - Main Tax Rule Engine
 * Orchestrates all tax calculations and compliance validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxRuleEngine = void 0;
const constants_1 = require("../constants");
const types_1 = require("../types");
const vat_calculator_1 = require("./vat-calculator");
const excise_calculator_1 = require("./excise-calculator");
const kra_pin_validator_1 = require("./kra-pin-validator");
/**
 * Main Tax Rule Engine class
 */
class TaxRuleEngine {
    constructor(jurisdiction) {
        if (!constants_1.JURISDICTION_RULES[jurisdiction]) {
            throw new types_1.UnsupportedJurisdictionError(jurisdiction);
        }
        this.jurisdiction = jurisdiction;
        this.rules = constants_1.JURISDICTION_RULES[jurisdiction];
    }
    /**
     * Calculate taxes for multiple items
     */
    calculateTaxes(params) {
        const { items, merchantKRAPin, calculationDate } = params;
        if (!items || items.length === 0) {
            throw new types_1.TaxCalculationError('At least one item is required for tax calculation', 'NO_ITEMS', { items });
        }
        // Validate merchant KRA PIN if provided (Kenya only)
        if (this.jurisdiction === 'KE' && merchantKRAPin) {
            const pinValidation = (0, kra_pin_validator_1.validateKRAPin)(merchantKRAPin);
            if (!pinValidation.valid) {
                throw new types_1.TaxCalculationError(`Invalid KRA PIN: ${pinValidation.errors.join(', ')}`, 'INVALID_KRA_PIN', { pin: merchantKRAPin, errors: pinValidation.errors });
            }
        }
        // Calculate VAT for all items
        const vatCalculations = (0, vat_calculator_1.calculateVATForItems)(items, this.jurisdiction);
        // Calculate excise tax for applicable items
        const exciseCalculations = (0, excise_calculator_1.calculateExciseTaxForItems)(items, this.jurisdiction);
        // Combine calculations
        const combinedCalculations = vatCalculations.map((vatCalc, index) => ({
            item: vatCalc.item,
            vat: vatCalc.vat,
            excise: exciseCalculations[index]?.excise || undefined
        }));
        // Calculate totals
        const totals = this.calculateTotals(combinedCalculations);
        return {
            items: combinedCalculations,
            totals,
            jurisdiction: this.jurisdiction,
            calculatedAt: calculationDate || new Date().toISOString()
        };
    }
    /**
     * Calculate totals from individual item calculations
     */
    calculateTotals(calculations) {
        let subtotal = 0;
        let totalVAT = 0;
        let totalExcise = 0;
        calculations.forEach(calc => {
            subtotal += calc.vat.subtotal;
            totalVAT += calc.vat.vatAmount;
            if (calc.excise) {
                totalExcise += calc.excise.exciseAmount;
            }
        });
        const grandTotal = subtotal + totalVAT + totalExcise;
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            totalVAT: Math.round(totalVAT * 100) / 100,
            totalExcise: Math.round(totalExcise * 100) / 100,
            grandTotal: Math.round(grandTotal * 100) / 100
        };
    }
    /**
     * Get applicable tax rates for a category
     */
    getApplicableRates(category) {
        // Check if category is zero-rated
        if (this.rules.zeroRatedCategories.includes(category)) {
            return {
                vatRate: 0.00,
                description: 'Zero-rated category'
            };
        }
        // Check if category is exempt
        if (this.rules.exemptCategories.includes(category)) {
            return {
                vatRate: 0.00,
                description: 'VAT exempt category'
            };
        }
        // Find specific rates for category
        const categoryRate = this.rules.taxRates.find((rate) => rate.category === category);
        if (categoryRate) {
            return {
                vatRate: categoryRate.vatRate,
                exciseRate: categoryRate.exciseRate,
                exciseRateType: categoryRate.exciseRateType,
                description: categoryRate.description
            };
        }
        // Default to standard VAT rate
        return {
            vatRate: this.rules.standardVATRate,
            description: 'Standard VAT rate'
        };
    }
    /**
     * Validate receipt tax calculations
     */
    validateReceipt(params) {
        const { receipt, strictMode = false } = params;
        const issues = [];
        const warnings = [];
        let score = 100;
        // Validate merchant KRA PIN (Kenya only)
        if (this.jurisdiction === 'KE') {
            if (!receipt.merchant.kraPin) {
                if (strictMode) {
                    issues.push('KRA PIN is required for registered businesses in Kenya');
                    score -= 20;
                }
                else {
                    warnings.push('KRA PIN is recommended for tax compliance');
                    score -= 5;
                }
            }
            else {
                const pinValidation = (0, kra_pin_validator_1.validateKRAPin)(receipt.merchant.kraPin);
                if (!pinValidation.valid) {
                    issues.push(`Invalid KRA PIN format: ${pinValidation.errors.join(', ')}`);
                    score -= 15;
                }
            }
        }
        // Validate tax calculations
        const calculationValidation = this.validateTaxCalculations(receipt);
        issues.push(...calculationValidation.errors);
        warnings.push(...calculationValidation.warnings);
        score -= calculationValidation.scoreDeduction;
        // Apply compliance rules
        const complianceValidation = this.applyComplianceRules(receipt);
        issues.push(...complianceValidation.errors);
        warnings.push(...complianceValidation.warnings);
        score -= complianceValidation.scoreDeduction;
        return {
            isCompliant: issues.length === 0,
            jurisdiction: this.jurisdiction,
            issues,
            warnings,
            score: Math.max(0, score),
            validatedAt: new Date().toISOString()
        };
    }
    /**
     * Validate tax calculations in receipt
     */
    validateTaxCalculations(receipt) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        // Basic math validation
        const tolerance = 0.01; // 1 cent tolerance
        const expectedTotal = receipt.totals.subtotal + receipt.totals.tax;
        if (Math.abs(expectedTotal - receipt.totals.total) > tolerance) {
            errors.push(`Total calculation error: ${receipt.totals.subtotal} + ${receipt.totals.tax} ≠ ${receipt.totals.total}`);
            scoreDeduction += 25;
        }
        // Validate tax rates for items
        if (receipt.items && receipt.items.length > 0) {
            receipt.items.forEach((item, index) => {
                if (item.category) {
                    const expectedRates = this.getApplicableRates(item.category);
                    // Check if VAT rate seems reasonable
                    if (item.vatRate !== undefined) {
                        const rateDifference = Math.abs(item.vatRate - expectedRates.vatRate);
                        if (rateDifference > 0.01) {
                            warnings.push(`Item ${index + 1} (${item.name}): VAT rate ${item.vatRate} differs from expected ${expectedRates.vatRate} for category ${item.category}`);
                            scoreDeduction += 2;
                        }
                    }
                }
            });
        }
        return { errors, warnings, scoreDeduction };
    }
    /**
     * Apply jurisdiction-specific compliance rules
     */
    applyComplianceRules(receipt) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        this.rules.complianceRules.forEach((rule) => {
            switch (rule.rule) {
                case 'KRA_PIN_REQUIRED':
                    if (!receipt.merchant.kraPin) {
                        if (rule.severity === 'ERROR') {
                            errors.push(rule.description);
                            scoreDeduction += 15;
                        }
                        else if (rule.severity === 'WARNING') {
                            warnings.push(rule.description);
                            scoreDeduction += 5;
                        }
                    }
                    break;
                case 'VAT_CALCULATION_ACCURACY':
                    // Already handled in validateTaxCalculations
                    break;
                case 'EXCISE_TAX_DECLARATION':
                    // Check if items that should have excise tax are properly declared
                    if (receipt.items) {
                        receipt.items.forEach((item) => {
                            const rates = this.getApplicableRates(item.category || 'OTHER');
                            if (rates.exciseRate && !item.exciseAmount) {
                                warnings.push(`Item ${item.name} may be subject to excise tax`);
                                scoreDeduction += 3;
                            }
                        });
                    }
                    break;
                case 'RECEIPT_NUMBERING':
                    if (!receipt.receiptNumber && !receipt.reference) {
                        warnings.push(rule.description);
                        scoreDeduction += 2;
                    }
                    break;
                default:
                    // Generic rule handling
                    if (rule.severity === 'INFO') {
                        warnings.push(rule.description);
                    }
                    break;
            }
        });
        return { errors, warnings, scoreDeduction };
    }
    /**
     * Get jurisdiction information
     */
    getJurisdictionInfo() {
        return {
            jurisdiction: this.jurisdiction,
            currency: this.rules.currency,
            standardVATRate: this.rules.standardVATRate,
            supportedFeatures: [
                'VAT calculation',
                'Tax compliance validation',
                ...(this.rules.taxRates.some((rate) => rate.exciseRate) ? ['Excise tax calculation'] : []),
                ...(this.jurisdiction === 'KE' ? ['KRA PIN validation'] : [])
            ]
        };
    }
    /**
     * Update jurisdiction (creates new engine instance)
     */
    static createForJurisdiction(jurisdiction) {
        return new TaxRuleEngine(jurisdiction);
    }
}
exports.TaxRuleEngine = TaxRuleEngine;
//# sourceMappingURL=tax-rule-engine.js.map