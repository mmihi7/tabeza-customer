/**
 * Printer Driver Queries
 *
 * CORE TRUTH: Manual service always exists.
 * Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 *
 * This module provides query functions for retrieving printer driver information
 * from the database, including active driver detection and status monitoring.
 */
export interface PrinterDriver {
    id: string;
    bar_id: string;
    driver_id: string;
    version: string;
    status: 'online' | 'offline' | 'error';
    last_heartbeat: string;
    first_seen: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}
export interface DriverQueryResult {
    data: PrinterDriver[] | null;
    error: Error | null;
}
/**
 * Get active drivers for a bar
 * Returns all drivers with records - if a record exists, the driver is considered active
 * Stale drivers are cleaned up by the daily cleanup job
 *
 * @param barId - The bar ID to query drivers for
 * @returns Promise with active drivers data or error
 */
export declare function getActiveDrivers(barId: string): Promise<DriverQueryResult>;
/**
 * Get all drivers for a bar (including stale/inactive)
 * Useful for debugging and administrative purposes
 *
 * @param barId - The bar ID to query drivers for
 * @returns Promise with all drivers data or error
 */
export declare function getAllDrivers(barId: string): Promise<DriverQueryResult>;
/**
 * Check if a driver is currently active
 * Always returns true if called - if a driver record exists, it's active
 *
 * @param lastHeartbeat - ISO timestamp of last heartbeat (unused, kept for API compatibility)
 * @returns true (always - driver record existence means it's active)
 */
export declare function isDriverActive(lastHeartbeat: string): boolean;
/**
 * Get time since last heartbeat in human-readable format
 *
 * @param lastHeartbeat - ISO timestamp of last heartbeat
 * @returns Human-readable time string (e.g., "2 minutes ago")
 */
export declare function getTimeSinceHeartbeat(lastHeartbeat: string): string;
/**
 * Get driver status with additional metadata
 *
 * @param driver - Printer driver object
 * @returns Enhanced driver status information
 */
export declare function getDriverStatus(driver: PrinterDriver): {
    isActive: boolean;
    timeSince: string;
    statusText: string;
    statusColor: string;
};
