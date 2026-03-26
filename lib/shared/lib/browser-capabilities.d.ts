/**
 * Browser Capabilities Detection
 *
 * Detects browser capabilities for audio, vibration, and notifications.
 * Identifies browser type, platform, and autoplay policies.
 *
 * Requirements: 7, 8, 9
 */
export type AutoplayPolicy = 'allowed' | 'user-gesture-required' | 'blocked';
export interface BrowserCapabilities {
    audioSupported: boolean;
    vibrationSupported: boolean;
    notificationSupported: boolean;
    autoplayPolicy: AutoplayPolicy;
    isMobile: boolean;
    browser: string;
    platform: string;
}
export interface BrowserCapabilityDetector {
    detect(): BrowserCapabilities;
    isAudioSupported(): boolean;
    isVibrationSupported(): boolean;
    isNotificationSupported(): boolean;
    detectAutoplayPolicy(): Promise<AutoplayPolicy>;
    isMobileDevice(): boolean;
    getBrowserName(): string;
    getPlatform(): string;
}
/**
 * Factory function to create a BrowserCapabilityDetector instance
 */
export declare function createBrowserCapabilityDetector(): BrowserCapabilityDetector;
/**
 * Convenience function to get browser capabilities
 */
export declare function detectBrowserCapabilities(): BrowserCapabilities;
/**
 * Async function to get complete capabilities including autoplay policy
 */
export declare function detectBrowserCapabilitiesAsync(): Promise<BrowserCapabilities>;
