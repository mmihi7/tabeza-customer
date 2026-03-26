/**
 * Retry Queue Service
 *
 * Handles queuing and retrying of failed operations during network interruptions.
 * Specifically designed for onboarding operations but can be used for other operations.
 */
import { getNetworkStatusManager } from './network-status';
/**
 * Retry Queue Manager
 * Manages queued operations and retries them when network is restored
 */
export class RetryQueueManager {
    constructor(options = {}) {
        this.queue = new Map();
        this.handlers = new Map();
        this.isProcessing = false;
        this.processTimer = null;
        this.networkManager = getNetworkStatusManager();
        /**
         * Handle network status changes
         */
        this.handleNetworkStatusChange = (status) => {
            if (status.isOnline && !this.isProcessing && !this.isEmpty()) {
                console.log('Network restored, starting queue processing');
                this.startProcessing();
            }
            else if (!status.isOnline && this.isProcessing) {
                console.log('Network lost, stopping queue processing');
                this.stopProcessing();
            }
        };
        this.options = {
            maxRetries: options.maxRetries || 3,
            baseDelayMs: options.baseDelayMs || 1000,
            maxDelayMs: options.maxDelayMs || 30000,
            backoffMultiplier: options.backoffMultiplier || 2,
            enablePersistence: options.enablePersistence ?? true,
            storageKey: options.storageKey || 'tabeza_retry_queue',
            onOperationSuccess: options.onOperationSuccess || (() => { }),
            onOperationFailed: options.onOperationFailed || (() => { }),
            onQueueEmpty: options.onQueueEmpty || (() => { })
        };
        // Load persisted queue
        if (this.options.enablePersistence) {
            this.loadQueue();
        }
        // Listen for network status changes
        this.networkManager.addListener(this.handleNetworkStatusChange);
        // Start processing if online
        if (this.networkManager.isOnline()) {
            this.startProcessing();
        }
    }
    /**
     * Register an operation handler
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }
    /**
     * Add operation to queue
     */
    enqueue(type, data, options = {}) {
        const id = options.id || this.generateId();
        const now = Date.now();
        const operation = {
            id,
            type,
            data,
            timestamp: now,
            retryCount: 0,
            maxRetries: options.maxRetries || this.options.maxRetries,
            nextRetryAt: now,
            priority: options.priority || 'normal',
        };
        this.queue.set(id, operation);
        this.persistQueue();
        // Start processing if we're online and not already processing
        if (this.networkManager.isOnline() && !this.isProcessing) {
            this.startProcessing();
        }
        return id;
    }
    /**
     * Remove operation from queue
     */
    dequeue(id) {
        const removed = this.queue.delete(id);
        if (removed) {
            this.persistQueue();
        }
        return removed;
    }
    /**
     * Get operation by ID
     */
    getOperation(id) {
        return this.queue.get(id);
    }
    /**
     * Get all operations
     */
    getAllOperations() {
        return Array.from(this.queue.values());
    }
    /**
     * Get operations by type
     */
    getOperationsByType(type) {
        return Array.from(this.queue.values()).filter(op => op.type === type);
    }
    /**
     * Get queue size
     */
    getQueueSize() {
        return this.queue.size;
    }
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.queue.size === 0;
    }
    /**
     * Clear all operations
     */
    clear() {
        this.queue.clear();
        this.persistQueue();
    }
    /**
     * Clear operations by type
     */
    clearByType(type) {
        const toRemove = Array.from(this.queue.entries())
            .filter(([_, op]) => op.type === type)
            .map(([id, _]) => id);
        toRemove.forEach(id => this.queue.delete(id));
        this.persistQueue();
    }
    /**
     * Start processing queue
     */
    startProcessing() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        this.processQueue();
    }
    /**
     * Stop processing queue
     */
    stopProcessing() {
        this.isProcessing = false;
        if (this.processTimer) {
            clearTimeout(this.processTimer);
            this.processTimer = null;
        }
    }
    /**
     * Force process queue immediately
     */
    async processNow() {
        if (!this.networkManager.isOnline()) {
            throw new Error('Cannot process queue while offline');
        }
        await this.processQueue();
    }
    /**
     * Process the queue
     */
    async processQueue() {
        if (!this.isProcessing || !this.networkManager.isOnline()) {
            return;
        }
        const now = Date.now();
        const readyOperations = Array.from(this.queue.values())
            .filter(op => op.nextRetryAt <= now)
            .sort((a, b) => {
            // Sort by priority first, then by timestamp
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return a.timestamp - b.timestamp;
        });
        if (readyOperations.length === 0) {
            // Schedule next check
            this.scheduleNextProcess();
            return;
        }
        // Process one operation at a time to avoid overwhelming the system
        const operation = readyOperations[0];
        await this.processOperation(operation);
        // Continue processing if still online and processing
        if (this.isProcessing && this.networkManager.isOnline()) {
            // Small delay to prevent tight loops
            this.processTimer = setTimeout(() => this.processQueue(), 100);
        }
    }
    /**
     * Process a single operation
     */
    async processOperation(operation) {
        const handler = this.handlers.get(operation.type);
        if (!handler) {
            console.error(`No handler registered for operation type: ${operation.type}`);
            this.dequeue(operation.id);
            return;
        }
        try {
            console.log(`Processing queued operation: ${operation.type} (attempt ${operation.retryCount + 1})`);
            const result = await handler(operation.data);
            // Operation succeeded
            console.log(`Queued operation succeeded: ${operation.type}`);
            this.dequeue(operation.id);
            this.options.onOperationSuccess(operation, result);
            // Check if queue is empty
            if (this.isEmpty()) {
                this.options.onQueueEmpty();
            }
        }
        catch (error) {
            console.error(`Queued operation failed: ${operation.type}`, error);
            operation.retryCount++;
            operation.lastError = error.message || 'Unknown error';
            if (operation.retryCount >= operation.maxRetries) {
                // Max retries reached, remove from queue
                console.error(`Operation ${operation.type} failed after ${operation.maxRetries} attempts`);
                this.dequeue(operation.id);
                this.options.onOperationFailed(operation, error);
            }
            else {
                // Schedule retry with exponential backoff
                const delay = Math.min(this.options.baseDelayMs * Math.pow(this.options.backoffMultiplier, operation.retryCount - 1), this.options.maxDelayMs);
                operation.nextRetryAt = Date.now() + delay;
                this.persistQueue();
                console.log(`Scheduling retry for ${operation.type} in ${delay}ms (attempt ${operation.retryCount + 1}/${operation.maxRetries})`);
            }
        }
    }
    /**
     * Schedule next queue processing
     */
    scheduleNextProcess() {
        if (!this.isProcessing)
            return;
        const now = Date.now();
        const nextOperation = Array.from(this.queue.values())
            .filter(op => op.nextRetryAt > now)
            .sort((a, b) => a.nextRetryAt - b.nextRetryAt)[0];
        if (nextOperation) {
            const delay = Math.max(nextOperation.nextRetryAt - now, 1000); // At least 1 second
            this.processTimer = setTimeout(() => this.processQueue(), delay);
        }
        else if (this.isEmpty()) {
            this.stopProcessing();
            this.options.onQueueEmpty();
        }
    }
    /**
     * Generate unique ID for operations
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Persist queue to storage
     */
    persistQueue() {
        if (!this.options.enablePersistence || typeof localStorage === 'undefined') {
            return;
        }
        try {
            const queueData = Array.from(this.queue.entries());
            localStorage.setItem(this.options.storageKey, JSON.stringify(queueData));
        }
        catch (error) {
            console.warn('Failed to persist retry queue:', error);
        }
    }
    /**
     * Load queue from storage
     */
    loadQueue() {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (stored) {
                const queueData = JSON.parse(stored);
                this.queue = new Map(queueData);
                // Clean up old operations (older than 24 hours)
                const maxAge = 24 * 60 * 60 * 1000;
                const now = Date.now();
                for (const [id, operation] of this.queue.entries()) {
                    if (now - operation.timestamp > maxAge) {
                        this.queue.delete(id);
                    }
                }
                this.persistQueue();
            }
        }
        catch (error) {
            console.warn('Failed to load retry queue:', error);
            // Clear corrupted data
            localStorage.removeItem(this.options.storageKey);
        }
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.stopProcessing();
        this.networkManager.removeListener(this.handleNetworkStatusChange);
        this.queue.clear();
        this.handlers.clear();
    }
}
/**
 * Global retry queue manager instance
 */
let globalRetryQueue = null;
/**
 * Get or create global retry queue manager
 */
export function getRetryQueueManager(options) {
    if (!globalRetryQueue) {
        globalRetryQueue = new RetryQueueManager(options);
    }
    return globalRetryQueue;
}
/**
 * Convenience function to enqueue an operation
 */
export function enqueueOperation(type, data, options) {
    return getRetryQueueManager().enqueue(type, data, options);
}
/**
 * Convenience function to register a handler
 */
export function registerRetryHandler(type, handler) {
    getRetryQueueManager().registerHandler(type, handler);
}
