"use strict";
/**
 * TABEZA Tax Rules Engine - KRA PIN Validator
 * Pure KRA PIN validation functions for Kenya tax compliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateKRAPin = validateKRAPin;
exports.extractKRAPinInfo = extractKRAPinInfo;
exports.generateSampleKRAPin = generateSampleKRAPin;
exports.validateMultipleKRAPins = validateMultipleKRAPins;
exports.isTestKRAPin = isTestKRAPin;
exports.formatKRAPinForDisplay = formatKRAPinForDisplay;
exports.getKRAPinValidationRules = getKRAPinValidationRules;
exports.validateKRAPinWithBusinessRules = validateKRAPinWithBusinessRules;
const constants_1 = require("../constants");
/**
 * Validate KRA PIN format and structure
 */
function validateKRAPin(pin) {
    const errors = [];
    let format = 'INVALID';
    // Basic format validation
    if (!pin || typeof pin !== 'string') {
        errors.push('PIN must be a non-empty string');
        return { pin, valid: false, format, errors };
    }
    // Remove any whitespace
    const cleanPin = pin.trim().toUpperCase();
    // Check length
    if (cleanPin.length !== 11) {
        errors.push('PIN must be exactly 11 characters long');
    }
    // Check format pattern
    if (!constants_1.KRA_PIN_PATTERNS.FULL_FORMAT.test(cleanPin)) {
        errors.push('PIN must follow format: P + 9 digits + 1 letter (e.g., P051234567M)');
    }
    else {
        // Determine if it's individual or company PIN
        // For KRA PINs, both individuals and companies use the same format
        // The distinction is typically made in the registration process, not the PIN format
        format = 'INDIVIDUAL'; // Default assumption
        // Additional validation for the check digit (letter)
        const checkLetter = cleanPin.charAt(10);
        if (!/[A-Z]/.test(checkLetter)) {
            errors.push('Last character must be a letter A-Z');
        }
    }
    // Validate the numeric part
    const numericPart = cleanPin.substring(1, 10);
    if (!/^\d{9}$/.test(numericPart)) {
        errors.push('Characters 2-10 must be digits');
    }
    // Check for obviously invalid patterns
    if (numericPart === '000000000') {
        errors.push('PIN cannot contain all zeros in the numeric part');
    }
    // Check for sequential numbers (basic validation)
    if (isSequentialNumbers(numericPart)) {
        errors.push('PIN appears to contain sequential numbers, which may be invalid');
    }
    const valid = errors.length === 0;
    return {
        pin: cleanPin,
        valid,
        format: valid ? format : 'INVALID',
        errors
    };
}
/**
 * Extract information from a valid KRA PIN
 */
function extractKRAPinInfo(pin) {
    const validation = validateKRAPin(pin);
    if (!validation.valid) {
        return null;
    }
    const cleanPin = validation.pin;
    return {
        isValid: true,
        prefix: cleanPin.charAt(0), // 'P'
        numericPart: cleanPin.substring(1, 10),
        checkLetter: cleanPin.charAt(10),
        registrationSequence: cleanPin.substring(1, 4) // First 3 digits often indicate registration sequence
    };
}
/**
 * Generate a sample valid KRA PIN for testing
 * Note: This generates a format-valid PIN, not a real registered PIN
 */
function generateSampleKRAPin() {
    // Generate 9 random digits
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    // Generate random letter
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters.charAt(Math.floor(Math.random() * letters.length));
    return `P${digits}${letter}`;
}
/**
 * Validate multiple KRA PINs
 */
function validateMultipleKRAPins(pins) {
    return pins.map(pin => ({
        pin,
        validation: validateKRAPin(pin)
    }));
}
/**
 * Check if a PIN is likely to be a test/dummy PIN
 */
function isTestKRAPin(pin) {
    const validation = validateKRAPin(pin);
    if (!validation.valid) {
        return false;
    }
    const cleanPin = validation.pin;
    const numericPart = cleanPin.substring(1, 10);
    // Common test patterns
    const testPatterns = [
        '000000000', // All zeros
        '111111111', // All ones
        '123456789', // Sequential
        '987654321', // Reverse sequential
        '555555555', // Repeated digits
    ];
    return testPatterns.includes(numericPart);
}
/**
 * Format KRA PIN for display (with spacing for readability)
 */
function formatKRAPinForDisplay(pin) {
    const validation = validateKRAPin(pin);
    if (!validation.valid) {
        return pin; // Return as-is if invalid
    }
    const cleanPin = validation.pin;
    // Format as: P 051 234 567 M
    return `${cleanPin.charAt(0)} ${cleanPin.substring(1, 4)} ${cleanPin.substring(4, 7)} ${cleanPin.substring(7, 10)} ${cleanPin.charAt(10)}`;
}
/**
 * Get KRA PIN validation rules for display/documentation
 */
function getKRAPinValidationRules() {
    return {
        format: 'P + 9 digits + 1 letter',
        length: 11,
        pattern: 'P#########L',
        examples: [
            'P051234567M',
            'P098765432A',
            'P123456789Z'
        ],
        rules: [
            'Must start with letter P',
            'Must be exactly 11 characters long',
            'Characters 2-10 must be digits (0-9)',
            'Last character must be a letter (A-Z)',
            'Cannot contain all zeros in numeric part',
            'Should not contain obvious sequential patterns'
        ]
    };
}
/**
 * Helper function to check for sequential numbers
 */
function isSequentialNumbers(numericString) {
    if (numericString.length < 3) {
        return false;
    }
    // Check for ascending sequence
    let isAscending = true;
    let isDescending = true;
    for (let i = 1; i < numericString.length; i++) {
        const current = parseInt(numericString[i]);
        const previous = parseInt(numericString[i - 1]);
        if (current !== previous + 1) {
            isAscending = false;
        }
        if (current !== previous - 1) {
            isDescending = false;
        }
    }
    return isAscending || isDescending;
}
/**
 * Validate KRA PIN with additional business rules
 */
function validateKRAPinWithBusinessRules(pin, merchantName, registrationDate) {
    const baseValidation = validateKRAPin(pin);
    const warnings = [];
    const recommendations = [];
    if (baseValidation.valid) {
        // Check if it's a test PIN
        if (isTestKRAPin(pin)) {
            warnings.push('This appears to be a test/dummy PIN');
            recommendations.push('Ensure you are using a real registered KRA PIN for production');
        }
        // Additional business rule checks could be added here
        // For example, checking against known invalid PIN ranges, etc.
    }
    return {
        ...baseValidation,
        businessValidation: {
            warnings,
            recommendations
        }
    };
}
//# sourceMappingURL=kra-pin-validator.js.map