/**
 * Venue Configuration Validation Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service enforces the Core Truth constraint validation for venue mode combinations
 * as defined in the onboarding-flow-fix specification.
 */
export type VenueMode = 'basic' | 'venue';
export type AuthorityMode = 'pos' | 'tabeza';
export interface VenueConfiguration {
    venue_mode: VenueMode;
    authority_mode: AuthorityMode;
    pos_integration_enabled: boolean;
    printer_required: boolean;
    onboarding_completed: boolean;
    authority_configured_at?: string;
    mode_last_changed_at?: string;
}
export interface VenueConfigurationInput {
    venue_mode: VenueMode;
    authority_mode?: AuthorityMode;
    pos_integration_enabled?: boolean;
    printer_required?: boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    correctedConfig?: VenueConfiguration;
}
/**
 * Core Truth Constraint Validation
 *
 * Validates that venue configurations conform to the Core Truth model:
 * - Basic mode MUST use POS authority with printer required
 * - Venue mode MUST use exactly one digital authority (POS OR Tabeza)
 * - Manual ordering always coexists (implicit, not validated here)
 */
export declare function validateVenueConfiguration(input: VenueConfigurationInput): ValidationResult;
/**
 * Generate Corrected Configuration
 *
 * Applies the Core Truth rules to generate a valid configuration:
 * - Basic mode: Sets authority_mode='pos', printer_required=true
 * - Venue+POS: Sets pos_integration_enabled=true, printer_required=false (optional)
 * - Venue+Tabeza: Sets pos_integration_enabled=false, printer_required=false
 */
export declare function generateCorrectedConfiguration(input: VenueConfigurationInput): VenueConfiguration;
/**
 * Validate Configuration Change
 *
 * Validates configuration changes and checks for potentially destructive operations
 */
export declare function validateConfigurationChange(currentConfig: VenueConfiguration, newConfig: VenueConfigurationInput): ValidationResult;
/**
 * Check if configuration is valid for the Core Truth model
 */
export declare function isValidCoreConfiguration(config: VenueConfiguration): boolean;
/**
 * Get configuration description for UI display
 */
export declare function getConfigurationDescription(config: VenueConfiguration): string;
/**
 * Get theme configuration based on venue setup
 */
export declare function getThemeConfiguration(config: VenueConfiguration): {
    theme: 'blue' | 'yellow' | 'green';
    description: string;
    icons: string[];
};
/**
 * Migration helper for existing venues
 */
export declare function getDefaultMigrationConfiguration(): VenueConfiguration;
