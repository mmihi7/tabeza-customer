/**
 * Payment Notification Service
 *
 * Handles real-time notifications for M-Pesa and other payment methods.
 * Provides multi-tenant isolation, audit logging, and notification delivery tracking.
 *
 * Requirements: 3.1, 3.5, 1.1, 2.1
 */
import { createClient } from '@supabase/supabase-js';
/**
 * Payment Notification Service Class
 *
 * Handles creation, validation, and delivery of payment notifications
 * with multi-tenant isolation and comprehensive audit logging.
 */
export class PaymentNotificationService {
    constructor(config) {
        this.notificationQueue = new Map();
        this.deliveryRecords = new Map();
        this.config = {
            maxRetries: 3,
            retryDelayMs: [1000, 3000, 10000],
            notificationTimeoutMs: 2000,
            enableAuditLogging: true,
            enableOfflineQueue: true,
            ...config
        };
        this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseSecretKey);
    }
    /**
     * Create and validate a payment notification payload
     * Requirements: 3.1 - Multi-tenant filtering logic
     */
    async createPaymentNotification(paymentData) {
        // Validate required fields
        if (!paymentData.paymentId || !paymentData.tabId || !paymentData.amount) {
            throw new Error('Missing required payment notification fields');
        }
        // Get bar information for multi-tenant filtering
        const { data: tabData, error: tabError } = await this.supabase
            .from('tabs')
            .select('bar_id, tab_number')
            .eq('id', paymentData.tabId)
            .single();
        if (tabError || !tabData) {
            throw new Error(`Failed to get tab data for notification: ${tabError?.message}`);
        }
        // Create validated payload
        const payload = {
            paymentId: paymentData.paymentId,
            tabId: paymentData.tabId,
            barId: tabData.bar_id,
            amount: paymentData.amount,
            status: paymentData.status || 'pending',
            method: paymentData.method || 'mpesa',
            timestamp: paymentData.timestamp || new Date().toISOString(),
            mpesaReceiptNumber: paymentData.mpesaReceiptNumber,
            transactionDate: paymentData.transactionDate,
            phoneNumber: paymentData.phoneNumber,
            failureReason: paymentData.failureReason,
            reference: paymentData.reference
        };
        // Requirement 3.5: Create audit log entry
        if (this.config.enableAuditLogging) {
            await this.createAuditLog({
                barId: payload.barId,
                tabId: payload.tabId,
                action: 'payment_notification_created',
                details: {
                    paymentId: payload.paymentId,
                    amount: payload.amount,
                    method: payload.method,
                    status: payload.status
                }
            });
        }
        return payload;
    }
    /**
     * Create and validate a tab auto-close notification payload
     * Requirements: 3.1 - Multi-tenant filtering logic
     */
    async createTabAutoCloseNotification(autoCloseData) {
        // Validate required fields
        if (!autoCloseData.tabId || !autoCloseData.paymentId || autoCloseData.finalBalance === undefined) {
            throw new Error('Missing required auto-close notification fields');
        }
        // Get tab and bar information
        const { data: tabData, error: tabError } = await this.supabase
            .from('tabs')
            .select('bar_id, tab_number')
            .eq('id', autoCloseData.tabId)
            .single();
        if (tabError || !tabData) {
            throw new Error(`Failed to get tab data for auto-close notification: ${tabError?.message}`);
        }
        // Create validated payload
        const payload = {
            tabId: autoCloseData.tabId,
            barId: tabData.bar_id,
            paymentId: autoCloseData.paymentId,
            previousStatus: 'overdue',
            newStatus: 'closed',
            finalBalance: autoCloseData.finalBalance,
            closedBy: autoCloseData.closedBy || 'system',
            timestamp: autoCloseData.timestamp || new Date().toISOString(),
            tabNumber: tabData.tab_number
        };
        // Requirement 3.5: Create audit log entry
        if (this.config.enableAuditLogging) {
            await this.createAuditLog({
                barId: payload.barId,
                tabId: payload.tabId,
                action: 'tab_auto_close_notification_created',
                details: {
                    paymentId: payload.paymentId,
                    finalBalance: payload.finalBalance,
                    closedBy: payload.closedBy,
                    tabNumber: payload.tabNumber
                }
            });
        }
        return payload;
    }
    /**
     * Get notification recipients with multi-tenant filtering
     * Requirements: 3.1, 3.2, 3.3 - Multi-tenant isolation
     */
    async getNotificationRecipients(barId, tabId, includeCustomer = true) {
        const recipients = [];
        // Get staff members with access to this bar
        const { data: staffMembers, error: staffError } = await this.supabase
            .from('user_bars')
            .select('user_id, role')
            .eq('bar_id', barId);
        if (!staffError && staffMembers) {
            staffMembers.forEach(staff => {
                recipients.push({
                    type: 'staff',
                    barId: barId,
                    userId: staff.user_id
                });
            });
        }
        // Include customer if tab-specific notification and requested
        if (includeCustomer && tabId) {
            // Get customer device information for the tab
            const { data: tabData, error: tabError } = await this.supabase
                .from('tabs')
                .select('device_identifier, owner_identifier')
                .eq('id', tabId)
                .single();
            if (!tabError && tabData) {
                recipients.push({
                    type: 'customer',
                    tabId: tabId,
                    deviceId: tabData.device_identifier
                });
            }
        }
        return recipients;
    }
    /**
     * Create audit log entry for notification events
     * Requirements: 3.5 - Audit logging for all notification events
     */
    async createAuditLog(logData) {
        try {
            const auditLog = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                ...logData
            };
            const { error } = await this.supabase
                .from('audit_logs')
                .insert({
                id: auditLog.id,
                bar_id: auditLog.barId,
                tab_id: auditLog.tabId,
                staff_id: auditLog.staffId,
                action: auditLog.action,
                details: auditLog.details,
                created_at: auditLog.timestamp
            });
            if (error) {
                console.error('Failed to create audit log:', error);
            }
        }
        catch (error) {
            console.error('Error creating audit log:', error);
        }
    }
    /**
     * Add notification to queue for offline clients
     * Requirements: 1.1, 2.1 - Notification queue for offline clients
     */
    async queueNotification(payload, recipients, priority = 'normal') {
        const queueItem = {
            id: crypto.randomUUID(),
            payload,
            recipients,
            priority,
            scheduledFor: new Date().toISOString(),
            retryCount: 0,
            maxRetries: this.config.maxRetries,
            createdAt: new Date().toISOString()
        };
        this.notificationQueue.set(queueItem.id, queueItem);
        // Create audit log for queued notification
        if (this.config.enableAuditLogging) {
            let barId = '';
            let tabId;
            if ('barId' in payload) {
                barId = payload.barId;
            }
            if ('tabId' in payload) {
                tabId = payload.tabId;
            }
            await this.createAuditLog({
                barId,
                tabId,
                action: 'notification_queued',
                details: {
                    queueItemId: queueItem.id,
                    priority,
                    recipientCount: recipients.length,
                    notificationType: 'paymentId' in payload ? 'payment_notification' : 'auto_close_notification'
                }
            });
        }
        return queueItem.id;
    }
    /**
     * Create delivery record for tracking notification delivery
     * Requirements: 1.1, 2.1 - Notification delivery tracking with timestamps
     */
    async createDeliveryRecord(paymentId, notificationType, recipients) {
        const record = {
            id: crypto.randomUUID(),
            paymentId,
            notificationType,
            recipients,
            deliveryAttempts: 0,
            lastAttemptAt: new Date().toISOString(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        this.deliveryRecords.set(record.id, record);
        return record;
    }
    /**
     * Update delivery record with attempt information
     * Requirements: 1.1, 2.1 - Retry logic for failed notification deliveries
     */
    async updateDeliveryRecord(recordId, status, failureReason) {
        const record = this.deliveryRecords.get(recordId);
        if (!record) {
            throw new Error(`Delivery record not found: ${recordId}`);
        }
        record.deliveryAttempts += 1;
        record.lastAttemptAt = new Date().toISOString();
        record.status = status;
        if (status === 'delivered') {
            record.deliveredAt = new Date().toISOString();
        }
        else if (status === 'failed') {
            record.failureReason = failureReason;
        }
        this.deliveryRecords.set(recordId, record);
    }
    /**
     * Get queued notifications for processing
     */
    getQueuedNotifications() {
        return Array.from(this.notificationQueue.values())
            .filter(item => item.retryCount < item.maxRetries)
            .sort((a, b) => {
            // Sort by priority (high > normal > low) then by creation time
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }
    /**
     * Remove notification from queue
     */
    removeFromQueue(queueItemId) {
        this.notificationQueue.delete(queueItemId);
    }
    /**
     * Get delivery statistics for monitoring
     */
    getDeliveryStats() {
        const records = Array.from(this.deliveryRecords.values());
        const totalDeliveries = records.length;
        const successfulDeliveries = records.filter(r => r.status === 'delivered').length;
        const failedDeliveries = records.filter(r => r.status === 'failed').length;
        const pendingDeliveries = records.filter(r => r.status === 'pending' || r.status === 'retrying').length;
        // Calculate average delivery time for successful deliveries
        const deliveredRecords = records.filter(r => r.status === 'delivered' && r.deliveredAt);
        const averageDeliveryTime = deliveredRecords.length > 0
            ? deliveredRecords.reduce((sum, record) => {
                const deliveryTime = new Date(record.deliveredAt).getTime() - new Date(record.createdAt).getTime();
                return sum + deliveryTime;
            }, 0) / deliveredRecords.length
            : 0;
        return {
            totalDeliveries,
            successfulDeliveries,
            failedDeliveries,
            pendingDeliveries,
            averageDeliveryTime
        };
    }
    /**
     * Notification Timing and Delivery Utilities
     * Requirements: 1.1, 2.1 - Notification delivery tracking with timestamps
     */
    /**
     * Deliver notification with timing tracking and retry logic
     * Requirements: 1.1, 2.1 - Real-time delivery within 2 seconds
     */
    async deliverNotification(payload, recipients, priority = 'normal') {
        const startTime = Date.now();
        // Determine notification type and payment ID
        let notificationType;
        let paymentId;
        if ('paymentId' in payload && 'status' in payload) {
            // PaymentNotificationPayload
            const paymentPayload = payload;
            notificationType = paymentPayload.status === 'success' ? 'payment_received' : 'payment_failed';
            paymentId = paymentPayload.paymentId;
        }
        else {
            // TabAutoCloseNotificationPayload
            const autoClosePayload = payload;
            notificationType = 'tab_auto_closed';
            paymentId = autoClosePayload.paymentId;
        }
        // Create delivery record
        const deliveryRecord = await this.createDeliveryRecord(paymentId, notificationType, recipients);
        let deliveredCount = 0;
        let failedCount = 0;
        let overallSuccess = true;
        try {
            // Attempt delivery to all recipients
            const deliveryPromises = recipients.map(async (recipient) => {
                try {
                    await this.deliverToRecipient(payload, recipient);
                    deliveredCount++;
                    return true;
                }
                catch (error) {
                    console.error(`Failed to deliver notification to recipient:`, {
                        recipientType: recipient.type,
                        barId: recipient.barId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    failedCount++;
                    return false;
                }
            });
            // Wait for all deliveries with timeout
            const deliveryResults = await Promise.allSettled(deliveryPromises.map(promise => this.withTimeout(promise, this.config.notificationTimeoutMs)));
            // Check if any deliveries failed due to timeout or other errors
            deliveryResults.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Delivery failed for recipient ${index}:`, result.reason);
                    if (deliveredCount > 0)
                        deliveredCount--;
                    failedCount++;
                }
            });
            overallSuccess = failedCount === 0;
            const deliveryTime = Date.now() - startTime;
            // Update delivery record
            await this.updateDeliveryRecord(deliveryRecord.id, overallSuccess ? 'delivered' : (deliveredCount > 0 ? 'delivered' : 'failed'), overallSuccess ? undefined : `${failedCount} of ${recipients.length} deliveries failed`);
            // Log delivery performance
            if (deliveryTime > this.config.notificationTimeoutMs) {
                console.warn(`Notification delivery exceeded timeout: ${deliveryTime}ms > ${this.config.notificationTimeoutMs}ms`);
            }
            // Create audit log for delivery attempt
            if (this.config.enableAuditLogging) {
                let barId = '';
                let tabId;
                if ('barId' in payload) {
                    barId = payload.barId;
                }
                if ('tabId' in payload) {
                    tabId = payload.tabId;
                }
                await this.createAuditLog({
                    barId,
                    tabId,
                    action: 'notification_delivery_attempted',
                    details: {
                        deliveryRecordId: deliveryRecord.id,
                        deliveryTime,
                        deliveredCount,
                        failedCount,
                        overallSuccess,
                        notificationType,
                        priority
                    }
                });
            }
            return {
                success: overallSuccess,
                deliveryTime,
                deliveredCount,
                failedCount,
                deliveryRecordId: deliveryRecord.id
            };
        }
        catch (error) {
            const deliveryTime = Date.now() - startTime;
            // Update delivery record with failure
            await this.updateDeliveryRecord(deliveryRecord.id, 'failed', error instanceof Error ? error.message : 'Unknown delivery error');
            console.error('Notification delivery failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                deliveryTime,
                recipientCount: recipients.length
            });
            return {
                success: false,
                deliveryTime,
                deliveredCount: 0,
                failedCount: recipients.length,
                deliveryRecordId: deliveryRecord.id
            };
        }
    }
    /**
     * Deliver notification to a specific recipient
     * Requirements: 1.1, 2.1 - Individual recipient delivery
     */
    async deliverToRecipient(payload, recipient) {
        // Simulate real-time delivery via Supabase channels
        // In a real implementation, this would trigger Supabase real-time subscriptions
        const channelName = recipient.type === 'staff'
            ? `staff-notifications-${recipient.barId}`
            : `customer-notifications-${recipient.tabId}`;
        // Log the delivery attempt
        console.log(`Delivering notification via channel: ${channelName}`, {
            recipientType: recipient.type,
            barId: recipient.barId,
            tabId: recipient.tabId,
            userId: recipient.userId,
            deviceId: recipient.deviceId,
            notificationType: 'paymentId' in payload ? 'payment_notification' : 'auto_close_notification'
        });
        // In a real implementation, this would use Supabase real-time channels:
        // await this.supabaseClient.channel(channelName).send({
        //   type: 'broadcast',
        //   event: 'payment_notification',
        //   payload: payload
        // });
        // For testing purposes, we simulate successful delivery
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Simulate network delay
    }
    /**
     * Retry failed notification deliveries with exponential backoff
     * Requirements: 1.1, 2.1 - Retry logic for failed notification deliveries
     */
    async retryFailedDeliveries() {
        const failedQueueItems = this.getQueuedNotifications().filter(item => item.retryCount < item.maxRetries);
        let retriedCount = 0;
        let successCount = 0;
        let stillFailingCount = 0;
        for (const queueItem of failedQueueItems) {
            try {
                // Calculate delay based on retry count
                const delayIndex = Math.min(queueItem.retryCount, this.config.retryDelayMs.length - 1);
                const delay = this.config.retryDelayMs[delayIndex];
                // Wait for exponential backoff delay
                await new Promise(resolve => setTimeout(resolve, delay));
                // Attempt delivery
                const result = await this.deliverNotification(queueItem.payload, queueItem.recipients, queueItem.priority);
                retriedCount++;
                if (result.success) {
                    successCount++;
                    this.removeFromQueue(queueItem.id);
                    // Create audit log for successful retry
                    if (this.config.enableAuditLogging) {
                        let barId = '';
                        let tabId;
                        if ('barId' in queueItem.payload) {
                            barId = queueItem.payload.barId;
                        }
                        if ('tabId' in queueItem.payload) {
                            tabId = queueItem.payload.tabId;
                        }
                        await this.createAuditLog({
                            barId,
                            tabId,
                            action: 'notification_retry_succeeded',
                            details: {
                                queueItemId: queueItem.id,
                                retryCount: queueItem.retryCount + 1,
                                deliveryTime: result.deliveryTime,
                                deliveredCount: result.deliveredCount
                            }
                        });
                    }
                }
                else {
                    // Update retry count
                    queueItem.retryCount++;
                    if (queueItem.retryCount >= queueItem.maxRetries) {
                        stillFailingCount++;
                        this.removeFromQueue(queueItem.id);
                        // Create audit log for final failure
                        if (this.config.enableAuditLogging) {
                            let barId = '';
                            let tabId;
                            if ('barId' in queueItem.payload) {
                                barId = queueItem.payload.barId;
                            }
                            if ('tabId' in queueItem.payload) {
                                tabId = queueItem.payload.tabId;
                            }
                            await this.createAuditLog({
                                barId,
                                tabId,
                                action: 'notification_retry_exhausted',
                                details: {
                                    queueItemId: queueItem.id,
                                    finalRetryCount: queueItem.retryCount,
                                    maxRetries: queueItem.maxRetries,
                                    failedCount: result.failedCount
                                }
                            });
                        }
                    }
                    else {
                        stillFailingCount++;
                    }
                }
            }
            catch (error) {
                console.error(`Error during notification retry:`, {
                    queueItemId: queueItem.id,
                    retryCount: queueItem.retryCount,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                queueItem.retryCount++;
                if (queueItem.retryCount >= queueItem.maxRetries) {
                    this.removeFromQueue(queueItem.id);
                }
                stillFailingCount++;
            }
        }
        return {
            retriedCount,
            successCount,
            stillFailingCount
        };
    }
    /**
     * Process offline notification queue for reconnected clients
     * Requirements: 1.1, 2.1 - Notification queue for offline clients
     */
    async processOfflineQueue(clientIdentifier, clientType, barId, tabId) {
        if (!this.config.enableOfflineQueue) {
            return { processedCount: 0, deliveredCount: 0, failedCount: 0 };
        }
        // Filter queue items relevant to the reconnected client
        const relevantQueueItems = this.getQueuedNotifications().filter(queueItem => {
            return queueItem.recipients.some(recipient => {
                if (recipient.type !== clientType)
                    return false;
                if (clientType === 'staff' && recipient.barId === barId)
                    return true;
                if (clientType === 'customer' && recipient.tabId === tabId)
                    return true;
                return false;
            });
        });
        let processedCount = 0;
        let deliveredCount = 0;
        let failedCount = 0;
        for (const queueItem of relevantQueueItems) {
            try {
                // Filter recipients to only include the reconnected client
                const clientRecipients = queueItem.recipients.filter(recipient => {
                    if (recipient.type !== clientType)
                        return false;
                    if (clientType === 'staff' && recipient.barId === barId)
                        return true;
                    if (clientType === 'customer' && recipient.tabId === tabId)
                        return true;
                    return false;
                });
                if (clientRecipients.length === 0)
                    continue;
                // Deliver to the specific client
                const result = await this.deliverNotification(queueItem.payload, clientRecipients, queueItem.priority);
                processedCount++;
                if (result.success) {
                    deliveredCount++;
                }
                else {
                    failedCount++;
                }
                // Remove from queue if all recipients have been processed
                // (In a real implementation, you'd track per-recipient delivery status)
                this.removeFromQueue(queueItem.id);
            }
            catch (error) {
                console.error(`Error processing offline queue item:`, {
                    queueItemId: queueItem.id,
                    clientIdentifier,
                    clientType,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failedCount++;
            }
        }
        // Create audit log for offline queue processing
        if (this.config.enableAuditLogging && processedCount > 0) {
            await this.createAuditLog({
                barId: barId || '',
                tabId,
                action: 'offline_queue_processed',
                details: {
                    clientIdentifier,
                    clientType,
                    processedCount,
                    deliveredCount,
                    failedCount
                }
            });
        }
        return {
            processedCount,
            deliveredCount,
            failedCount
        };
    }
    /**
     * Get notification delivery timing metrics
     * Requirements: 1.1, 2.1 - Notification delivery tracking with timestamps
     */
    getDeliveryTimingMetrics() {
        const deliveredRecords = Array.from(this.deliveryRecords.values())
            .filter(record => record.status === 'delivered' && record.deliveredAt);
        if (deliveredRecords.length === 0) {
            return {
                averageDeliveryTime: 0,
                medianDeliveryTime: 0,
                p95DeliveryTime: 0,
                p99DeliveryTime: 0,
                timeoutViolations: 0,
                totalDeliveries: 0
            };
        }
        // Calculate delivery times
        const deliveryTimes = deliveredRecords.map(record => new Date(record.deliveredAt).getTime() - new Date(record.createdAt).getTime()).sort((a, b) => a - b);
        const averageDeliveryTime = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
        const medianDeliveryTime = deliveryTimes[Math.floor(deliveryTimes.length / 2)];
        const p95Index = Math.floor(deliveryTimes.length * 0.95);
        const p99Index = Math.floor(deliveryTimes.length * 0.99);
        const p95DeliveryTime = deliveryTimes[p95Index] || 0;
        const p99DeliveryTime = deliveryTimes[p99Index] || 0;
        const timeoutViolations = deliveryTimes.filter(time => time > this.config.notificationTimeoutMs).length;
        return {
            averageDeliveryTime,
            medianDeliveryTime,
            p95DeliveryTime,
            p99DeliveryTime,
            timeoutViolations,
            totalDeliveries: deliveredRecords.length
        };
    }
    /**
     * Utility function to add timeout to promises
     */
    withTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs))
        ]);
    }
    /**
     * Validate notification payload structure
     */
    validatePaymentNotificationPayload(payload) {
        return (typeof payload === 'object' &&
            typeof payload.paymentId === 'string' &&
            typeof payload.tabId === 'string' &&
            typeof payload.barId === 'string' &&
            typeof payload.amount === 'number' &&
            ['success', 'failed', 'pending'].includes(payload.status) &&
            ['mpesa', 'cash', 'card'].includes(payload.method) &&
            typeof payload.timestamp === 'string');
    }
    /**
     * Validate auto-close notification payload structure
     */
    validateAutoCloseNotificationPayload(payload) {
        return (typeof payload === 'object' &&
            typeof payload.tabId === 'string' &&
            typeof payload.barId === 'string' &&
            typeof payload.paymentId === 'string' &&
            payload.previousStatus === 'overdue' &&
            payload.newStatus === 'closed' &&
            typeof payload.finalBalance === 'number' &&
            ['system', 'staff'].includes(payload.closedBy) &&
            typeof payload.timestamp === 'string');
    }
}
