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
import { OnboardingStep } from './onboarding-state-management';
/**
 * Onboarding Configuration Validation Service
 *
 * Provides enhanced validation for onboarding flow configurations,
 * ensuring Core Truth constraints are maintained throughout the process.
 */
export class OnboardingConfigurationValidator {
    /**
     * Validate onboarding configuration
     */
    static validateConfiguration(config, progress) {
        const validationErrors = [];
        const validationWarnings = [];
        const requiredFields = [];
        // Run constraint validation rules
        for (const rule of this.CONSTRAINT_RULES) {
            const ruleErrors = rule.validator(progress);
            validationErrors.push(...ruleErrors);
        }
        // Validate required fields based on current step
        const fieldValidation = this.validateRequiredFields(progress);
        validationErrors.push(...fieldValidation.errors);
        requiredFields.push(...fieldValidation.requiredFields);
        // Generate configuration summary
        const configurationSummary = this.generateConfigurationSummary(progress);
        // Determine if can proceed to next step
        const canProceedToNextStep = validationErrors.length === 0 && requiredFields.length === 0;
        // Convert ValidationError[] to string[] for base interface compatibility
        const errors = validationErrors.map(e => e.message);
        const warnings = validationWarnings.map(w => w.message);
        return {
            isValid: validationErrors.length === 0,
            errors,
            warnings,
            canProceedToNextStep,
            requiredFields,
            configurationSummary
        };
    }
    /**
     * Validate required fields for current step
     */
    static validateRequiredFields(progress) {
        const errors = [];
        const requiredFields = [];
        switch (progress.currentStep) {
            case OnboardingStep.BASIC_INFO:
                if (!progress.venueInfo.name) {
                    requiredFields.push('venue_name');
                    errors.push({
                        field: 'venue_name',
                        message: 'Venue name is required',
                        code: 'VENUE_NAME_REQUIRED',
                        severity: 'error'
                    });
                }
                if (!progress.venueInfo.location) {
                    requiredFields.push('venue_location');
                    errors.push({
                        field: 'venue_location',
                        message: 'Venue location is required',
                        code: 'VENUE_LOCATION_REQUIRED',
                        severity: 'error'
                    });
                }
                break;
            case OnboardingStep.POS_DECISION:
                if (progress.venueMode === 'venue' && !progress.authorityMode) {
                    requiredFields.push('authority_mode');
                    errors.push({
                        field: 'authority_mode',
                        message: 'Authority mode selection is required',
                        code: 'AUTHORITY_MODE_REQUIRED',
                        severity: 'error'
                    });
                }
                break;
            case OnboardingStep.PRINTER_SETUP:
                if ((progress.venueMode === 'basic' || progress.authorityMode === 'pos') &&
                    (!progress.printerConfig || !progress.printerConfig.configured)) {
                    requiredFields.push('printer_config');
                    errors.push({
                        field: 'printer_config',
                        message: 'Printer configuration is required for POS authority',
                        code: 'PRINTER_CONFIG_REQUIRED',
                        severity: 'error'
                    });
                }
                if ((progress.venueMode === 'basic' || progress.authorityMode === 'pos') &&
                    progress.printerConfig &&
                    progress.printerConfig.configured &&
                    !progress.printerConfig.testPassed) {
                    requiredFields.push('printer_drivers');
                    errors.push({
                        field: 'printer_drivers',
                        message: 'Tabeza printer drivers must be installed and tested (download from tabeza.co.ke)',
                        code: 'PRINTER_DRIVERS_REQUIRED',
                        severity: 'error'
                    });
                }
                break;
        }
        return { errors, requiredFields };
    }
    /**
     * Generate configuration summary for UI display
     */
    static generateConfigurationSummary(progress) {
        if (!progress.venueMode || !progress.authorityMode) {
            return undefined;
        }
        const venueMode = progress.venueMode;
        const authorityMode = progress.authorityMode;
        // Determine theme based on configuration
        let theme;
        if (venueMode === 'basic') {
            theme = 'blue';
        }
        else if (venueMode === 'venue' && authorityMode === 'pos') {
            theme = 'yellow';
        }
        else {
            theme = 'green';
        }
        // Generate description
        let description;
        if (venueMode === 'basic') {
            description = 'Transaction & Receipt Bridge - Perfect for established venues with existing POS systems';
        }
        else if (venueMode === 'venue' && authorityMode === 'pos') {
            description = 'Customer Interaction + POS Integration - Full customer features with POS integration';
        }
        else {
            description = 'Full Service Platform - Complete Tabeza solution for customer interaction and ordering';
        }
        // Define enabled/disabled features
        let enabledFeatures;
        let disabledFeatures;
        let requirements;
        if (venueMode === 'basic') {
            enabledFeatures = ['Digital receipts', 'Customer payments', 'Simple dashboard', 'Order history'];
            disabledFeatures = ['Customer ordering', 'Staff ordering', 'Menus', 'Promotions'];
            requirements = ['POS system', 'Thermal printer', 'Tabeza printer drivers (tabeza.co.ke)'];
        }
        else if (venueMode === 'venue' && authorityMode === 'pos') {
            enabledFeatures = ['Customer order requests', 'Two-way messaging', 'Digital receipts', 'Payments'];
            disabledFeatures = ['Staff ordering in Tabeza'];
            requirements = ['POS system', 'Tabeza printer drivers (tabeza.co.ke)'];
        }
        else {
            enabledFeatures = ['Full customer ordering', 'Staff ordering', 'Digital receipts', 'Payments', 'Menus'];
            disabledFeatures = ['POS integration'];
            requirements = [];
        }
        return {
            venueMode,
            authorityMode,
            description,
            enabledFeatures,
            disabledFeatures,
            requirements,
            theme
        };
    }
    /**
     * Check if configuration is ready for completion
     */
    static isReadyForCompletion(progress) {
        const validation = this.validateConfiguration({}, progress);
        return validation.canProceedToNextStep && progress.currentStep === OnboardingStep.COMPLETE;
    }
    /**
     * Generate final venue configuration from onboarding progress
     */
    static generateFinalConfiguration(progress) {
        if (!progress.venueMode || !progress.authorityMode) {
            throw new Error('Cannot generate final configuration: venue mode and authority mode are required');
        }
        return {
            venue_mode: progress.venueMode,
            authority_mode: progress.authorityMode,
            pos_integration_enabled: progress.authorityMode === 'pos',
            printer_required: progress.authorityMode === 'pos',
            onboarding_completed: progress.isComplete
        };
    }
}
// Core Truth constraint rules
OnboardingConfigurationValidator.CONSTRAINT_RULES = [
    {
        name: 'basic_mode_pos_authority',
        description: 'Basic mode must use POS authority',
        validator: (progress) => {
            const errors = [];
            if (progress.venueMode === 'basic' && progress.authorityMode !== 'pos') {
                errors.push({
                    field: 'authority_mode',
                    message: 'Basic mode requires POS authority',
                    code: 'BASIC_MODE_REQUIRES_POS',
                    severity: 'error'
                });
            }
            return errors;
        }
    },
    {
        name: 'venue_mode_valid_authority',
        description: 'Venue mode must use either POS or Tabeza authority',
        validator: (progress) => {
            const errors = [];
            if (progress.venueMode === 'venue' &&
                progress.authorityMode &&
                !['pos', 'tabeza'].includes(progress.authorityMode)) {
                errors.push({
                    field: 'authority_mode',
                    message: 'Venue mode requires either POS or Tabeza authority',
                    code: 'VENUE_MODE_INVALID_AUTHORITY',
                    severity: 'error'
                });
            }
            return errors;
        }
    },
    {
        name: 'printer_required_for_pos',
        description: 'POS authority requires printer configuration and Tabeza drivers',
        validator: (progress) => {
            const errors = [];
            if (progress.authorityMode === 'pos' &&
                (!progress.printerConfig || !progress.printerConfig.configured)) {
                errors.push({
                    field: 'printer_config',
                    message: 'POS authority requires printer configuration and Tabeza drivers from tabeza.co.ke',
                    code: 'POS_REQUIRES_PRINTER',
                    severity: 'error'
                });
            }
            return errors;
        }
    },
    {
        name: 'printer_driver_validation',
        description: 'Tabeza printer drivers must be installed for POS integration',
        validator: (progress) => {
            const errors = [];
            if (progress.authorityMode === 'pos' &&
                progress.printerConfig &&
                progress.printerConfig.configured &&
                !progress.printerConfig.testPassed) {
                errors.push({
                    field: 'printer_drivers',
                    message: 'Tabeza printer drivers must be installed and tested. Download from tabeza.co.ke',
                    code: 'PRINTER_DRIVERS_REQUIRED',
                    severity: 'error'
                });
            }
            return errors;
        }
    },
    {
        name: 'basic_mode_printer_mandatory',
        description: 'Basic mode always requires printer setup',
        validator: (progress) => {
            const errors = [];
            if (progress.venueMode === 'basic' &&
                (!progress.printerConfig || !progress.printerConfig.configured || !progress.printerConfig.testPassed)) {
                errors.push({
                    field: 'printer_config',
                    message: 'Basic mode requires complete printer setup with Tabeza drivers from tabeza.co.ke',
                    code: 'BASIC_MODE_PRINTER_MANDATORY',
                    severity: 'error'
                });
            }
            return errors;
        }
    }
];
