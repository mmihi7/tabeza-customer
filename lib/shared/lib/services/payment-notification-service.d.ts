/**
 * Payment Notification Service
 *
 * Handles real-time notifications for M-Pesa and other payment methods.
 * Provides multi-tenant isolation, audit logging, and notification delivery tracking.
 *
 * Requirements: 3.1, 3.5, 1.1, 2.1
 */
export interface PaymentNotificationPayload {
    paymentId: string;
    tabId: string;
    barId: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    method: 'mpesa' | 'cash' | 'card';
    timestamp: string;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
    phoneNumber?: string;
    failureReason?: string;
    reference?: string;
}
export interface TabAutoCloseNotificationPayload {
    tabId: string;
    barId: string;
    paymentId: string;
    previousStatus: 'overdue';
    newStatus: 'closed';
    finalBalance: number;
    closedBy: 'system' | 'staff';
    timestamp: string;
    tabNumber?: number;
}
export interface NotificationRecipient {
    type: 'staff' | 'customer';
    barId?: string;
    tabId?: string;
    deviceId?: string;
    userId?: string;
}
export interface NotificationDeliveryRecord {
    id: string;
    paymentId: string;
    notificationType: 'payment_received' | 'payment_failed' | 'tab_auto_closed';
    recipients: NotificationRecipient[];
    deliveryAttempts: number;
    lastAttemptAt: string;
    deliveredAt?: string;
    failureReason?: string;
    status: 'pending' | 'delivered' | 'failed' | 'retrying';
    createdAt: string;
}
export interface NotificationAuditLog {
    id: string;
    barId: string;
    tabId?: string;
    staffId?: string;
    action: string;
    details: Record<string, any>;
    timestamp: string;
}
export interface NotificationQueueItem {
    id: string;
    payload: PaymentNotificationPayload | TabAutoCloseNotificationPayload;
    recipients: NotificationRecipient[];
    priority: 'high' | 'normal' | 'low';
    scheduledFor: string;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
}
/**
 * Configuration for the Payment Notification Service
 */
export interface PaymentNotificationServiceConfig {
    supabaseUrl: string;
    supabaseSecretKey: string;
    maxRetries?: number;
    retryDelayMs?: number[];
    notificationTimeoutMs?: number;
    enableAuditLogging?: boolean;
    enableOfflineQueue?: boolean;
}
/**
 * Payment Notification Service Class
 *
 * Handles creation, validation, and delivery of payment notifications
 * with multi-tenant isolation and comprehensive audit logging.
 */
export declare class PaymentNotificationService {
    private supabase;
    private config;
    private notificationQueue;
    private deliveryRecords;
    constructor(config: PaymentNotificationServiceConfig);
    /**
     * Create and validate a payment notification payload
     * Requirements: 3.1 - Multi-tenant filtering logic
     */
    createPaymentNotification(paymentData: Partial<PaymentNotificationPayload>): Promise<PaymentNotificationPayload>;
    /**
     * Create and validate a tab auto-close notification payload
     * Requirements: 3.1 - Multi-tenant filtering logic
     */
    createTabAutoCloseNotification(autoCloseData: Partial<TabAutoCloseNotificationPayload>): Promise<TabAutoCloseNotificationPayload>;
    /**
     * Get notification recipients with multi-tenant filtering
     * Requirements: 3.1, 3.2, 3.3 - Multi-tenant isolation
     */
    getNotificationRecipients(barId: string, tabId?: string, includeCustomer?: boolean): Promise<NotificationRecipient[]>;
    /**
     * Create audit log entry for notification events
     * Requirements: 3.5 - Audit logging for all notification events
     */
    private createAuditLog;
    /**
     * Add notification to queue for offline clients
     * Requirements: 1.1, 2.1 - Notification queue for offline clients
     */
    queueNotification(payload: PaymentNotificationPayload | TabAutoCloseNotificationPayload, recipients: NotificationRecipient[], priority?: 'high' | 'normal' | 'low'): Promise<string>;
    /**
     * Create delivery record for tracking notification delivery
     * Requirements: 1.1, 2.1 - Notification delivery tracking with timestamps
     */
    createDeliveryRecord(paymentId: string, notificationType: 'payment_received' | 'payment_failed' | 'tab_auto_closed', recipients: NotificationRecipient[]): Promise<NotificationDeliveryRecord>;
    /**
     * Update delivery record with attempt information
     * Requirements: 1.1, 2.1 - Retry logic for failed notification deliveries
     */
    updateDeliveryRecord(recordId: string, status: 'delivered' | 'failed' | 'retrying', failureReason?: string): Promise<void>;
    /**
     * Get queued notifications for processing
     */
    getQueuedNotifications(): NotificationQueueItem[];
    /**
     * Remove notification from queue
     */
    removeFromQueue(queueItemId: string): void;
    /**
     * Get delivery statistics for monitoring
     */
    getDeliveryStats(): {
        totalDeliveries: number;
        successfulDeliveries: number;
        failedDeliveries: number;
        pendingDeliveries: number;
        averageDeliveryTime: number;
    };
    /**
     * Notification Timing and Delivery Utilities
     * Requirements: 1.1, 2.1 - Notification delivery tracking with timestamps
     */
    /**
     * Deliver notification with timing tracking and retry logic
     * Requirements: 1.1, 2.1 - Real-time delivery within 2 seconds
     */
    deliverNotification(payload: PaymentNotificationPayload | TabAutoCloseNotificationPayload, recipients: NotificationRecipient[], priority?: 'high' | 'normal' | 'low'): Promise<{
        success: boolean;
        deliveryTime: number;
        deliveredCount: number;
        failedCount: number;
        deliveryRecordId: string;
    }>;
    /**
     * Deliver notification to a specific recipient
     * Requirements: 1.1, 2.1 - Individual recipient delivery
     */
    private deliverToRecipient;
    /**
     * Retry failed notification deliveries with exponential backoff
     * Requirements: 1.1, 2.1 - Retry logic for failed notification deliveries
     */
    retryFailedDeliveries(): Promise<{
        retriedCount: number;
        successCount: number;
        stillFailingCount: number;
    }>;
    /**
     * Process offline notification queue for reconnected clients
     * Requirements: 1.1, 2.1 - Notification queue for offline clients
     */
    processOfflineQueue(clientIdentifier: string, clientType: 'staff' | 'customer', barId?: string, tabId?: string): Promise<{
        processedCount: number;
        deliveredCount: number;
        failedCount: number;
    }>;
    /**
     * Get notification delivery timing metrics
     * Requirements: 1.1, 2.1 - Notification delivery tracking with timestamps
     */
    getDeliveryTimingMetrics(): {
        averageDeliveryTime: number;
        medianDeliveryTime: number;
        p95DeliveryTime: number;
        p99DeliveryTime: number;
        timeoutViolations: number;
        totalDeliveries: number;
    };
    /**
     * Utility function to add timeout to promises
     */
    private withTimeout;
    /**
     * Validate notification payload structure
     */
    validatePaymentNotificationPayload(payload: any): payload is PaymentNotificationPayload;
    /**
     * Validate auto-close notification payload structure
     */
    validateAutoCloseNotificationPayload(payload: any): payload is TabAutoCloseNotificationPayload;
}
