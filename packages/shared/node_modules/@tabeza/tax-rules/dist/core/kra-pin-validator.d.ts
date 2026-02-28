/**
 * TABEZA Tax Rules Engine - KRA PIN Validator
 * Pure KRA PIN validation functions for Kenya tax compliance
 */
import type { KRAPinValidation } from '../types';
/**
 * Validate KRA PIN format and structure
 */
export declare function validateKRAPin(pin: string): KRAPinValidation;
/**
 * Extract information from a valid KRA PIN
 */
export declare function extractKRAPinInfo(pin: string): {
    isValid: boolean;
    prefix: string;
    numericPart: string;
    checkLetter: string;
    registrationSequence?: string;
} | null;
/**
 * Generate a sample valid KRA PIN for testing
 * Note: This generates a format-valid PIN, not a real registered PIN
 */
export declare function generateSampleKRAPin(): string;
/**
 * Validate multiple KRA PINs
 */
export declare function validateMultipleKRAPins(pins: string[]): Array<{
    pin: string;
    validation: KRAPinValidation;
}>;
/**
 * Check if a PIN is likely to be a test/dummy PIN
 */
export declare function isTestKRAPin(pin: string): boolean;
/**
 * Format KRA PIN for display (with spacing for readability)
 */
export declare function formatKRAPinForDisplay(pin: string): string;
/**
 * Get KRA PIN validation rules for display/documentation
 */
export declare function getKRAPinValidationRules(): {
    format: string;
    length: number;
    pattern: string;
    examples: string[];
    rules: string[];
};
/**
 * Validate KRA PIN with additional business rules
 */
export declare function validateKRAPinWithBusinessRules(pin: string, merchantName?: string, registrationDate?: string): KRAPinValidation & {
    businessValidation: {
        warnings: string[];
        recommendations: string[];
    };
};
//# sourceMappingURL=kra-pin-validator.d.ts.map