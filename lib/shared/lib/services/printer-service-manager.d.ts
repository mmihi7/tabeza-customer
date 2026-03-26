/**
 * Printer Service Manager
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service manages printer driver detection, ESC/POS communication,
 * and printer testing based on venue authority configuration.
 *
 * Printer services are ONLY active for POS authority modes:
 * - Basic mode (POS authority): Printer services REQUIRED
 * - Venue + POS authority: Printer services REQUIRED
 * - Venue + Tabeza authority: Printer services BYPASSED
 */
import { VenueMode, AuthorityMode, VenueConfiguration } from './venue-configuration-validation';
import { Platform, DriverDetectionResult, InstallationGuidance, PrinterConfig, PrinterConnection, TestResult, PrinterStatus, PrinterServiceConfig } from './printer-service-types';
/**
 * Printer Service Manager Interface
 *
 * Main interface for managing printer services with authority-based activation
 */
export interface PrinterServiceManager {
    /**
     * Check if printer service is required for a given configuration
     *
     * @param venueMode - Venue mode (basic or venue)
     * @param authorityMode - Authority mode (pos or tabeza)
     * @returns true if printer service is required, false otherwise
     */
    isServiceRequired(venueMode: VenueMode, authorityMode: AuthorityMode): boolean;
    /**
     * Detect printer drivers on the current platform
     *
     * @returns DriverDetectionResult with platform info and driver status
     */
    detectDrivers(): Promise<DriverDetectionResult>;
    /**
     * Get installation guidance for a specific platform
     *
     * @param platform - Platform information
     * @returns InstallationGuidance with download links and instructions
     */
    getInstallationGuidance(platform: Platform): InstallationGuidance;
    /**
     * Establish connection to a printer (POS authority only)
     *
     * @param config - Printer configuration
     * @returns PrinterConnection if successful
     * @throws Error if authority mode doesn't support printer connection
     */
    establishConnection(config: PrinterConfig): Promise<PrinterConnection>;
    /**
     * Test printer connection and print quality (POS authority only)
     *
     * @param connection - Printer connection to test
     * @returns TestResult with success status and print quality
     * @throws Error if authority mode doesn't support printer testing
     */
    testPrinter(connection: PrinterConnection): Promise<TestResult>;
    /**
     * Monitor printer status (POS authority only)
     *
     * @param connection - Printer connection to monitor
     * @returns Observable stream of printer status updates
     * @throws Error if authority mode doesn't support status monitoring
     */
    monitorStatus(connection: PrinterConnection): AsyncIterable<PrinterStatus>;
    /**
     * Get current service configuration
     *
     * @returns PrinterServiceConfig
     */
    getServiceConfig(): PrinterServiceConfig;
    /**
     * Update service configuration based on venue configuration
     *
     * @param config - New venue configuration
     */
    updateConfiguration(config: VenueConfiguration): void;
}
/**
 * Default implementation of PrinterServiceManager
 */
export declare class DefaultPrinterServiceManager implements PrinterServiceManager {
    private authorityValidator;
    private serviceConfig;
    constructor(initialConfig: VenueConfiguration);
    /**
     * Check if printer service is required based on authority mode
     *
     * Core Truth Rule: Printer service required ONLY for POS authority
     */
    isServiceRequired(venueMode: VenueMode, authorityMode: AuthorityMode): boolean;
    /**
     * Detect printer drivers on the current platform
     *
     * This is a placeholder implementation that will be enhanced in subsequent tasks
     */
    detectDrivers(): Promise<DriverDetectionResult>;
    /**
     * Detect platform using browser APIs
     *
     * This is a basic implementation that will be enhanced in Task 2
     */
    private detectPlatform;
    /**
     * Get installation guidance for a platform
     */
    getInstallationGuidance(platform: Platform): InstallationGuidance;
    /**
     * Establish connection to a printer
     *
     * Only available for POS authority modes
     * This is a placeholder that will be implemented in Task 3
     */
    establishConnection(config: PrinterConfig): Promise<PrinterConnection>;
    /**
     * Test printer connection
     *
     * Only available for POS authority modes
     * This is a placeholder that will be implemented in Task 5
     */
    testPrinter(connection: PrinterConnection): Promise<TestResult>;
    /**
     * Monitor printer status
     *
     * Only available for POS authority modes
     * This is a placeholder that will be implemented in Task 6
     */
    monitorStatus(connection: PrinterConnection): AsyncIterable<PrinterStatus>;
    /**
     * Get current service configuration
     */
    getServiceConfig(): PrinterServiceConfig;
    /**
     * Update service configuration
     */
    updateConfiguration(config: VenueConfiguration): void;
}
/**
 * Create a new printer service manager instance
 *
 * @param config - Initial venue configuration
 * @returns PrinterServiceManager instance
 */
export declare function createPrinterServiceManager(config: VenueConfiguration): PrinterServiceManager;
/**
 * Utility function to check if printer service should be initialized
 *
 * @param venueMode - Venue mode
 * @param authorityMode - Authority mode
 * @returns true if printer service should be initialized, false otherwise
 */
export declare function shouldInitializePrinterService(venueMode: VenueMode, authorityMode: AuthorityMode): boolean;
