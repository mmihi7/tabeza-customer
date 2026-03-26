/**
 * Simple M-Pesa Configuration Loader
 * Loads M-Pesa credentials from database per bar (multi-tenant)
 * Requirements: 4.1, 4.2, 4.4, 4.5
 *
 * Storage Contract: All encrypted credentials are stored as PostgreSQL bytea hex format
 */
export type MpesaEnvironment = 'sandbox' | 'production';
export interface MpesaConfig {
    environment: MpesaEnvironment;
    consumerKey: string;
    consumerSecret: string;
    businessShortcode: string;
    passkey: string;
    callbackUrl: string;
    oauthUrl: string;
    stkPushUrl: string;
    stkQueryUrl: string;
}
export interface BarMpesaData {
    mpesa_enabled: boolean;
    mpesa_environment: string;
    mpesa_business_shortcode: string;
    mpesa_consumer_key_encrypted: string;
    mpesa_consumer_secret_encrypted: string;
    mpesa_passkey_encrypted: string;
}
export declare class MpesaConfigurationError extends Error {
    missingFields?: string[] | undefined;
    constructor(message: string, missingFields?: string[] | undefined);
}
/**
 * Load and validate M-Pesa configuration from bar database record
 * Requirement 4.1: THE System SHALL read M-Pesa credentials from database per bar
 * Requirement 4.2: THE System SHALL support both sandbox and production environments via configuration
 * Requirement 4.4: WHEN configuration is missing, THE System SHALL return clear configuration error messages
 * Requirement 4.5: THE System SHALL validate all required M-Pesa configuration
 */
export declare function loadMpesaConfigFromBar(barData: BarMpesaData): MpesaConfig;
/**
 * Get standard Safaricom sandbox test phone numbers
 * These are the official test numbers provided by Safaricom for sandbox testing
 */
export declare function getSandboxTestPhoneNumbers(): string[];
/**
 * Check if a phone number is a valid sandbox test number
 */
export declare function isSandboxTestPhoneNumber(phoneNumber: string): boolean;
/**
 * Check if M-Pesa is configured for a specific bar
 * Useful for conditional feature enablement
 */
export declare function isMpesaConfiguredForBar(barData: BarMpesaData): boolean;
/**
 * Get sandbox configuration info for display in UI
 */
export declare function getSandboxConfigInfo(): {
    businessShortcode: string;
    passkey: string;
    testPhoneNumbers: string[];
    instructions: {
        consumerKey: string;
        consumerSecret: string;
        businessShortcode: string;
        passkey: string;
        testNumbers: string;
    };
};
/**
 * Auto-fill sandbox credentials for UI save operations
 * This ensures empty sandbox fields get the standard values before database save
 */
export declare function autoFillSandboxCredentials(settings: {
    mpesa_environment: string;
    mpesa_business_shortcode: string;
    mpesa_passkey: string;
}): {
    mpesa_environment: string;
    mpesa_business_shortcode: string;
    mpesa_passkey: string;
};
/**
 * Legacy function for environment variable configuration (for testing)
 * @deprecated Use loadMpesaConfigFromBar for multi-tenant setup
 */
export declare function loadMpesaConfig(): MpesaConfig;
/**
 * Legacy environment variable check (for testing)
 * @deprecated Use isMpesaConfiguredForBar for multi-tenant setup
 */
export declare function isMpesaConfigured(): boolean;
