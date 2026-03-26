/**
 * Network Status Detection Service
 *
 * Provides network connectivity monitoring and status detection
 * for robust offline/online handling during onboarding and other operations.
 */
export interface NetworkStatus {
    isOnline: boolean;
    connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
    downlink: number;
    rtt: number;
    saveData: boolean;
}
export interface NetworkStatusListener {
    (status: NetworkStatus): void;
}
export interface NetworkStatusOptions {
    pollInterval?: number;
    enableDetailedInfo?: boolean;
    onStatusChange?: NetworkStatusListener;
}
/**
 * Network Status Manager
 * Handles network connectivity detection and monitoring
 */
export declare class NetworkStatusManager {
    private listeners;
    private currentStatus;
    private pollInterval;
    private enableDetailedInfo;
    private pollTimer;
    private isMonitoring;
    constructor(options?: NetworkStatusOptions);
    /**
     * Get current network status
     */
    getStatus(): NetworkStatus;
    /**
     * Check if currently online
     */
    isOnline(): boolean;
    /**
     * Check if connection is slow
     */
    isSlowConnection(): boolean;
    /**
     * Add status change listener
     */
    addListener(listener: NetworkStatusListener): void;
    /**
     * Remove status change listener
     */
    removeListener(listener: NetworkStatusListener): void;
    /**
     * Start monitoring network status
     */
    startMonitoring(): void;
    /**
     * Stop monitoring network status
     */
    stopMonitoring(): void;
    /**
     * Manually refresh network status
     */
    refresh(): NetworkStatus;
    /**
     * Test network connectivity with a ping
     */
    testConnectivity(url?: string, timeout?: number): Promise<boolean>;
    /**
     * Detect current network status
     */
    private detectNetworkStatus;
    /**
     * Map connection type from navigator.connection
     */
    private mapConnectionType;
    /**
     * Set up event listeners for network status changes
     */
    private setupEventListeners;
    /**
     * Handle online event
     */
    private handleOnlineEvent;
    /**
     * Handle offline event
     */
    private handleOfflineEvent;
    /**
     * Handle connection change event
     */
    private handleConnectionChange;
    /**
     * Check and update network status, notify listeners if changed
     */
    private checkAndUpdateStatus;
    /**
     * Notify all listeners of status change
     */
    private notifyListeners;
    /**
     * Clean up event listeners
     */
    destroy(): void;
}
/**
 * Get or create global network status manager
 */
export declare function getNetworkStatusManager(options?: NetworkStatusOptions): NetworkStatusManager;
/**
 * Simple hook-like function to get current network status
 */
export declare function getNetworkStatus(): NetworkStatus;
/**
 * Check if currently online
 */
export declare function isOnline(): boolean;
/**
 * Check if connection is slow
 */
export declare function isSlowConnection(): boolean;
/**
 * Test network connectivity
 */
export declare function testConnectivity(url?: string, timeout?: number): Promise<boolean>;
