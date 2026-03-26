/**
 * Environment Variable Validator for M-Pesa Integration
 * Validates all required environment variables for credential decryption
 */
export interface EnvironmentVariable {
    name: string;
    required: boolean;
    description: string;
    format?: RegExp;
    minLength?: number;
    maxLength?: number;
    sensitive?: boolean;
}
export interface EnvironmentValidationResult {
    variable: string;
    present: boolean;
    valid: boolean;
    value?: string;
    maskedValue?: string;
    errors: string[];
}
export interface EnvironmentValidationReport {
    environment: 'development' | 'production' | 'unknown';
    timestamp: Date;
    allValid: boolean;
    results: EnvironmentValidationResult[];
    missing: string[];
    invalid: string[];
    recommendations: string[];
}
export interface EnvironmentComparison {
    variable: string;
    devValue?: string;
    prodValue?: string;
    devMasked?: string;
    prodMasked?: string;
    match: boolean;
    issue?: string;
}
/**
 * Required environment variables for M-Pesa integration
 */
export declare const REQUIRED_ENVIRONMENT_VARIABLES: EnvironmentVariable[];
/**
 * Environment Variable Validator Service
 */
export declare class EnvironmentValidator {
    private variables;
    constructor(customVariables?: EnvironmentVariable[]);
    /**
     * Validate all required environment variables
     */
    validateRequiredVariables(): EnvironmentValidationReport;
    /**
     * Validate a single environment variable
     */
    private validateSingleVariable;
    /**
     * Compare environment configurations between two environments
     */
    compareEnvironments(devEnv: Record<string, string>, prodEnv: Record<string, string>): EnvironmentComparison[];
    /**
     * Generate environment setup checklist
     */
    generateEnvironmentChecklist(): {
        variable: string;
        description: string;
        required: boolean;
        example?: string;
        instructions: string;
    }[];
    /**
     * Validate encryption key format specifically
     */
    validateEncryptionKeyFormat(key: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Detect current environment
     */
    private detectEnvironment;
    /**
     * Mask sensitive values for logging
     */
    private maskSensitiveValue;
    /**
     * Get example value for a variable (for documentation)
     */
    private getExampleValue;
    /**
     * Get setup instructions for a variable
     */
    private getSetupInstructions;
}
/**
 * Default environment validator instance
 */
export declare const environmentValidator: EnvironmentValidator;
