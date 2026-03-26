/**
 * Audio Unlock Manager
 *
 * Manages Web Audio API context and handles browser autoplay policies.
 * Mobile browsers require user interaction before playing audio.
 *
 * Requirements: 1, 3, 6, 14, 15
 */
class AudioUnlockManagerImpl {
    constructor() {
        this.audioContext = null;
        this.unlocked = false;
        this.unlockAttempts = 0;
        this.initializeAudioContext();
    }
    initializeAudioContext() {
        try {
            // Check if Web Audio API is supported
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('🔇 Web Audio API not supported in this browser');
                return;
            }
            this.audioContext = new AudioContextClass();
            console.log('🔊 AudioContext initialized:', {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate
            });
        }
        catch (error) {
            console.error('❌ Failed to initialize AudioContext:', error);
        }
    }
    isUnlocked() {
        if (!this.audioContext)
            return false;
        return this.unlocked && this.audioContext.state === 'running';
    }
    async unlock() {
        this.unlockAttempts++;
        console.log(`🔓 Attempting to unlock audio (attempt ${this.unlockAttempts})...`);
        if (!this.audioContext) {
            console.error('❌ No AudioContext available');
            return false;
        }
        try {
            // If already running, mark as unlocked
            if (this.audioContext.state === 'running') {
                this.unlocked = true;
                console.log('✅ Audio already unlocked');
                return true;
            }
            // Resume the audio context (requires user gesture)
            await this.audioContext.resume();
            // Play a silent sound to fully unlock (iOS Safari workaround)
            await this.playSilentSound();
            this.unlocked = true;
            console.log('✅ Audio unlocked successfully:', {
                state: this.audioContext.state,
                attempts: this.unlockAttempts
            });
            return true;
        }
        catch (error) {
            console.error('❌ Failed to unlock audio:', error);
            return false;
        }
    }
    async playSilentSound() {
        if (!this.audioContext)
            return;
        try {
            // Create a silent buffer
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
            // Wait a tiny bit for the sound to "play"
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        catch (error) {
            console.warn('⚠️ Failed to play silent sound:', error);
        }
    }
    needsUnlock() {
        if (!this.audioContext)
            return false;
        return this.audioContext.state === 'suspended' && !this.unlocked;
    }
    getState() {
        if (!this.audioContext)
            return 'closed';
        return this.audioContext.state;
    }
    getAudioContext() {
        return this.audioContext;
    }
}
/**
 * Factory function to create an AudioUnlockManager instance
 */
export function createAudioUnlockManager() {
    return new AudioUnlockManagerImpl();
}
