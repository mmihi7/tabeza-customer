/**
 * Feature Guard Hook
 * Task 5: Feature Guard Hook
 *
 * Provides boolean flags for feature availability based on mode configuration.
 * Used throughout the application to conditionally render features.
 */
'use client';
import { useMemo } from 'react';
import { useModeConfig } from '../contexts/ModeContext';
/**
 * Hook that returns feature availability flags based on current mode
 * @returns Object with boolean flags for each feature
 */
export function useFeatureGuard() {
    const { config } = useModeConfig();
    return useMemo(() => {
        if (!config) {
            // Return safe defaults when config is not loaded
            return {
                // Staff features - all disabled by default
                canManageMenus: false,
                canCreateOrders: false,
                canManagePromotions: false,
                canConfigurePrinter: false,
                canManageTimedAvailability: false,
                canViewRequests: false,
                canMessage: false,
                // Customer features - all disabled by default
                canViewMenu: false,
                canPlaceOrders: false,
                canSubmitRequests: false,
                canViewPromotions: false,
                // Universal features - always available
                canViewTab: true,
                canMakePayments: true,
                // Mode indicators
                isBasic: false,
                isVenue: false,
                isPOSAuthority: false,
                isTabezaAuthority: false,
                venue_mode: null,
                authority_mode: null,
            };
        }
        const { isBasic, isVenue, isPOSAuthority, isTabezaAuthority, venue_mode, authority_mode } = config;
        return {
            // Staff features
            canManageMenus: isVenue, // View-only for POS, full for Tabeza
            canCreateOrders: isVenue && isTabezaAuthority,
            canManagePromotions: isVenue && isTabezaAuthority,
            canConfigurePrinter: isPOSAuthority, // Basic or Venue+POS
            canManageTimedAvailability: isVenue,
            canViewRequests: isVenue && isPOSAuthority,
            canMessage: isVenue,
            // Customer features
            canViewMenu: isVenue,
            canPlaceOrders: isVenue && isTabezaAuthority,
            canSubmitRequests: isVenue && isPOSAuthority,
            canViewPromotions: isVenue && isTabezaAuthority,
            // Universal features (always available)
            canViewTab: true,
            canMakePayments: true, // M-Pesa works in all modes
            // Mode indicators
            isBasic,
            isVenue,
            isPOSAuthority,
            isTabezaAuthority,
            venue_mode,
            authority_mode,
        };
    }, [config]);
}
