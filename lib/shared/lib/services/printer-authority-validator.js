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
import { isValidCoreConfiguration } from './venue-configuration-validation';
import { InvalidAuthorityConfigurationError, PrinterRequirementMismatchError } from './printer-service-types';
/**
 * Default implementation of AuthorityModeValidator
 */
export class DefaultAuthorityModeValidator {
    /**
     * Validate printer requirement based on venue configuration
     *
     * Core Truth Rules:
     * - Basic mode (POS authority): Printer REQUIRED
     * - Venue + POS authority: Printer REQUIRED
     * - Venue + Tabeza authority: Printer NOT REQUIRED
     */
    validatePrinterRequirement(config) {
        // Basic mode always requires printer (POS authority)
        if (config.venue_mode === 'basic') {
            return {
                required: true,
                reason: 'basic_mode',
                description: 'Basic mode requires Tabeza printer drivers for POS receipt mirroring. ' +
                    'Download drivers from tabeza.co.ke and configure your POS to print to Tabeza.'
            };
        }
        // Venue mode: Check authority mode
        if (config.venue_mode === 'venue') {
            if (config.authority_mode === 'pos') {
                return {
                    required: true,
                    reason: 'venue_pos_integration',
                    description: 'Venue mode with POS authority requires Tabeza printer drivers for receipt mirroring. ' +
                        'Download drivers from tabeza.co.ke to enable POS integration.'
                };
            }
            if (config.authority_mode === 'tabeza') {
                return {
                    required: false,
                    reason: 'venue_tabeza_mode',
                    description: 'Venue mode with Tabeza authority uses digital-only receipts. ' +
                        'Printer drivers are not required.'
                };
            }
        }
        // Default: Not required (should not reach here with valid config)
        return {
            required: false,
            reason: 'venue_tabeza_mode',
            description: 'Printer not required for this configuration'
        };
    }
    /**
     * Check if printer setup should be skipped
     *
     * Printer setup is skipped only for Venue + Tabeza authority mode
     */
    shouldSkipPrinterSetup(venueMode, authorityMode) {
        // Skip printer setup only for Venue + Tabeza
        return venueMode === 'venue' && authorityMode === 'tabeza';
    }
    /**
     * Validate configuration for printer service activation
     *
     * Ensures configuration is valid according to Core Truth constraints
     * and printer requirements match authority mode
     */
    validateConfiguration(config) {
        // First check printer requirement mismatches (more specific errors)
        // Basic mode must have printer required
        if (config.venue_mode === 'basic' && !config.printer_required) {
            throw new PrinterRequirementMismatchError(config);
        }
        // Venue + Tabeza should NOT have printer required
        if (config.venue_mode === 'venue' &&
            config.authority_mode === 'tabeza' &&
            config.printer_required) {
            throw new PrinterRequirementMismatchError(config);
        }
        // Then check if configuration is valid according to Core Truth
        if (!isValidCoreConfiguration(config)) {
            throw new InvalidAuthorityConfigurationError(config.venue_mode, config.authority_mode);
        }
    }
    /**
     * Get printer service configuration from venue configuration
     */
    getPrinterServiceConfig(config) {
        return {
            venueMode: config.venue_mode,
            authorityMode: config.authority_mode,
            printerRequired: config.printer_required,
            posIntegrationEnabled: config.pos_integration_enabled
        };
    }
}
/**
 * Create a new authority mode validator instance
 */
export function createAuthorityModeValidator() {
    return new DefaultAuthorityModeValidator();
}
/**
 * Utility function to check if printer drivers are required for a configuration
 *
 * @param venueMode - Venue mode
 * @param authorityMode - Authority mode
 * @returns true if printer drivers are required, false otherwise
 */
export function isPrinterDriverRequired(venueMode, authorityMode) {
    // Printer drivers required for POS authority (Basic or Venue+POS)
    return authorityMode === 'pos';
}
/**
 * Utility function to check if ESC/POS communication should be active
 *
 * @param authorityMode - Authority mode
 * @returns true if ESC/POS communication should be active, false otherwise
 */
export function isESCPOSActive(authorityMode) {
    // ESC/POS communication only active for POS authority
    return authorityMode === 'pos';
}
/**
 * Utility function to check if print queue should be active
 *
 * @param authorityMode - Authority mode
 * @returns true if print queue should be active, false otherwise
 */
export function isPrintQueueActive(authorityMode) {
    // Print queue only active for POS authority
    return authorityMode === 'pos';
}
/**
 * Utility function to check if printer status monitoring should be active
 *
 * @param authorityMode - Authority mode
 * @returns true if status monitoring should be active, false otherwise
 */
export function isPrinterStatusMonitoringActive(authorityMode) {
    // Status monitoring only active for POS authority
    return authorityMode === 'pos';
}
/**
 * Get printer requirement description for UI display
 *
 * @param config - Venue configuration
 * @returns Human-readable description of printer requirements
 */
export function getPrinterRequirementDescription(config) {
    const validator = createAuthorityModeValidator();
    const requirement = validator.validatePrinterRequirement(config);
    return requirement.description;
}
