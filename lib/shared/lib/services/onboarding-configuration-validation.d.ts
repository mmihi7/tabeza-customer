/**
 * Onboarding Configuration Validation Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service provides enhanced configuration validation specifically for the onboarding flow,
 * enforcing Core Truth constraints and preventing invalid configurations.
 */
import { VenueConfiguration, ValidationResult } from './venue-configuration-validation';
import { OnboardingProgress, OnboardingStep, ValidationError } from './onboarding-state-management';
export interface OnboardingConfigurationValidation extends ValidationResult {
    canProceedToNextStep: boolean;
    requiredFields: string[];
    nextStep?: OnboardingStep;
    configurationSummary?: ConfigurationSummary;
}
export interface ConfigurationSummary {
    venueMode: 'basic' | 'venue';
    authorityMode: 'pos' | 'tabeza';
    description: string;
    enabledFeatures: string[];
    disabledFeatures: string[];
    requirements: string[];
    theme: 'blue' | 'yellow' | 'green';
}
export interface ConstraintRule {
    name: string;
    description: string;
    validator: (progress: OnboardingProgress) => ValidationError[];
}
/**
 * Onboarding Configuration Validation Service
 *
 * Provides enhanced validation for onboarding flow configurations,
 * ensuring Core Truth constraints are maintained throughout the process.
 */
export declare class OnboardingConfigurationValidator {
    private static readonly CONSTRAINT_RULES;
    /**
     * Validate onboarding configuration
     */
    static validateConfiguration(config: Partial<VenueConfiguration>, progress: OnboardingProgress): OnboardingConfigurationValidation;
    /**
     * Validate required fields for current step
     */
    private static validateRequiredFields;
    /**
     * Generate configuration summary for UI display
     */
    private static generateConfigurationSummary;
    /**
     * Check if configuration is ready for completion
     */
    static isReadyForCompletion(progress: OnboardingProgress): boolean;
    /**
     * Generate final venue configuration from onboarding progress
     */
    static generateFinalConfiguration(progress: OnboardingProgress): VenueConfiguration;
}
