/**
 * Visual Testing Utilities
 *
 * Shared utilities for visual regression tests to ensure consistency
 * across all test files and provide common functionality.
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 */
import { Page } from '@playwright/test';
export declare const STANDARD_CONFIGURATIONS: {
    readonly BASIC_MODE: {
        readonly venue_mode: "basic";
        readonly authority_mode: "pos";
        readonly pos_integration_enabled: true;
        readonly printer_required: true;
        readonly onboarding_completed: true;
        readonly authority_configured_at: string;
        readonly mode_last_changed_at: string;
    };
    readonly VENUE_POS: {
        readonly venue_mode: "venue";
        readonly authority_mode: "pos";
        readonly pos_integration_enabled: true;
        readonly printer_required: false;
        readonly onboarding_completed: true;
        readonly authority_configured_at: string;
        readonly mode_last_changed_at: string;
    };
    readonly VENUE_TABEZA: {
        readonly venue_mode: "venue";
        readonly authority_mode: "tabeza";
        readonly pos_integration_enabled: false;
        readonly printer_required: false;
        readonly onboarding_completed: true;
        readonly authority_configured_at: string;
        readonly mode_last_changed_at: string;
    };
    readonly INCOMPLETE: {
        readonly venue_mode: null;
        readonly authority_mode: null;
        readonly pos_integration_enabled: false;
        readonly printer_required: false;
        readonly onboarding_completed: false;
    };
};
export declare const SCREEN_SIZES: {
    readonly MOBILE_SMALL: {
        readonly width: 320;
        readonly height: 568;
        readonly name: "Mobile Small";
    };
    readonly MOBILE_LARGE: {
        readonly width: 414;
        readonly height: 896;
        readonly name: "Mobile Large";
    };
    readonly TABLET_SMALL: {
        readonly width: 768;
        readonly height: 1024;
        readonly name: "Tablet Small";
    };
    readonly TABLET_LARGE: {
        readonly width: 1024;
        readonly height: 1366;
        readonly name: "Tablet Large";
    };
    readonly DESKTOP_SMALL: {
        readonly width: 1366;
        readonly height: 768;
        readonly name: "Desktop Small";
    };
    readonly DESKTOP_LARGE: {
        readonly width: 1920;
        readonly height: 1080;
        readonly name: "Desktop Large";
    };
};
export declare const THEME_EXPECTATIONS: {
    readonly basic: {
        readonly theme: "blue";
        readonly icons: readonly ["🖨️", "📱", "💳"];
        readonly description: "POS Bridge Mode";
        readonly primaryColor: "bg-blue-500";
    };
    readonly 'venue-pos': {
        readonly theme: "yellow";
        readonly icons: readonly ["📋", "🖨️", "💬"];
        readonly description: "Hybrid Workflow Mode";
        readonly primaryColor: "bg-yellow-500";
    };
    readonly 'venue-tabeza': {
        readonly theme: "green";
        readonly icons: readonly ["📋", "💬", "💳", "📊"];
        readonly description: "Full Service Mode";
        readonly primaryColor: "bg-green-500";
    };
};
/**
 * Disable animations for consistent visual testing
 */
export declare function disableAnimations(page: Page): Promise<void>;
/**
 * Mock venue configuration API with specific config
 */
export declare function mockVenueConfiguration(page: Page, config: any): Promise<void>;
/**
 * Mock onboarding API for testing onboarding flows
 */
export declare function mockOnboardingAPI(page: Page, shouldFail?: boolean): Promise<void>;
/**
 * Wait for theme to be applied to the page
 */
export declare function waitForThemeApplication(page: Page, expectedTheme: string): Promise<void>;
/**
 * Wait for component to be fully loaded and stable
 */
export declare function waitForComponentStability(page: Page, selector: string): Promise<void>;
/**
 * Set up standard test environment
 */
export declare function setupTestEnvironment(page: Page): Promise<void>;
/**
 * Take a screenshot with consistent options
 */
export declare function takeStandardScreenshot(element: any, filename: string, options?: {
    fullPage?: boolean;
}): Promise<void>;
/**
 * Test responsive design at all standard breakpoints
 */
export declare function testResponsiveDesign(page: Page, testCallback: (screenSize: typeof SCREEN_SIZES[keyof typeof SCREEN_SIZES]) => Promise<void>): Promise<void>;
/**
 * Simulate network conditions for testing
 */
export declare function simulateNetworkConditions(page: Page, condition?: 'offline' | 'slow' | 'fast'): Promise<void>;
/**
 * Generate test data for venue configurations
 */
export declare function generateTestData(overrides?: Partial<any>): any;
/**
 * Verify theme consistency across elements
 */
export declare function verifyThemeConsistency(page: Page, expectedTheme: keyof typeof THEME_EXPECTATIONS): Promise<void>;
/**
 * Test accessibility features
 */
export declare function testAccessibilityFeatures(page: Page): Promise<void>;
/**
 * Clean up test environment
 */
export declare function cleanupTestEnvironment(page: Page): Promise<void>;
