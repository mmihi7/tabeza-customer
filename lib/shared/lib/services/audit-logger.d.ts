/**
 * Comprehensive Audit Logging Service
 * Implements Task 10.1: Add comprehensive audit logging for configuration events
 * Requirements: 7.3, 7.4
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service provides structured audit logging for all configuration events
 * including onboarding completion, configuration changes, and validation failures.
 */
export type ConfigurationAuditAction = 'onboarding_started' | 'onboarding_step_completed' | 'onboarding_completed' | 'onboarding_failed' | 'onboarding_abandoned' | 'configuration_changed' | 'configuration_validation_passed' | 'configuration_validation_failed' | 'configuration_migration_started' | 'configuration_migration_completed' | 'configuration_migration_failed' | 'configuration_reset' | 'admin_override_applied' | 'recovery_operation_started' | 'recovery_operation_completed' | 'configuration_loaded' | 'configuration_cache_updated' | 'configuration_sync_failed';
export interface BaseAuditData {
    bar_id?: string;
    user_id?: string;
    session_id?: string;
    user_agent?: string;
    ip_address?: string;
    request_id?: string;
    operation_duration_ms?: number;
    timestamp?: string;
    [key: string]: any;
}
export interface OnboardingAuditData extends BaseAuditData {
    onboarding_step?: 'mode' | 'authority' | 'summary';
    selected_mode?: 'basic' | 'venue';
    selected_authority?: 'pos' | 'tabeza';
    venue_mode?: 'basic' | 'venue';
    authority_mode?: 'pos' | 'tabeza';
    pos_integration_enabled?: boolean;
    printer_required?: boolean;
    completion_percentage?: number;
    steps_completed?: string[];
    time_spent_seconds?: number;
    error_message?: string;
    error_code?: string;
    validation_errors?: string[];
    form_interactions?: number;
    help_accessed?: boolean;
    retry_attempts?: number;
}
export interface ConfigurationChangeAuditData extends BaseAuditData {
    previous_config?: {
        venue_mode?: 'basic' | 'venue';
        authority_mode?: 'pos' | 'tabeza';
        pos_integration_enabled?: boolean;
        printer_required?: boolean;
        onboarding_completed?: boolean;
    };
    new_config?: {
        venue_mode?: 'basic' | 'venue';
        authority_mode?: 'pos' | 'tabeza';
        pos_integration_enabled?: boolean;
        printer_required?: boolean;
        onboarding_completed?: boolean;
    };
    change_reason?: string;
    change_type?: 'user_initiated' | 'migration' | 'admin_override' | 'system_correction';
    destructive_change?: boolean;
    confirmation_required?: boolean;
    user_confirmed?: boolean;
    validation_warnings?: string[];
    validation_errors?: string[];
    auto_corrections_applied?: string[];
}
export interface ValidationFailureAuditData extends BaseAuditData {
    validation_type?: 'onboarding' | 'configuration_change' | 'migration' | 'system_check';
    attempted_config?: Record<string, any>;
    validation_errors?: string[];
    constraint_violations?: string[];
    business_rule_violations?: string[];
    user_action_blocked?: boolean;
    suggested_corrections?: string[];
    help_provided?: boolean;
    current_config?: Record<string, any>;
    system_constraints?: Record<string, any>;
}
export declare class AuditLogger {
    private supabase;
    private defaultContext;
    constructor(supabaseUrl?: string, supabaseKey?: string, defaultContext?: Partial<BaseAuditData>);
    /**
     * Log onboarding completion event with comprehensive user details
     * Requirements: 7.3 - Log onboarding completion events with user details
     */
    logOnboardingCompletion(data: OnboardingAuditData): Promise<void>;
    /**
     * Log onboarding step completion for progress tracking
     */
    logOnboardingStepCompletion(data: OnboardingAuditData): Promise<void>;
    /**
     * Log onboarding failure with detailed error information
     */
    logOnboardingFailure(data: OnboardingAuditData): Promise<void>;
    /**
     * Log configuration changes with before/after states
     * Requirements: 7.4 - Log configuration changes with before/after states
     */
    logConfigurationChange(data: ConfigurationChangeAuditData): Promise<void>;
    /**
     * Log validation failures with detailed error information
     * Requirements: 7.4 - Log validation failures with detailed error information
     */
    logValidationFailure(data: ValidationFailureAuditData): Promise<void>;
    /**
     * Log migration events with comprehensive details
     */
    logMigrationEvent(action: 'configuration_migration_started' | 'configuration_migration_completed' | 'configuration_migration_failed', data: BaseAuditData & {
        migration_type?: string;
        venues_affected?: number;
        migration_id?: string;
        default_config?: Record<string, any>;
        migration_errors?: string[];
    }): Promise<void>;
    /**
     * Log admin recovery operations
     */
    logRecoveryOperation(action: 'recovery_operation_started' | 'recovery_operation_completed', data: BaseAuditData & {
        recovery_type?: string;
        recovery_reason?: string;
        affected_venues?: string[];
        recovery_steps?: string[];
    }): Promise<void>;
    /**
     * Core logging method that handles all configuration events
     */
    private logConfigurationEvent;
    /**
     * Sanitize audit data to remove sensitive information
     */
    private sanitizeAuditData;
    /**
     * Generate change summary for configuration changes
     */
    private generateChangeSummary;
    /**
     * Assess the impact of configuration changes
     */
    private assessChangeImpact;
    /**
     * Assess validation failure severity
     */
    private assessValidationSeverity;
    /**
     * Determine if system can recover from validation failure
     */
    private canSystemRecover;
    /**
     * Generate recovery suggestions for onboarding failures
     */
    private generateRecoverySuggestions;
    /**
     * Mask email addresses for privacy
     */
    private maskEmail;
}
export declare function getAuditLogger(defaultContext?: Partial<BaseAuditData>): AuditLogger;
/**
 * Convenience functions for common audit events
 */
export declare function logOnboardingCompletion(data: OnboardingAuditData): Promise<void>;
export declare function logConfigurationChange(data: ConfigurationChangeAuditData): Promise<void>;
export declare function logValidationFailure(data: ValidationFailureAuditData): Promise<void>;
export declare function logOnboardingFailure(data: OnboardingAuditData): Promise<void>;
export declare function logMigrationEvent(action: 'configuration_migration_started' | 'configuration_migration_completed' | 'configuration_migration_failed', data: BaseAuditData & {
    migration_type?: string;
    venues_affected?: number;
    migration_id?: string;
    default_config?: Record<string, any>;
    migration_errors?: string[];
}): Promise<void>;
