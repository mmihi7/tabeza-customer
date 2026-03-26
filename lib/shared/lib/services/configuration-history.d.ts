/**
 * Configuration History Service
 * Implements Task 10.2: Add configuration history display
 * Requirements: 7.5
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service provides configuration history retrieval and display functionality
 * for venue configuration audit trails and troubleshooting.
 */
export type ConfigurationHistoryEventType = 'onboarding_completed' | 'configuration_changed' | 'configuration_validation_failed' | 'configuration_migration_completed' | 'configuration_reset' | 'admin_override_applied' | 'recovery_operation_completed';
export interface ConfigurationHistoryEntry {
    id: string;
    action: ConfigurationHistoryEventType;
    bar_id: string;
    staff_id?: string;
    created_at: string;
    details: {
        venue_mode?: 'basic' | 'venue';
        authority_mode?: 'pos' | 'tabeza';
        pos_integration_enabled?: boolean;
        printer_required?: boolean;
        previous_config?: Record<string, any>;
        new_config?: Record<string, any>;
        change_summary?: string;
        change_reason?: string;
        change_type?: 'user_initiated' | 'migration' | 'admin_override' | 'system_correction';
        user_agent?: string;
        ip_address?: string;
        session_id?: string;
        operation_duration_ms?: number;
        completion_timestamp?: string;
        error_message?: string;
        validation_errors?: string[];
        recovery_suggestions?: string[];
        [key: string]: any;
    };
}
export interface FormattedHistoryEntry {
    id: string;
    timestamp: Date;
    action: ConfigurationHistoryEventType;
    title: string;
    description: string;
    details: {
        configurationBefore?: string;
        configurationAfter?: string;
        changeReason?: string;
        userContext?: string;
        errorDetails?: string;
        duration?: string;
    };
    severity: 'info' | 'success' | 'warning' | 'error';
    icon: string;
    user?: {
        id: string;
        email?: string;
    };
}
export interface HistoryQueryOptions {
    barId: string;
    limit?: number;
    offset?: number;
    eventTypes?: ConfigurationHistoryEventType[];
    startDate?: Date;
    endDate?: Date;
    userId?: string;
}
export interface HistoryQueryResult {
    entries: FormattedHistoryEntry[];
    totalCount: number;
    hasMore: boolean;
}
export declare class ConfigurationHistoryService {
    private supabase;
    constructor(supabaseUrl?: string, supabaseKey?: string);
    /**
     * Get configuration history for a venue
     * Requirements: 7.5 - Display configuration history timestamps
     */
    getConfigurationHistory(options: HistoryQueryOptions): Promise<HistoryQueryResult>;
    /**
     * Get recent configuration changes (last 7 days)
     */
    getRecentConfigurationChanges(barId: string): Promise<FormattedHistoryEntry[]>;
    /**
     * Get configuration timestamps for display
     * Requirements: 7.5 - Show timestamps for when configuration was last changed
     */
    getConfigurationTimestamps(barId: string): Promise<{
        authorityConfiguredAt?: Date;
        modeLastChangedAt?: Date;
        onboardingCompletedAt?: Date;
        lastValidationFailure?: Date;
    }>;
    /**
     * Get configuration event types to query
     */
    private getConfigurationEventTypes;
    /**
     * Format history entry for display
     */
    private formatHistoryEntry;
    /**
     * Get display information for action types
     */
    private getActionDisplayInfo;
    /**
     * Format configuration object for display
     */
    private formatConfiguration;
    /**
     * Format user agent for display
     */
    private formatUserAgent;
}
export declare function getConfigurationHistoryService(): ConfigurationHistoryService;
/**
 * Convenience functions for common history operations
 */
export declare function getVenueConfigurationHistory(barId: string, options?: Partial<HistoryQueryOptions>): Promise<HistoryQueryResult>;
export declare function getRecentConfigurationChanges(barId: string): Promise<FormattedHistoryEntry[]>;
export declare function getConfigurationTimestamps(barId: string): Promise<{
    authorityConfiguredAt?: Date;
    modeLastChangedAt?: Date;
    onboardingCompletedAt?: Date;
    lastValidationFailure?: Date;
}>;
