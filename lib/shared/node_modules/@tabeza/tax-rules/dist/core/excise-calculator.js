"use strict";
/**
 * TABEZA Tax Rules Engine - Excise Tax Calculator
 * Pure excise tax calculation functions for applicable items
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateExciseTax = calculateExciseTax;
exports.calculateExciseTaxForItems = calculateExciseTaxForItems;
exports.getExciseInfoForItem = getExciseInfoForItem;
exports.isSubjectToExciseTax = isSubjectToExciseTax;
exports.getExciseTaxRates = getExciseTaxRates;
exports.calculateTotalExciseTax = calculateTotalExciseTax;
exports.validateExciseTaxCalculation = validateExciseTaxCalculation;
exports.getExciseTaxCategories = getExciseTaxCategories;
exports.calculateExciseImpact = calculateExciseImpact;
const constants_1 = require("../constants");
const types_1 = require("../types");
/**
 * Calculate excise tax for a single amount
 */
function calculateExciseTax(params) {
    const { amount, rate, rateType, category } = params;
    // Validation
    if (amount < constants_1.MIN_AMOUNT) {
        throw new types_1.TaxCalculationError(`Amount must be at least ${constants_1.MIN_AMOUNT}`, 'INVALID_AMOUNT', { amount, minimum: constants_1.MIN_AMOUNT });
    }
    if (rate < 0) {
        throw new types_1.TaxCalculationError('Excise rate cannot be negative', 'INVALID_EXCISE_RATE', { rate });
    }
    let exciseAmount;
    if (rateType === 'PERCENTAGE') {
        // Percentage-based excise tax
        exciseAmount = amount * rate;
    }
    else {
        // Fixed amount excise tax (per unit/kg/litre)
        // For simplicity, assume amount represents quantity
        exciseAmount = rate;
    }
    // Round to specified precision
    exciseAmount = Math.round(exciseAmount * Math.pow(10, constants_1.EXCISE_CALCULATION_PRECISION)) / Math.pow(10, constants_1.EXCISE_CALCULATION_PRECISION);
    return {
        baseAmount: amount,
        exciseAmount,
        rate,
        rateType,
        category
    };
}
/**
 * Calculate excise tax for multiple items
 */
function calculateExciseTaxForItems(items, jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        throw new types_1.TaxCalculationError(`Unsupported jurisdiction: ${jurisdiction}`, 'UNSUPPORTED_JURISDICTION', { jurisdiction });
    }
    return items.map(item => {
        const exciseInfo = getExciseInfoForItem(item, jurisdiction);
        if (!exciseInfo) {
            return { item, excise: null };
        }
        // Calculate total amount for this item
        const itemTotal = item.amount * item.quantity;
        // Calculate excise tax
        const excise = calculateExciseTax({
            amount: exciseInfo.rateType === 'FIXED_AMOUNT' ? item.quantity : itemTotal,
            rate: exciseInfo.rate,
            rateType: exciseInfo.rateType,
            category: item.category
        });
        return { item, excise };
    });
}
/**
 * Get excise tax information for a specific item
 */
function getExciseInfoForItem(item, jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        throw new types_1.TaxCalculationError(`Unsupported jurisdiction: ${jurisdiction}`, 'UNSUPPORTED_JURISDICTION', { jurisdiction });
    }
    // Use explicit excise rate if provided
    if (item.exciseRate !== undefined && item.exciseRateType) {
        return {
            rate: item.exciseRate,
            rateType: item.exciseRateType
        };
    }
    // Find excise rate for category
    const categoryRate = rules.taxRates.find(rate => rate.category === item.category &&
        rate.exciseRate !== undefined &&
        rate.exciseRateType !== undefined);
    if (categoryRate && categoryRate.exciseRate !== undefined && categoryRate.exciseRateType) {
        return {
            rate: categoryRate.exciseRate,
            rateType: categoryRate.exciseRateType
        };
    }
    // No excise tax applicable
    return null;
}
/**
 * Check if an item is subject to excise tax
 */
function isSubjectToExciseTax(item, jurisdiction) {
    return getExciseInfoForItem(item, jurisdiction) !== null;
}
/**
 * Get all excise tax rates for a jurisdiction
 */
function getExciseTaxRates(jurisdiction) {
    const rules = constants_1.JURISDICTION_RULES[jurisdiction];
    if (!rules) {
        throw new types_1.TaxCalculationError(`Unsupported jurisdiction: ${jurisdiction}`, 'UNSUPPORTED_JURISDICTION', { jurisdiction });
    }
    return rules.taxRates
        .filter(rate => rate.exciseRate !== undefined && rate.exciseRateType)
        .map(rate => ({
        category: rate.category,
        rate: rate.exciseRate,
        rateType: rate.exciseRateType,
        description: rate.description
    }));
}
/**
 * Calculate total excise tax for multiple calculations
 */
function calculateTotalExciseTax(exciseCalculations) {
    return exciseCalculations
        .filter((calc) => calc !== null)
        .reduce((total, calc) => total + calc.exciseAmount, 0);
}
/**
 * Validate excise tax calculation
 */
function validateExciseTaxCalculation(baseAmount, exciseAmount, rate, rateType) {
    const errors = [];
    try {
        const calculated = calculateExciseTax({
            amount: baseAmount,
            rate,
            rateType,
            category: 'VALIDATION' // Placeholder category for validation
        });
        const tolerance = 0.01; // 1 cent tolerance for rounding
        if (Math.abs(calculated.exciseAmount - exciseAmount) > tolerance) {
            errors.push(`Excise amount mismatch: expected ${calculated.exciseAmount}, got ${exciseAmount}`);
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
 * Get excise tax categories for a jurisdiction
 */
function getExciseTaxCategories(jurisdiction) {
    const rates = getExciseTaxRates(jurisdiction);
    return [...new Set(rates.map(rate => rate.category))];
}
/**
 * Calculate excise tax impact on final price
 */
function calculateExciseImpact(basePrice, exciseRate, exciseRateType, vatRate = 0) {
    // Calculate excise tax
    const excise = calculateExciseTax({
        amount: basePrice,
        rate: exciseRate,
        rateType: exciseRateType,
        category: 'CALCULATION'
    });
    const priceAfterExcise = basePrice + excise.exciseAmount;
    // VAT is typically calculated on price including excise
    const vatOnTotal = priceAfterExcise * vatRate;
    const finalPrice = priceAfterExcise + vatOnTotal;
    return {
        basePrice,
        exciseAmount: excise.exciseAmount,
        priceAfterExcise,
        vatOnTotal,
        finalPrice
    };
}
//# sourceMappingURL=excise-calculator.js.map