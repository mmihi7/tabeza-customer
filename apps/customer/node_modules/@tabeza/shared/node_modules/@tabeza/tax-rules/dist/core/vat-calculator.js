"use strict";
/**
 * TABEZA Tax Rules Engine - VAT Calculator
 * Pure VAT calculation functions with no OS dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVAT = calculateVAT;
exports.calculateVATForItems = calculateVATForItems;
exports.getVATRateForItem = getVATRateForItem;
exports.validateVATCalculation = validateVATCalculation;
exports.calculateEffectiveVATRate = calculateEffectiveVATRate;
exports.isVATExempt = isVATExempt;
exports.getApplicableVATRates = getApplicableVATRates;
const constants_1 = require("../constants");
const types_1 = require("../types");
/**
 * Calculate VAT for a single amount
 */
function calculateVAT(params) {
    const { amount, rate, inclusive = false, category } = params;
    // Validation
    if (amount < constants_1.MIN_AMOUNT) {
        throw new types_1.TaxCalculationError(`Amount must be at least ${constants_1.MIN_AMOUNT}`, 'INVALID_AMOUNT', { amount, minimum: constants_1.MIN_AMOUNT });
    }
    if (rate < constants_1.MIN_TAX_RATE || rate > constants_1.MAX_TAX_RATE) {
        throw new types_1.TaxCalculationError(`VAT rate must be between ${constants_1.MIN_TAX_RATE} and ${constants_1.MAX_TAX_RATE}`, 'INVALID_VAT_RATE', { rate, minimum: constants_1.MIN_TAX_RATE, maximum: constants_1.MAX_TAX_RATE });
    }
    let subtotal;
    let vatAmount;
    let total;
    if (inclusive) {
        // Amount includes VAT - extract it
        total = amount;
        subtotal = amount / (1 + rate);
        vatAmount = amount - subtotal;
    }
    else {
        // Amount excludes VAT - add it
        subtotal = amount;
        vatAmount = amount * rate;
        total = amount + vatAmount;
    }
    // Round to specified precision
    subtotal = Math.round(subtotal * Math.pow(10, constants_1.VAT_CALCULATION_PRECISION)) / Math.pow(10, constants_1.VAT_CALCULATION_PRECISION);
    vatAmount = Math.round(vatAmount * Math.pow(10, constants_1.VAT_CALCULATION_PRECISION)) / Math.pow(10, constants_1.VAT_CALCULATION_PRECISION);
    total = Math.round(total * Math.pow(10, constants_1.VAT_CALCULATION_PRECISION)) / Math.pow(10, constants_1.VAT_CALCULATION_PRECISION);
    return {
        subtotal,
        vatAmount,
        total,
        rate,
        inclusive,
        category
    };
}
/**
 * Calculate VAT for multiple items
 */
function calculateVATForItems(items, jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        throw new types_1.TaxCalculationError(`Unsupported jurisdiction: ${jurisdiction}`, 'UNSUPPORTED_JURISDICTION', { jurisdiction });
    }
    return items.map(item => {
        // Determine VAT rate for this item
        const vatRate = getVATRateForItem(item, jurisdiction);
        // Calculate total amount for this item
        const itemTotal = item.amount * item.quantity;
        // Calculate VAT
        const vat = calculateVAT({
            amount: itemTotal,
            rate: vatRate,
            inclusive: false, // Assume amounts are exclusive unless specified
            category: item.category
        });
        return { item, vat };
    });
}
/**
 * Get VAT rate for a specific item based on jurisdiction rules
 */
function getVATRateForItem(item, jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        throw new types_1.TaxCalculationError(`Unsupported jurisdiction: ${jurisdiction}`, 'UNSUPPORTED_JURISDICTION', { jurisdiction });
    }
    // Use explicit VAT rate if provided
    if (item.vatRate !== undefined) {
        return item.vatRate;
    }
    // Check if category is zero-rated
    if (rules.zeroRatedCategories.includes(item.category)) {
        return 0.00;
    }
    // Check if category is exempt (treated as zero-rated for calculation)
    if (rules.exemptCategories.includes(item.category)) {
        return 0.00;
    }
    // Find specific rate for category
    const categoryRate = rules.taxRates.find(rate => rate.category === item.category);
    if (categoryRate) {
        return categoryRate.vatRate;
    }
    // Default to standard VAT rate
    return rules.standardVATRate;
}
/**
 * Validate VAT calculation accuracy
 */
function validateVATCalculation(subtotal, vatAmount, total, rate, inclusive = false) {
    const errors = [];
    // Recalculate to check accuracy
    try {
        const calculated = calculateVAT({
            amount: inclusive ? total : subtotal,
            rate,
            inclusive
        });
        const tolerance = 0.01; // 1 cent tolerance for rounding
        if (Math.abs(calculated.subtotal - subtotal) > tolerance) {
            errors.push(`Subtotal mismatch: expected ${calculated.subtotal}, got ${subtotal}`);
        }
        if (Math.abs(calculated.vatAmount - vatAmount) > tolerance) {
            errors.push(`VAT amount mismatch: expected ${calculated.vatAmount}, got ${vatAmount}`);
        }
        if (Math.abs(calculated.total - total) > tolerance) {
            errors.push(`Total mismatch: expected ${calculated.total}, got ${total}`);
        }
    }
    catch (error) {
        errors.push(`Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Calculate effective VAT rate from amounts
 */
function calculateEffectiveVATRate(subtotal, vatAmount) {
    if (subtotal <= 0) {
        return 0;
    }
    const rate = vatAmount / subtotal;
    return Math.round(rate * Math.pow(10, constants_1.VAT_CALCULATION_PRECISION + 2)) / Math.pow(10, constants_1.VAT_CALCULATION_PRECISION + 2);
}
/**
 * Check if an item category is VAT exempt in a jurisdiction
 */
function isVATExempt(category, jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        return false;
    }
    return rules.exemptCategories.includes(category) ||
        rules.zeroRatedCategories.includes(category);
}
/**
 * Get all applicable VAT rates for a jurisdiction
 */
function getApplicableVATRates(jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        throw new types_1.TaxCalculationError(`Unsupported jurisdiction: ${jurisdiction}`, 'UNSUPPORTED_JURISDICTION', { jurisdiction });
    }
    const rates = [];
    // Add standard rate
    rates.push({
        category: 'STANDARD',
        rate: rules.standardVATRate,
        description: 'Standard VAT rate'
    });
    // Add zero-rated categories
    rules.zeroRatedCategories.forEach(category => {
        rates.push({
            category,
            rate: 0.00,
            description: 'Zero-rated category'
        });
    });
    // Add exempt categories
    rules.exemptCategories.forEach(category => {
        rates.push({
            category,
            rate: 0.00,
            description: 'VAT exempt category'
        });
    });
    // Add specific category rates
    rules.taxRates.forEach(taxRate => {
        rates.push({
            category: taxRate.category,
            rate: taxRate.vatRate,
            description: taxRate.description
        });
    });
    return rates;
}
//# sourceMappingURL=vat-calculator.js.map