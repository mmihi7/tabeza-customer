"use strict";
/**
 * TABEZA Validation Library - Core Validators
 * Pure validation functions for receipt data and business rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReceiptData = validateReceiptData;
exports.validateBusinessRules = validateBusinessRules;
exports.validateCrossSystemCompatibility = validateCrossSystemCompatibility;
exports.validateDataConsistency = validateDataConsistency;
exports.validateReceiptStructure = validateReceiptStructure;
exports.validateReceiptCalculations = validateReceiptCalculations;
exports.validateReceiptTimestamps = validateReceiptTimestamps;
const constants_1 = require("../constants");
const types_1 = require("../types");
/**
 * Validate receipt data structure and format
 */
function validateReceiptData(params) {
    const { receipt, config = types_1.DEFAULT_VALIDATION_CONFIG } = params;
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
            const sessionValidation = validateSessionStructure(receipt.session);
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
            const eventsValidation = validateEventsStructure(receipt.events);
            errors.push(...eventsValidation.errors);
            warnings.push(...eventsValidation.warnings);
            score -= eventsValidation.scoreDeduction;
        }
        // Totals validation (if present)
        if (receipt.totals) {
            const totalsValidation = validateTotalsStructure(receipt.totals);
            errors.push(...totalsValidation.errors);
            warnings.push(...totalsValidation.warnings);
            score -= totalsValidation.scoreDeduction;
        }
        // Metadata validation
        const metadataValidation = validateMetadata(receipt);
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
 * Validate business rules
 */
function validateBusinessRules(params) {
    const { receipt, strictMode = false, customRules = [] } = params;
    const allRules = [...constants_1.BUSINESS_RULES, ...customRules];
    const ruleResults = [];
    let score = 100;
    const summary = {
        totalRules: allRules.length,
        passedRules: 0,
        failedRules: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
    };
    for (const rule of allRules) {
        try {
            const passed = rule.validate(receipt);
            const ruleResult = {
                ruleName: rule.name,
                passed,
                message: passed ? `${rule.description} - PASSED` : rule.getMessage(receipt),
                severity: rule.severity,
                details: rule.getDetails ? rule.getDetails(receipt) : undefined
            };
            ruleResults.push(ruleResult);
            if (passed) {
                summary.passedRules++;
            }
            else {
                summary.failedRules++;
                // Deduct score based on severity
                const deduction = constants_1.BUSINESS_RULE_WEIGHTS[rule.severity];
                score -= deduction;
                // Count issues by severity
                switch (rule.severity) {
                    case 'CRITICAL':
                        summary.criticalIssues++;
                        break;
                    case 'HIGH':
                        summary.highIssues++;
                        break;
                    case 'MEDIUM':
                        summary.mediumIssues++;
                        break;
                    case 'LOW':
                        summary.lowIssues++;
                        break;
                }
            }
        }
        catch (error) {
            ruleResults.push({
                ruleName: rule.name,
                passed: false,
                message: `Rule validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'HIGH'
            });
            summary.failedRules++;
            summary.highIssues++;
            score -= constants_1.BUSINESS_RULE_WEIGHTS.HIGH;
        }
    }
    return {
        valid: summary.failedRules === 0,
        score: Math.max(0, score),
        rules: ruleResults,
        summary,
        validatedAt: new Date().toISOString()
    };
}
/**
 * Validate cross-system compatibility
 */
function validateCrossSystemCompatibility(params) {
    const { data, targetSystems, strictMode = false } = params;
    const issues = [];
    let consistencyScore = 100;
    let cloudCompatible = true;
    let agentCompatible = true;
    // Check cloud compatibility
    if (targetSystems.includes('CLOUD') || targetSystems.includes('BOTH')) {
        const cloudIssues = validateCloudCompatibility(data, strictMode);
        issues.push(...cloudIssues);
        if (cloudIssues.some(issue => issue.severity === 'BLOCKING')) {
            cloudCompatible = false;
            consistencyScore -= 30;
        }
        else if (cloudIssues.length > 0) {
            consistencyScore -= cloudIssues.length * 5;
        }
    }
    // Check agent compatibility
    if (targetSystems.includes('AGENT') || targetSystems.includes('BOTH')) {
        const agentIssues = validateAgentCompatibility(data, strictMode);
        issues.push(...agentIssues);
        if (agentIssues.some(issue => issue.severity === 'BLOCKING')) {
            agentCompatible = false;
            consistencyScore -= 30;
        }
        else if (agentIssues.length > 0) {
            consistencyScore -= agentIssues.length * 5;
        }
    }
    return {
        cloudCompatible,
        agentCompatible,
        consistencyScore: Math.max(0, consistencyScore),
        issues,
        validatedAt: new Date().toISOString()
    };
}
/**
 * Validate data consistency
 */
function validateDataConsistency(data) {
    const errors = [];
    const warnings = [];
    let score = 100;
    // Check for null/undefined values in required fields
    const requiredFields = ['session', 'events', 'created_at', 'updated_at', 'version'];
    for (const field of requiredFields) {
        if (data[field] === null || data[field] === undefined) {
            errors.push(`Required field '${field}' is missing or null`);
            score -= 15;
        }
    }
    // Check data types
    if (data.events && !Array.isArray(data.events)) {
        errors.push('Events must be an array');
        score -= 10;
    }
    // Check for circular references
    try {
        JSON.stringify(data);
    }
    catch (error) {
        errors.push('Data contains circular references');
        score -= 20;
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
 * Validate receipt structure
 */
function validateReceiptStructure(receipt) {
    return validateReceiptData({ receipt });
}
/**
 * Validate receipt calculations
 */
function validateReceiptCalculations(receipt) {
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
function validateReceiptTimestamps(receipt) {
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
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function validateSessionStructure(session) {
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
function validateEventsStructure(events) {
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
function validateTotalsStructure(totals) {
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
function validateMetadata(receipt) {
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
function validateCloudCompatibility(data, strictMode) {
    const issues = [];
    // Check for binary data
    if (containsBinaryData(data)) {
        issues.push({
            system: 'CLOUD',
            issue: 'Data contains binary content',
            severity: 'BLOCKING',
            recommendation: 'Convert binary data to base64 or remove it'
        });
    }
    // Check for file system paths
    if (containsFilePaths(data)) {
        issues.push({
            system: 'CLOUD',
            issue: 'Data contains file system paths',
            severity: 'WARNING',
            recommendation: 'Use relative paths or URLs instead'
        });
    }
    return issues;
}
function validateAgentCompatibility(data, strictMode) {
    const issues = [];
    // Check for very large data structures
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 1000000) { // 1MB
        issues.push({
            system: 'AGENT',
            issue: 'Data structure is very large',
            severity: 'WARNING',
            recommendation: 'Consider splitting large data into smaller chunks'
        });
    }
    return issues;
}
function containsBinaryData(obj) {
    if (obj instanceof Buffer || obj instanceof ArrayBuffer) {
        return true;
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
            if (containsBinaryData(value)) {
                return true;
            }
        }
    }
    return false;
}
function containsFilePaths(obj) {
    if (typeof obj === 'string') {
        // Check for common file path patterns
        return /^[A-Za-z]:\\|^\/|^\.\/|^\.\.\//.test(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
            if (containsFilePaths(value)) {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=validators.js.map