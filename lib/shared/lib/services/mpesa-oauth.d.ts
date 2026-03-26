/**
 * Simple M-Pesa OAuth Token Service
 * Replaces over-engineered auth service with simple token management
 * Requirements: 2.1
 */
import { type MpesaConfig } from './mpesa-config';
export interface OAuthTokenResponse {
    access_token: string;
    expires_in: string;
}
export interface CachedToken {
    token: string;
    expiresAt: number;
}
export declare class MpesaOAuthError extends Error {
    statusCode?: number | undefined;
    originalError?: any | undefined;
    constructor(message: string, statusCode?: number | undefined, originalError?: any | undefined);
}
/**
 * Get OAuth access token from Safaricom
 * Handles token caching and refresh logic
 * Requirement 2.1: WHEN a customer enters a valid phone number and amount, THE System SHALL initiate an STK Push request to Safaricom
 */
export declare function getOAuthToken(config: MpesaConfig): Promise<string>;
/**
 * Force refresh of OAuth token
 * Bypasses cache and requests new token
 */
export declare function refreshOAuthToken(config: MpesaConfig): Promise<string>;
/**
 * Clear token cache (useful for testing)
 */
export declare function clearTokenCache(): void;
/**
 * Get token cache statistics (useful for monitoring)
 */
export declare function getTokenCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
};
/**
 * Clean up expired tokens from cache
 */
export declare function cleanupExpiredTokens(): void;
