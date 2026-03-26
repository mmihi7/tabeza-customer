/**
 * Onboarding State Management Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service manages onboarding state persistence, progress tracking, and step validation
 * as defined in the onboarding-flow-redesign specification.
 */
import { VenueConfiguration } from './venue-configuration-validation';
export declare enum OnboardingStep {
    WELCOME = "welcome",
    BASIC_INFO = "basic_info",
    POS_DECISION = "pos_decision",
    MPESA_SETUP = "mpesa_setup",
    PRINTER_SETUP = "printer_setup",
    COMPLETE = "complete"
}
export interface VenueInfo {
    name: string;
    location: string;
    phone?: string;
    email?: string;
}
export interface MpesaConfig {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    businessShortcode?: string;
    consumerKey?: string;
    consumerSecret?: string;
    passkey?: string;
    callbackUrl?: string;
}
export interface PrinterConfig {
    required: boolean;
    configured: boolean;
    testPassed?: boolean;
    printerType?: string;
    connectionMethod?: 'usb' | 'network' | 'bluetooth';
}
export interface OnboardingProgress {
    id: string;
    barId: string;
    currentStep: OnboardingStep;
    venueMode: 'basic' | 'venue' | null;
    authorityMode: 'pos' | 'tabeza' | null;
    completedSteps: OnboardingStep[];
    venueInfo: Partial<VenueInfo>;
    mpesaConfig?: Partial<MpesaConfig>;
    printerConfig?: Partial<PrinterConfig>;
    isComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}
export interface VenueConfigurationExtended extends VenueConfiguration {
    venueInfo: VenueInfo;
    mpesaConfig?: MpesaConfig;
    printerConfig?: PrinterConfig;
    onboardingProgress?: OnboardingProgress;
}
export interface OnboardingValidation {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    requiredSteps: OnboardingStep[];
    canProceed: boolean;
    nextStep?: OnboardingStep;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    severity: 'error' | 'warning';
}
export interface ValidationWarning {
    field: string;
    message: string;
    code: string;
    suggestion?: string;
}
export interface StepValidationResult {
    isValid: boolean;
    canProceed: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    nextStep?: OnboardingStep;
}
export declare class OnboardingStateManager {
    private static readonly STORAGE_KEY_PREFIX;
    private static readonly PROGRESS_EXPIRY_HOURS;
    /**
     * Create new onboarding progress
     */
    static createProgress(barId: string, initialStep?: OnboardingStep): OnboardingProgress;
    /**
     * Save onboarding progress to localStorage and database
     */
    static saveProgress(progress: OnboardingProgress): Promise<void>;
    /**
     * Restore onboarding progress from localStorage or database
     */
    static restoreProgress(barId: string): Promise<OnboardingProgress | null>;
    /**
     * Update progress step and validate transition
     */
    static updateStep(progress: OnboardingProgress, newStep: OnboardingStep): OnboardingProgress;
    /**
     * Validate step transition
     */
    static validateStepTransition(currentStep: OnboardingStep, newStep: OnboardingStep): StepValidationResult;
    /**
     * Validate current progress state
     */
    static validateProgress(progress: OnboardingProgress): OnboardingValidation;
    /**
     * Get next step based on current progress
     */
    static getNextStep(progress: OnboardingProgress): OnboardingStep | undefined;
    /**
     * Clear onboarding progress
     */
    static clearProgress(barId: string): Promise<void>;
    /**
     * Check if progress is expired
     */
    private static isExpired;
    /**
     * Save to localStorage
     */
    private static saveToLocalStorage;
    /**
     * Restore from localStorage
     */
    private static restoreFromLocalStorage;
    /**
     * Clear from localStorage
     */
    private static clearFromLocalStorage;
    /**
     * Save to database (placeholder - implement with actual database calls)
     */
    private static saveToDatabase;
    /**
     * Restore from database (placeholder - implement with actual database calls)
     */
    private static restoreFromDatabase;
    /**
     * Clear from database (placeholder - implement with actual database calls)
     */
    private static clearFromDatabase;
}
export declare function createOnboardingProgress(barId: string): OnboardingProgress;
export declare function saveOnboardingProgress(progress: OnboardingProgress): Promise<void>;
export declare function restoreOnboardingProgress(barId: string): Promise<OnboardingProgress | null>;
export declare function clearOnboardingProgress(barId: string): Promise<void>;
export declare function validateOnboardingProgress(progress: OnboardingProgress): OnboardingValidation;
export declare function updateOnboardingStep(progress: OnboardingProgress, newStep: OnboardingStep): OnboardingProgress;
