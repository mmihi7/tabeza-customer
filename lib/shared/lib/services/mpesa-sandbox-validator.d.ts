/**
 * M-Pesa Sandbox Configuration Validator
 * Validates sandbox configuration according to Safaricom requirements
 * Requirements: 3.1, 6.1
 */
import { MpesaConfig } from './mpesa-config';
export interface SandboxValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}
export interface SandboxValidationOptions {
    strictMode?: boolean;
    validateCallbackUrl?: boolean;
}
/**
 * Comprehensive sandbox configuration validation
 * Requirement 3.1: WHEN receiving a payment callback, THE Callback_Handler SHALL validate the request signature and origin
 * Requirement 6.1: WHEN payment errors occur, THE Error_Handler SHALL categorize errors by type and severity
 */
export declare function validateSandboxConfiguration(config: MpesaConfig, options?: SandboxValidationOptions): SandboxValidationResult;
/**
 * Validate phone number for sandbox testing
 * Requirement: Ensure sandbox uses Safaricom test MSISDNs
 */
export declare function validateSandboxPhoneNumber(phoneNumber: string): {
    isValid: boolean;
    error?: string;
    recommendation?: string;
};
/**
 * Get sandbox configuration summary for display
 */
export declare function getSandboxConfigurationSummary(config: MpesaConfig): {
    environment: string;
    businessShortcode: string;
    isStandardShortcode: boolean;
    hasValidCredentials: boolean;
    callbackProtocol: string;
    testPhoneNumbers: string[];
    configurationStatus: 'complete' | 'partial' | 'invalid';
};
