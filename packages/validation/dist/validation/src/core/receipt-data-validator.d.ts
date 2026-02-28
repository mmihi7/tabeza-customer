/**
 * TABEZA Validation Library - Receipt Data Validator
 * Validates receipt data structure and format
 */
import type { CompleteReceiptSession } from '@tabeza/receipt-schema';
import type { ValidationResult, ReceiptValidationResult, ReceiptValidationConfig } from '../types';
/**
 * Receipt Data Validator Class
 * Handles validation of receipt data structure, format, and calculations
 */
export declare class ReceiptDataValidator {
    private config;
    constructor(config?: Partial<ReceiptValidationConfig>);
    /**
     * Validate complete receipt data
     */
    validate(receipt: CompleteReceiptSession): ReceiptValidationResult;
    /**
     * Validate receipt structure
     */
    validateStructure(receipt: CompleteReceiptSession): ValidationResult;
    /**
     * Validate receipt calculations
     */
    validateCalculations(receipt: CompleteReceiptSession): ValidationResult;
    /**
     * Validate receipt timestamps
     */
    validateTimestamps(receipt: CompleteReceiptSession): ValidationResult;
    /**
     * Quick validation with default settings
     */
    quickValidate(receipt: CompleteReceiptSession): ValidationResult;
    /**
     * Update validation configuration
     */
    updateConfig(config: Partial<ReceiptValidationConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): ReceiptValidationConfig;
    private validateSessionStructure;
    private validateEventsStructure;
    private validateTotalsStructure;
    private validateMetadata;
}
//# sourceMappingURL=receipt-data-validator.d.ts.map