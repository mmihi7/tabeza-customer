/**
 * Printer Authority Mode Validator
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service validates printer requirements based on venue authority configuration
 * and enforces the Core Truth constraint that printer services are only required
 * for POS authority modes (Basic mode and Venue+POS mode).
 */
import { VenueMode, AuthorityMode, VenueConfiguration } from './venue-configuration-validation';
import { PrinterRequirement, PrinterServiceConfig } from './printer-service-types';
/**
 * Authority Mode Validator Interface
 *
 * Validates printer requirements based on venue authority configuration
 */
export interface AuthorityModeValidator {
    /**
     * Validate printer requirement for a given venue configuration
     *
     * @param config - Venue configuration to validate
     * @returns PrinterRequirement indicating if printer is required and why
     */
    validatePrinterRequirement(config: VenueConfiguration): PrinterRequirement;
    /**
     * Check if printer setup should be skipped for a given configuration
     *
     * @param venueMode - Venue mode (basic or venue)
     * @param authorityMode - Authority mode (pos or tabeza)
     * @returns true if printer setup should be skipped, false otherwise
     */
    shouldSkipPrinterSetup(venueMode: VenueMode, authorityMode: AuthorityMode): boolean;
    /**
     * Validate that a configuration is valid for printer service activation
     *
     * @param config - Venue configuration to validate
     * @throws InvalidAuthorityConfigurationError if configuration is invalid
     * @throws PrinterRequirementMismatchError if printer requirement doesn't match authority mode
     */
    validateConfiguration(config: VenueConfiguration): void;
    /**
     * Get printer service configuration from venue configuration
     *
     * @param config - Venue configuration
     * @returns PrinterServiceConfig for service initialization
     */
    getPrinterServiceConfig(config: VenueConfiguration): PrinterServiceConfig;
}
/**
 * Default implementation of AuthorityModeValidator
 */
export declare class DefaultAuthorityModeValidator implements AuthorityModeValidator {
    /**
     * Validate printer requirement based on venue configuration
     *
     * Core Truth Rules:
     * - Basic mode (POS authority): Printer REQUIRED
     * - Venue + POS authority: Printer REQUIRED
     * - Venue + Tabeza authority: Printer NOT REQUIRED
     */
    validatePrinterRequirement(config: VenueConfiguration): PrinterRequirement;
    /**
     * Check if printer setup should be skipped
     *
     * Printer setup is skipped only for Venue + Tabeza authority mode
     */
    shouldSkipPrinterSetup(venueMode: VenueMode, authorityMode: AuthorityMode): boolean;
    /**
     * Validate configuration for printer service activation
     *
     * Ensures configuration is valid according to Core Truth constraints
     * and printer requirements match authority mode
     */
    validateConfiguration(config: VenueConfiguration): void;
    /**
     * Get printer service configuration from venue configuration
     */
    getPrinterServiceConfig(config: VenueConfiguration): PrinterServiceConfig;
}
/**
 * Create a new authority mode validator instance
 */
export declare function createAuthorityModeValidator(): AuthorityModeValidator;
/**
 * Utility function to check if printer drivers are required for a configuration
 *
 * @param venueMode - Venue mode
 * @param authorityMode - Authority mode
 * @returns true if printer drivers are required, false otherwise
 */
export declare function isPrinterDriverRequired(venueMode: VenueMode, authorityMode: AuthorityMode): boolean;
/**
 * Utility function to check if ESC/POS communication should be active
 *
 * @param authorityMode - Authority mode
 * @returns true if ESC/POS communication should be active, false otherwise
 */
export declare function isESCPOSActive(authorityMode: AuthorityMode): boolean;
/**
 * Utility function to check if print queue should be active
 *
 * @param authorityMode - Authority mode
 * @returns true if print queue should be active, false otherwise
 */
export declare function isPrintQueueActive(authorityMode: AuthorityMode): boolean;
/**
 * Utility function to check if printer status monitoring should be active
 *
 * @param authorityMode - Authority mode
 * @returns true if status monitoring should be active, false otherwise
 */
export declare function isPrinterStatusMonitoringActive(authorityMode: AuthorityMode): boolean;
/**
 * Get printer requirement description for UI display
 *
 * @param config - Venue configuration
 * @returns Human-readable description of printer requirements
 */
export declare function getPrinterRequirementDescription(config: VenueConfiguration): string;
