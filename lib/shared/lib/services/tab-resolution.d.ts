/**
 * Robust Tab Resolution Service
 * Implements multiple strategies to resolve tab lookup failures
 * Addresses the "Tab not found" error with systematic recovery
 */
export interface Tab {
    id: string;
    bar_id: string;
    tab_number: number;
    status: 'open' | 'overdue' | 'closed';
    owner_identifier: string;
    opened_at: string;
}
export interface TabResolutionResult {
    success: boolean;
    tab?: Tab;
    error?: string;
    strategy?: string;
    repaired?: boolean;
}
export declare class TabNotFoundError extends Error {
    strategy?: string | undefined;
    originalError?: any | undefined;
    constructor(message: string, strategy?: string | undefined, originalError?: any | undefined);
}
/**
 * Enhanced tab resolution with multiple fallback strategies
 */
export declare class TabResolver {
    private supabase;
    /**
     * Main resolution method - tries multiple strategies in order
     */
    resolveTab(tabId: string, deviceId?: string): Promise<TabResolutionResult>;
    /**
     * Strategy 1: Direct tab lookup by ID
     */
    private directTabLookup;
    /**
     * Strategy 2: Cross-reference using device ID
     */
    private deviceIdCrossReference;
    /**
     * Strategy 3: Repair corrupted session data
     */
    private sessionDataRepair;
    /**
     * Strategy 4: Recent tab fallback (with safety checks)
     */
    private recentTabFallback;
    /**
     * Validate tab data integrity
     */
    validateTabData(tab: any): boolean;
    /**
     * Get device ID from various storage locations
     */
    getDeviceIdFromStorage(): string | null;
}
/**
 * Convenience function for quick tab resolution
 */
export declare function resolveTabForPayment(tabId: string): Promise<Tab>;
/**
 * Enhanced error messages based on resolution strategy
 */
export declare function getTabNotFoundErrorMessage(strategy?: string, error?: string): string;
