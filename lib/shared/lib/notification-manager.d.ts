/**
 * Notification Manager
 *
 * Coordinates notification methods with fallback chain:
 * Audio → Vibration → Visual
 *
 * Requirements: 1, 3, 8, 9, 14, 15
 */
import type { AudioUnlockManager } from './audio-unlock';
import type { BrowserCapabilities } from './browser-capabilities';
export type NotificationMethod = 'audio' | 'vibration' | 'visual';
export type NotificationPriority = 'high' | 'normal' | 'low';
export interface NotificationOptions {
    sound?: 'bell' | 'alert';
    vibrate?: boolean;
    visual?: string;
    priority?: NotificationPriority;
}
export interface NotificationAttempt {
    timestamp: Date;
    type: NotificationMethod;
    success: boolean;
    error?: string;
    fallbackUsed?: NotificationMethod;
}
export interface NotificationManager {
    playSound(soundType: 'bell' | 'alert'): Promise<boolean>;
    vibrate(pattern?: number[]): boolean;
    showVisual(message: string): void;
    notify(options: NotificationOptions): Promise<void>;
    getAttempts(): NotificationAttempt[];
    getCapabilities(): BrowserCapabilities;
}
/**
 * Factory function to create a NotificationManager instance
 */
export declare function createNotificationManager(audioManager: AudioUnlockManager): NotificationManager;
