/**
 * TABEZA Validation Library - Core Validators
 * Pure validation functions for receipt data and business rules
 */
import type { CompleteReceiptSession } from '@tabeza/receipt-schema';
import type { ValidationResult, BusinessRuleResult, CrossSystemValidation, ValidateReceiptDataParams, ValidateBusinessRulesParams, CrossSystemValidationParams } from '../types';
/**
 * Validate receipt data structure and format
 */
export declare function validateReceiptData(params: ValidateReceiptDataParams): ValidationResult;
/**
 * Validate business rules
 */
export declare function validateBusinessRules(params: ValidateBusinessRulesParams): BusinessRuleResult;
/**
 * Validate cross-system compatibility
 */
export declare function validateCrossSystemCompatibility(params: CrossSystemValidationParams): CrossSystemValidation;
/**
 * Validate data consistency
 */
export declare function validateDataConsistency(data: any): ValidationResult;
/**
 * Validate receipt structure
 */
export declare function validateReceiptStructure(receipt: CompleteReceiptSession): ValidationResult;
/**
 * Validate receipt calculations
 */
export declare function validateReceiptCalculations(receipt: CompleteReceiptSession): ValidationResult;
/**
 * Validate receipt timestamps
 */
export declare function validateReceiptTimestamps(receipt: CompleteReceiptSession): ValidationResult;
//# sourceMappingURL=validators.d.ts.map