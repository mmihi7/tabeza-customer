/**
 * Onboarding Operations Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service handles all database operations related to venue onboarding
 * with comprehensive error handling, retry logic, and user-friendly messaging.
 */
import { DatabaseOperationResult } from './database-error-handler';
import { type VenueConfiguration } from './venue-configuration-validation';
export interface OnboardingProgress {
    step: 'mode' | 'authority' | 'summary';
    selectedMode: 'basic' | 'venue' | null;
    selectedAuthority: 'pos' | 'tabeza' | null;
    timestamp: number;
    barId?: string;
}
export interface VenueConfigurationInput {
    venue_mode: 'basic' | 'venue';
    authority_mode: 'pos' | 'tabeza';
    pos_integration_enabled?: boolean;
    printer_required?: boolean;
    authority_configured_at?: string;
    mode_last_changed_at?: string;
}
export interface VenueData {
    id: string;
    name: string;
    onboarding_completed: boolean | null;
    venue_mode: 'basic' | 'venue' | null;
    authority_mode: 'pos' | 'tabeza' | null;
    pos_integration_enabled?: boolean;
    printer_required?: boolean;
    authority_configured_at?: string;
    mode_last_changed_at?: string;
}
export interface OnboardingCompletionData {
    venue_mode: 'basic' | 'venue';
    authority_mode: 'pos' | 'tabeza';
    pos_integration_enabled: boolean;
    printer_required: boolean;
    onboarding_completed: boolean;
    authority_configured_at: string;
    mode_last_changed_at: string;
}
export interface MigrationResult {
    migration_id: string;
    venues_migrated: number;
    migration_status: string;
    error_message: string | null;
}
/**
 * Check if a venue needs onboarding
 */
export declare function checkOnboardingStatus(supabaseClient: any, barId: string): Promise<DatabaseOperationResult<{
    needsOnboarding: boolean;
    venue: VenueData | null;
}>>;
/**
 * Complete venue onboarding with configuration
 */
export declare function completeOnboarding(supabaseClient: any, barId: string, configuration: VenueConfigurationInput, userContext?: {
    user_id?: string;
    session_id?: string;
    user_agent?: string;
    ip_address?: string;
    request_id?: string;
}): Promise<DatabaseOperationResult<VenueData>>;
/**
 * Update venue configuration after onboarding
 */
export declare function updateVenueConfiguration(supabaseClient: any, barId: string, currentConfig: VenueConfiguration, newConfig: VenueConfigurationInput, userContext?: {
    user_id?: string;
    session_id?: string;
    user_agent?: string;
    ip_address?: string;
    request_id?: string;
    change_reason?: string;
}): Promise<DatabaseOperationResult<VenueData>>;
/**
 * Migrate existing venue to onboarding system
 */
export declare function migrateExistingVenue(supabaseClient: any, barId: string, userContext?: {
    user_id?: string;
    session_id?: string;
    user_agent?: string;
    ip_address?: string;
    request_id?: string;
}): Promise<DatabaseOperationResult<{
    migrationCompleted: boolean;
    venue: VenueData;
}>>;
/**
 * Save onboarding progress to prevent data loss
 */
export declare function saveOnboardingProgress(progress: OnboardingProgress): void;
/**
 * Restore onboarding progress
 */
export declare function restoreOnboardingProgress(barId?: string): OnboardingProgress | null;
/**
 * Clear onboarding progress
 */
export declare function clearOnboardingProgress(barId?: string): void;
/**
 * Create user-friendly error message for onboarding operations
 */
export declare function createOnboardingErrorMessage(result: DatabaseOperationResult, operation: string): string;
/**
 * Validate onboarding prerequisites
 */
export declare function validateOnboardingPrerequisites(supabaseClient: any, barId: string): Promise<DatabaseOperationResult<{
    canProceed: boolean;
    issues: string[];
}>>;
