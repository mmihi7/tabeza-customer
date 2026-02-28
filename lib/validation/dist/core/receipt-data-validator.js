"use strict";
/**
 * TABEZA Validation Library - Receipt Data Validator
 * Validates receipt data structure and format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptDataValidator = void 0;
const constants_1 = require("../constants");
const types_1 = require("../types");
/**
 * Receipt Data Validator Class
 * Handles validation of receipt data structure, format, and calculations
 */
class ReceiptDataValidator {
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_VALIDATION_CONFIG, ...config };
    }
    /**
     * Validate complete receipt data
     */
    validate(receipt) {
        const results = {
            valid: true,
            score: 100,
            structureValidation: this.validateStructure(receipt),
            businessRuleValidation: { valid: true, score: 100, rules: [], summary: { totalRules: 0, passedRules: 0, failedRules: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 }, validatedAt: new Date().toISOString() },
            calculationValidation: this.validateCalculations(receipt),
            crossSystemValidation: { cloudCompatible: true, agentCompatible: true, consistencyScore: 100, issues: [], validatedAt: new Date().toISOString() },
            summary: {
                totalChecks: 3,
                passedChecks: 0,
                failedChecks: 0,
                overallScore: 100
            },
            validatedAt: new Date().toISOString()
        };
        // Calculate overall score and validity
        const scores = [
            results.structureValidation.score,
            results.calculationValidation.score
        ];
        results.score = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        results.valid = results.structureValidation.valid && results.calculationValidation.valid;
        // Update summary
        results.summary.passedChecks = [
            results.structureValidation.valid,
            results.calculationValidation.valid,
            results.crossSystemValidation.cloudCompatible && results.crossSystemValidation.agentCompatible
        ].filter(Boolean).length;
        results.summary.failedChecks = results.summary.totalChecks - results.summary.passedChecks;
        results.summary.overallScore = results.score;
        return results;
    }
    /**
     * Validate receipt structure
     */
    validateStructure(receipt) {
        const errors = [];
        const warnings = [];
        let score = 100;
        try {
            // Basic structure validation
            if (!receipt) {
                errors.push('Receipt data is required');
                return {
                    valid: false,
                    score: 0,
                    errors,
                    warnings,
                    validatedAt: new Date().toISOString()
                };
            }
            // Session validation
            if (!receipt.session) {
                errors.push('Receipt session is required');
                score -= 25;
            }
            else {
                const sessionValidation = this.validateSessionStructure(receipt.session);
                errors.push(...sessionValidation.errors);
                warnings.push(...sessionValidation.warnings);
                score -= sessionValidation.scoreDeduction;
            }
            // Events validation
            if (!receipt.events || !Array.isArray(receipt.events)) {
                errors.push('Receipt events array is required');
                score -= 25;
            }
            else if (receipt.events.length === 0) {
                errors.push('Receipt must have at least one event');
                score -= 20;
            }
            else {
                const eventsValidation = this.validateEventsStructure(receipt.events);
                errors.push(...eventsValidation.errors);
                warnings.push(...eventsValidation.warnings);
                score -= eventsValidation.scoreDeduction;
            }
            // Totals validation (if present)
            if (receipt.totals) {
                const totalsValidation = this.validateTotalsStructure(receipt.totals);
                errors.push(...totalsValidation.errors);
                warnings.push(...totalsValidation.warnings);
                score -= totalsValidation.scoreDeduction;
            }
            // Metadata validation
            const metadataValidation = this.validateMetadata(receipt);
            errors.push(...metadataValidation.errors);
            warnings.push(...metadataValidation.warnings);
            score -= metadataValidation.scoreDeduction;
        }
        catch (error) {
            errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            score = 0;
        }
        return {
            valid: errors.length === 0,
            score: Math.max(0, score),
            errors,
            warnings,
            validatedAt: new Date().toISOString()
        };
    }
    /**
     * Validate receipt calculations
     */
    validateCalculations(receipt) {
        const errors = [];
        const warnings = [];
        let score = 100;
        if (!receipt.events || receipt.events.length === 0) {
            errors.push('No events to validate calculations');
            return {
                valid: false,
                score: 0,
                errors,
                warnings,
                validatedAt: new Date().toISOString()
            };
        }
        // Validate each event's calculations
        receipt.events.forEach((event, index) => {
            if (!event.items || event.items.length === 0) {
                warnings.push(`Event ${index + 1} has no items`);
                score -= 2;
                return;
            }
            // Validate item calculations
            event.items.forEach((item, itemIndex) => {
                const expectedTotal = item.qty * item.unit_price - (item.discount_amount || 0);
                const tolerance = 0.01;
                if (Math.abs(expectedTotal - item.total_price) > tolerance) {
                    errors.push(`Event ${index + 1}, Item ${itemIndex + 1}: Calculation error - expected ${expectedTotal}, got ${item.total_price}`);
                    score -= 5;
                }
            });
            // Validate event totals
            const itemsSubtotal = event.items.reduce((sum, item) => sum + item.total_price, 0);
            const itemsTax = event.items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
            if (Math.abs(itemsSubtotal - event.totals.subtotal) > 0.01) {
                errors.push(`Event ${index + 1}: Subtotal mismatch - expected ${itemsSubtotal}, got ${event.totals.subtotal}`);
                score -= 10;
            }
        });
        return {
            valid: errors.length === 0,
            score: Math.max(0, score),
            errors,
            warnings,
            validatedAt: new Date().toISOString()
        };
    }
    /**
     * Validate receipt timestamps
     */
    validateTimestamps(receipt) {
        const errors = [];
        const warnings = [];
        let score = 100;
        // Validate session timestamps
        if (receipt.session) {
            if (!constants_1.VALIDATION_PATTERNS.ISO_8601.test(receipt.session.opened_at)) {
                errors.push('Session opened_at timestamp is invalid');
                score -= 10;
            }
            if (receipt.session.closed_at && !constants_1.VALIDATION_PATTERNS.ISO_8601.test(receipt.session.closed_at)) {
                errors.push('Session closed_at timestamp is invalid');
                score -= 10;
            }
            // Check timestamp order
            if (receipt.session.closed_at) {
                const opened = new Date(receipt.session.opened_at);
                const closed = new Date(receipt.session.closed_at);
                if (closed <= opened) {
                    errors.push('Session closed_at must be after opened_at');
                    score -= 15;
                }
            }
        }
        // Validate event timestamps
        if (receipt.events) {
            receipt.events.forEach((event, index) => {
                if (!constants_1.VALIDATION_PATTERNS.ISO_8601.test(event.printed_at)) {
                    errors.push(`Event ${index + 1}: printed_at timestamp is invalid`);
                    score -= 5;
                }
            });
        }
        // Validate metadata timestamps
        if (!constants_1.VALIDATION_PATTERNS.ISO_8601.test(receipt.created_at)) {
            errors.push('Receipt created_at timestamp is invalid');
            score -= 10;
        }
        if (!constants_1.VALIDATION_PATTERNS.ISO_8601.test(receipt.updated_at)) {
            errors.push('Receipt updated_at timestamp is invalid');
            score -= 10;
        }
        return {
            valid: errors.length === 0,
            score: Math.max(0, score),
            errors,
            warnings,
            validatedAt: new Date().toISOString()
        };
    }
    /**
     * Quick validation with default settings
     */
    quickValidate(receipt) {
        return this.validateStructure(receipt);
    }
    /**
     * Update validation configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    validateSessionStructure(session) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        if (!session.tabeza_receipt_id || !constants_1.VALIDATION_PATTERNS.TABEZA_RECEIPT_ID.test(session.tabeza_receipt_id)) {
            errors.push('Invalid TABEZA receipt ID format');
            scoreDeduction += 10;
        }
        if (!session.session_reference || !constants_1.VALIDATION_PATTERNS.SESSION_REFERENCE.test(session.session_reference)) {
            errors.push('Invalid session reference format');
            scoreDeduction += 10;
        }
        if (!session.merchant || !session.merchant.id || !session.merchant.name) {
            errors.push('Merchant information is incomplete');
            scoreDeduction += 15;
        }
        if (!session.device || !session.device.printer_id) {
            warnings.push('Device information is incomplete');
            scoreDeduction += 5;
        }
        if (session.currency !== 'KES') {
            warnings.push('Currency is not KES');
            scoreDeduction += 2;
        }
        return { errors, warnings, scoreDeduction };
    }
    validateEventsStructure(events) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        if (events.length > constants_1.VALIDATION_LIMITS.MAX_EVENTS_PER_SESSION) {
            warnings.push(`Too many events (${events.length}), maximum recommended is ${constants_1.VALIDATION_LIMITS.MAX_EVENTS_PER_SESSION}`);
            scoreDeduction += 5;
        }
        events.forEach((event, index) => {
            if (!event.event_id || !constants_1.VALIDATION_PATTERNS.EVENT_ID.test(event.event_id)) {
                errors.push(`Event ${index + 1}: Invalid event ID format`);
                scoreDeduction += 5;
            }
            if (!event.items || !Array.isArray(event.items)) {
                errors.push(`Event ${index + 1}: Items must be an array`);
                scoreDeduction += 10;
            }
            else if (event.items.length > constants_1.VALIDATION_LIMITS.MAX_ITEMS_PER_EVENT) {
                warnings.push(`Event ${index + 1}: Too many items (${event.items.length})`);
                scoreDeduction += 2;
            }
            if (!event.totals) {
                errors.push(`Event ${index + 1}: Totals are required`);
                scoreDeduction += 10;
            }
        });
        return { errors, warnings, scoreDeduction };
    }
    validateTotalsStructure(totals) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        const requiredFields = ['subtotal', 'tax', 'discount', 'service_charge', 'total'];
        for (const field of requiredFields) {
            if (typeof totals[field] !== 'number' || totals[field] < 0) {
                errors.push(`Totals.${field} must be a non-negative number`);
                scoreDeduction += 5;
            }
        }
        if (totals.balance !== undefined && typeof totals.balance !== 'number') {
            errors.push('Totals.balance must be a number');
            scoreDeduction += 3;
        }
        return { errors, warnings, scoreDeduction };
    }
    validateMetadata(receipt) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        if (!receipt.version) {
            warnings.push('Version information is missing');
            scoreDeduction += 2;
        }
        if (!receipt.created_at || !receipt.updated_at) {
            errors.push('Metadata timestamps are required');
            scoreDeduction += 10;
        }
        return { errors, warnings, scoreDeduction };
    }
}
exports.ReceiptDataValidator = ReceiptDataValidator;
//# sourceMappingURL=receipt-data-validator.js.map