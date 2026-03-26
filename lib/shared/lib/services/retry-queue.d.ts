/**
 * Retry Queue Service
 *
 * Handles queuing and retrying of failed operations during network interruptions.
 * Specifically designed for onboarding operations but can be used for other operations.
 */
export interface QueuedOperation {
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
    nextRetryAt: number;
    lastError?: string;
    priority: 'low' | 'normal' | 'high';
}
export interface RetryQueueOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    enablePersistence?: boolean;
    storageKey?: string;
    onOperationSuccess?: (operation: QueuedOperation, result: any) => void;
    onOperationFailed?: (operation: QueuedOperation, error: any) => void;
    onQueueEmpty?: () => void;
}
export interface OperationHandler {
    (data: any): Promise<any>;
}
/**
 * Retry Queue Manager
 * Manages queued operations and retries them when network is restored
 */
export declare class RetryQueueManager {
    private queue;
    private handlers;
    private options;
    private isProcessing;
    private processTimer;
    private networkManager;
    constructor(options?: RetryQueueOptions);
    /**
     * Register an operation handler
     */
    registerHandler(type: string, handler: OperationHandler): void;
    /**
     * Add operation to queue
     */
    enqueue(type: string, data: any, options?: {
        id?: string;
        priority?: 'low' | 'normal' | 'high';
        maxRetries?: number;
    }): string;
    /**
     * Remove operation from queue
     */
    dequeue(id: string): boolean;
    /**
     * Get operation by ID
     */
    getOperation(id: string): QueuedOperation | undefined;
    /**
     * Get all operations
     */
    getAllOperations(): QueuedOperation[];
    /**
     * Get operations by type
     */
    getOperationsByType(type: string): QueuedOperation[];
    /**
     * Get queue size
     */
    getQueueSize(): number;
    /**
     * Check if queue is empty
     */
    isEmpty(): boolean;
    /**
     * Clear all operations
     */
    clear(): void;
    /**
     * Clear operations by type
     */
    clearByType(type: string): void;
    /**
     * Start processing queue
     */
    startProcessing(): void;
    /**
     * Stop processing queue
     */
    stopProcessing(): void;
    /**
     * Force process queue immediately
     */
    processNow(): Promise<void>;
    /**
     * Handle network status changes
     */
    private handleNetworkStatusChange;
    /**
     * Process the queue
     */
    private processQueue;
    /**
     * Process a single operation
     */
    private processOperation;
    /**
     * Schedule next queue processing
     */
    private scheduleNextProcess;
    /**
     * Generate unique ID for operations
     */
    private generateId;
    /**
     * Persist queue to storage
     */
    private persistQueue;
    /**
     * Load queue from storage
     */
    private loadQueue;
    /**
     * Clean up resources
     */
    destroy(): void;
}
/**
 * Get or create global retry queue manager
 */
export declare function getRetryQueueManager(options?: RetryQueueOptions): RetryQueueManager;
/**
 * Convenience function to enqueue an operation
 */
export declare function enqueueOperation(type: string, data: any, options?: {
    id?: string;
    priority?: 'low' | 'normal' | 'high';
    maxRetries?: number;
}): string;
/**
 * Convenience function to register a handler
 */
export declare function registerRetryHandler(type: string, handler: OperationHandler): void;
