/**
 * Printer Service Types and Interfaces
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This module defines the core types and interfaces for printer driver detection,
 * ESC/POS protocol communication, and authority-based printer service management.
 */
// ============================================================================
// Error Types
// ============================================================================
export class InvalidAuthorityConfigurationError extends Error {
    constructor(venueMode, authorityMode) {
        super(`Invalid configuration: ${venueMode} mode with ${authorityMode} authority`);
        this.name = 'InvalidAuthorityConfigurationError';
    }
}
export class PrinterRequirementMismatchError extends Error {
    constructor(config) {
        super(`Printer requirement mismatch for configuration: ${JSON.stringify(config)}`);
        this.name = 'PrinterRequirementMismatchError';
    }
}
export class DriverDetectionError extends Error {
    constructor(platform, reason) {
        super(`Driver detection failed for ${platform.os}: ${reason}`);
        this.name = 'DriverDetectionError';
    }
}
export class UnsupportedPlatformError extends Error {
    constructor(platform) {
        super(`Platform ${platform.os} does not support Tabeza printer drivers`);
        this.name = 'UnsupportedPlatformError';
    }
}
export class PrinterConnectionError extends Error {
    constructor(config, reason) {
        super(`Failed to connect to printer ${config.printerName}: ${reason}`);
        this.name = 'PrinterConnectionError';
    }
}
export class ESCPOSProtocolError extends Error {
    constructor(command, error) {
        super(`ESC/POS protocol error for command ${command.type}: ${error}`);
        this.name = 'ESCPOSProtocolError';
    }
}
export class PrintTestFailureError extends Error {
    constructor(printerName, error) {
        super(`Print test failed for ${printerName}: ${error}`);
        this.name = 'PrintTestFailureError';
    }
}
