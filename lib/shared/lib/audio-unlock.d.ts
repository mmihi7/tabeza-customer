/**
 * Audio Unlock Manager
 *
 * Manages Web Audio API context and handles browser autoplay policies.
 * Mobile browsers require user interaction before playing audio.
 *
 * Requirements: 1, 3, 6, 14, 15
 */
export type AudioContextState = 'suspended' | 'running' | 'closed';
export interface AudioUnlockState {
    isUnlocked: boolean;
    contextState: AudioContextState;
    lastUnlockAttempt: Date | null;
    unlockMethod: 'user-gesture' | 'auto' | null;
}
export interface AudioUnlockManager {
    isUnlocked(): boolean;
    unlock(): Promise<boolean>;
    needsUnlock(): boolean;
    getState(): AudioContextState;
    getAudioContext(): AudioContext | null;
}
/**
 * Factory function to create an AudioUnlockManager instance
 */
export declare function createAudioUnlockManager(): AudioUnlockManager;
