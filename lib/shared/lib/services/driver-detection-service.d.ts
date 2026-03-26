/**
 * Driver Detection Service
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This service implements web-based platform detection and driver installation
 * guidance for Tabeza printer drivers. It uses browser APIs to detect the
 * operating system and provides appropriate installation instructions.
 *
 * Requirements: 2.1, 2.2, 2.3
 */
import { Platform, DriverDetectionResult, InstallationGuidance, DriverStatus } from './printer-service-types';
/**
 * Detects the user's platform using browser APIs
 *
 * Uses navigator.userAgent and navigator.platform to determine the operating system.
 * This is a web-compatible approach that works in all modern browsers.
 *
 * @returns Platform information including OS, browser, version, and driver support
 */
export declare function detectPlatform(): Platform;
/**
 * Generates installation guidance for a specific platform
 *
 * Provides OS-specific download links, installation instructions,
 * troubleshooting steps, and verification steps for Tabeza printer drivers.
 *
 * @param platform - The detected platform information
 * @returns Installation guidance with download URL and instructions
 * @throws UnsupportedPlatformError if the platform doesn't support drivers
 */
export declare function generateInstallationGuidance(platform: Platform): InstallationGuidance;
/**
 * Checks driver availability and status
 *
 * Attempts to detect if Tabeza printer drivers are installed by:
 * 1. Checking for the virtual printer service API
 * 2. Querying system printers (if available)
 * 3. Testing connectivity to the driver relay endpoint
 *
 * @returns Driver status information
 */
export declare function checkDriverAvailability(): Promise<DriverStatus>;
/**
 * Performs complete driver detection workflow
 *
 * Combines platform detection, driver status checking, and installation
 * guidance generation into a single comprehensive result.
 *
 * @param driversRequired - Whether drivers are required for the current configuration
 * @returns Complete driver detection result with guidance
 */
export declare function performDriverDetection(driversRequired: boolean): Promise<DriverDetectionResult>;
/**
 * Validates that a platform supports Tabeza printer drivers
 *
 * @param platform - The platform to validate
 * @returns True if the platform supports drivers, false otherwise
 */
export declare function isPlatformSupported(platform: Platform): boolean;
/**
 * Gets a human-readable platform description
 *
 * @param platform - The platform to describe
 * @returns A user-friendly description of the platform
 */
export declare function getPlatformDescription(platform: Platform): string;
