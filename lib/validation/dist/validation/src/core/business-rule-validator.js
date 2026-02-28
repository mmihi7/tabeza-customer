"use strict";
/**
 * TABEZA Validation Library - Business Rule Validator
 * Extracted business rule validation logic from virtual-printer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleValidator = void 0;
const constants_1 = require("../constants");
/**
 * Business Rule Validator Class
 * Handles validation of business rules against receipt data
 */
class BusinessRuleValidator {
    constructor(options = {}) {
        this.customRules = [];
        this.strictMode = false;
        this.customRules = options.customRules || [];
        this.strictMode = options.strictMode || false;
    }
    /**
     * Validate business rules against a receipt
     */
    validate(receipt) {
        const allRules = [...constants_1.BUSINESS_RULES, ...this.customRules];
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
     * Add custom business rule
     */
    addRule(rule) {
        this.customRules.push(rule);
    }
    /**
     * Remove custom business rule
     */
    removeRule(ruleName) {
        const index = this.customRules.findIndex(rule => rule.name === ruleName);
        if (index >= 0) {
            this.customRules.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Get all rules (built-in + custom)
     */
    getAllRules() {
        return [...constants_1.BUSINESS_RULES, ...this.customRules];
    }
    /**
     * Get rule by name
     */
    getRule(ruleName) {
        return this.getAllRules().find(rule => rule.name === ruleName);
    }
    /**
     * Validate specific rule against receipt
     */
    validateRule(ruleName, receipt) {
        const rule = this.getRule(ruleName);
        if (!rule) {
            return null;
        }
        try {
            const passed = rule.validate(receipt);
            return {
                passed,
                message: passed ? `${rule.description} - PASSED` : rule.getMessage(receipt),
                severity: rule.severity
            };
        }
        catch (error) {
            return {
                passed: false,
                message: `Rule validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'HIGH'
            };
        }
    }
    /**
     * Get validation summary
     */
    getSummary(receipt) {
        const result = this.validate(receipt);
        const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const worstSeverity = result.rules
            .filter(rule => !rule.passed)
            .reduce((worst, rule) => {
            if (!worst)
                return rule.severity;
            const currentIndex = severityOrder.indexOf(rule.severity);
            const worstIndex = severityOrder.indexOf(worst);
            return currentIndex < worstIndex ? rule.severity : worst;
        }, null);
        return {
            totalRules: result.summary.totalRules,
            passedRules: result.summary.passedRules,
            failedRules: result.summary.failedRules,
            criticalIssues: result.summary.criticalIssues,
            score: result.score,
            worstSeverity
        };
    }
    /**
     * Set strict mode
     */
    setStrictMode(strict) {
        this.strictMode = strict;
    }
    /**
     * Get strict mode status
     */
    isStrictMode() {
        return this.strictMode;
    }
}
exports.BusinessRuleValidator = BusinessRuleValidator;
//# sourceMappingURL=business-rule-validator.js.map