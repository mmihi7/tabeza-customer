/**
 * Mode Configuration Service
 * Task 2: Mode Configuration Service
 *
 * Fetches and manages venue mode configuration from the database.
 * Provides feature availability checks based on mode configuration.
 */
export type VenueMode = 'basic' | 'venue';
export type AuthorityMode = 'pos' | 'tabeza';
export interface ModeConfiguration {
    venue_mode: VenueMode;
    authority_mode: AuthorityMode;
    pos_integration_enabled: boolean;
    printer_required: boolean;
    onboarding_completed: boolean;
    isBasic: boolean;
    isVenue: boolean;
    isPOSAuthority: boolean;
    isTabezaAuthority: boolean;
}
export type FeatureFlag = 'menu_management' | 'order_creation' | 'customer_ordering' | 'customer_requests' | 'messaging' | 'promotions' | 'printer_config' | 'timed_availability';
/**
 * Fetch mode configuration for a specific venue
 * @param barId - The venue's unique identifier
 * @returns Promise resolving to mode configuration
 * @throws Error if configuration cannot be fetched or is invalid
 */
export declare function fetchModeConfig(barId: string): Promise<ModeConfiguration>;
/**
 * Validate mode configuration against business rules
 * @param config - Configuration to validate
 * @returns true if valid, throws Error with message if invalid
 */
export declare function validateModeConfig(config: Partial<ModeConfiguration>): boolean;
/**
 * Check if a specific feature is available in the given mode
 * @param config - Current mode configuration
 * @param feature - Feature identifier
 * @returns true if feature is available
 */
export declare function isFeatureAvailable(config: ModeConfiguration, feature: FeatureFlag): boolean;
