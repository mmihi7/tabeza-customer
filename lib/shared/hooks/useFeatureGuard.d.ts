/**
 * Feature Guard Hook
 * Task 5: Feature Guard Hook
 *
 * Provides boolean flags for feature availability based on mode configuration.
 * Used throughout the application to conditionally render features.
 */
export interface FeatureGuardFlags {
    canManageMenus: boolean;
    canCreateOrders: boolean;
    canManagePromotions: boolean;
    canConfigurePrinter: boolean;
    canManageTimedAvailability: boolean;
    canViewRequests: boolean;
    canMessage: boolean;
    canViewMenu: boolean;
    canPlaceOrders: boolean;
    canSubmitRequests: boolean;
    canViewPromotions: boolean;
    canViewTab: boolean;
    canMakePayments: boolean;
    isBasic: boolean;
    isVenue: boolean;
    isPOSAuthority: boolean;
    isTabezaAuthority: boolean;
    venue_mode: 'basic' | 'venue' | null;
    authority_mode: 'pos' | 'tabeza' | null;
}
/**
 * Hook that returns feature availability flags based on current mode
 * @returns Object with boolean flags for each feature
 */
export declare function useFeatureGuard(): FeatureGuardFlags;
