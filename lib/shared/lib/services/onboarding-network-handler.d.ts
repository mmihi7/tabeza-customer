/**
 * Onboarding Network Handler Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * Provides network-aware onboarding operations with retry queue support,
 * offline state management, and graceful error handling.
 */
import { NetworkStatusListener } from './network-status';
import { type OnboardingProgress, type VenueData, type VenueConfigurationInput } from './onboarding-operations';
import { type VenueConfiguration } from './venue-configuration-validation';
export interface NetworkAwareOnboardingOptions {
    enableRetryQueue?: boolean;
    maxRetries?: number;
    enableProgressPersistence?: boolean;
    onNetworkStatusChange?: NetworkStatusListener;
    onOperationQueued?: (operationType: string, operationId: string) => void;
    onOperationRetried?: (operationType: string, attempt: number) => void;
    onOperationCompleted?: (operationType: string, result: any) => void;
}
export interface OnboardingNetworkState {
    isOnline: boolean;
    isSlowConnection: boolean;
    queuedOperations: number;
    lastNetworkChange: number;
    connectionType: string;
    effectiveType: string;
}
export interface NetworkAwareOperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    isQueued?: boolean;
    queueId?: string;
    networkStatus: OnboardingNetworkState;
    canRetry: boolean;
}
/**
 * Network-Aware Onboarding Manager
 * Handles onboarding operations with network error handling and retry logic
 */
export declare class NetworkAwareOnboardingManager {
    private networkManager;
    private retryQueue;
    private options;
    private supabaseClient;
    private lastNetworkChange;
    constructor(supabaseClient: any, options?: NetworkAwareOnboardingOptions);
    /**
     * Get current network state
     */
    getNetworkState(): OnboardingNetworkState;
    /**
     * Check onboarding status with network awareness
     */
    checkOnboardingStatus(barId: string): Promise<NetworkAwareOperationResult<{
        needsOnboarding: boolean;
        venue: VenueData | null;
    }>>;
    /**
     * Complete onboarding with network awareness and retry queue
     */
    completeOnboarding(barId: string, configuration: VenueConfigurationInput): Promise<NetworkAwareOperationResult<VenueData>>;
    /**
     * Update venue configuration with network awareness
     */
    updateVenueConfiguration(barId: string, currentConfig: VenueConfiguration, newConfig: VenueConfigurationInput): Promise<NetworkAwareOperationResult<VenueData>>;
    /**
     * Migrate existing venue with network awareness
     */
    migrateExistingVenue(barId: string): Promise<NetworkAwareOperationResult<{
        migrationCompleted: boolean;
        venue: VenueData;
    }>>;
    /**
     * Save onboarding progress with network awareness
     */
    saveProgress(progress: OnboardingProgress): void;
    /**
     * Restore onboarding progress
     */
    restoreProgress(barId?: string): OnboardingProgress | null;
    /**
     * Clear onboarding progress
     */
    clearProgress(barId?: string): void;
    /**
     * Get queued operations count
     */
    getQueuedOperationsCount(): number;
    /**
     * Get queued operations by type
     */
    getQueuedOperations(type?: string): any[];
    /**
     * Force process retry queue
     */
    processRetryQueue(): Promise<void>;
    /**
     * Check if error is network-related
     */
    private isNetworkError;
    /**
     * Setup network status monitoring
     */
    private setupNetworkHandling;
    /**
     * Register operation handlers for retry queue
     */
    private registerOperationHandlers;
    /**
     * Clean up resources
     */
    destroy(): void;
}
/**
 * Create network-aware onboarding manager
 */
export declare function createNetworkAwareOnboardingManager(supabaseClient: any, options?: NetworkAwareOnboardingOptions): NetworkAwareOnboardingManager;
