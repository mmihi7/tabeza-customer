/**
 * Digital Receipt Delivery Service
 * Handles conversion of POS print data to digital receipts and delivery to customers
 *
 * CORE TRUTH: Manual service always exists. Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 */
import { createClient } from '@supabase/supabase-js';
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    retryIntervals: [1000, 5000, 15000], // 1s, 5s, 15s
    exponentialBackoff: false
};
export class DigitalReceiptDeliveryService {
    constructor(supabaseUrl, supabaseKey, retryConfig = DEFAULT_RETRY_CONFIG) {
        this.deliveryHistory = new Map();
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.retryConfig = retryConfig;
    }
    /**
     * Convert POS print data to digital receipt format
     */
    convertPrintDataToDigitalReceipt(printData, barId, tabId) {
        return {
            barId,
            tabId,
            items: printData.items.map(item => ({
                name: item.name,
                quantity: item.quantity || 1,
                unit_price: item.unit_price,
                total_price: item.total_price,
                notes: item.notes
            })),
            total: printData.total,
            subtotal: printData.subtotal,
            tax: printData.tax,
            deliveryStatus: 'pending',
            retryCount: 0
        };
    }
    /**
     * Deliver digital receipt to a single customer
     */
    async deliverToCustomer(receipt, tabId, tabNumber, customerIdentifier, barId) {
        const deliveryId = `delivery-${Date.now()}-${tabId}`;
        try {
            // Create order in tab_orders table (this is the digital receipt)
            const { data: order, error: orderError } = await this.supabase
                .from('tab_orders')
                .insert({
                tab_id: tabId,
                items: receipt.items,
                total: receipt.total,
                status: 'confirmed', // POS orders are pre-confirmed
                initiated_by: 'staff', // Digital receipts are staff-initiated
                confirmed_at: new Date().toISOString()
            })
                .select('id')
                .single();
            if (orderError) {
                throw new Error(`Failed to create order: ${orderError.message}`);
            }
            // Log successful delivery
            await this.logDeliveryAttempt(deliveryId, barId, tabId, tabNumber, customerIdentifier, {
                attemptNumber: 1,
                timestamp: new Date(),
                success: true
            });
            return {
                receiptId: deliveryId,
                tabId,
                tabNumber,
                customerIdentifier,
                success: true,
                orderId: order.id,
                deliveredAt: new Date()
            };
        }
        catch (error) {
            // Log failed delivery
            await this.logDeliveryAttempt(deliveryId, barId, tabId, tabNumber, customerIdentifier, {
                attemptNumber: 1,
                timestamp: new Date(),
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                receiptId: deliveryId,
                tabId,
                tabNumber,
                customerIdentifier,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Deliver digital receipts to multiple customers
     */
    async deliverToMultipleCustomers(receipt, customers, barId) {
        const deliveryPromises = customers.map(customer => this.deliverToCustomer(receipt, customer.tabId, customer.tabNumber, customer.customerIdentifier, barId));
        return Promise.all(deliveryPromises);
    }
    /**
     * Retry failed delivery
     */
    async retryFailedDelivery(receipt, tabId, tabNumber, customerIdentifier, barId, previousAttempts = 0) {
        if (previousAttempts >= this.retryConfig.maxRetries) {
            return {
                receiptId: `retry-${Date.now()}-${tabId}`,
                tabId,
                tabNumber,
                customerIdentifier,
                success: false,
                error: 'Max retry attempts exceeded'
            };
        }
        // Wait before retrying
        const retryDelay = this.calculateRetryDelay(previousAttempts);
        await this.sleep(retryDelay);
        // Attempt delivery
        const result = await this.deliverToCustomer(receipt, tabId, tabNumber, customerIdentifier, barId);
        // If still failed and retries remaining, try again
        if (!result.success && previousAttempts + 1 < this.retryConfig.maxRetries) {
            return this.retryFailedDelivery(receipt, tabId, tabNumber, customerIdentifier, barId, previousAttempts + 1);
        }
        return result;
    }
    /**
     * Calculate retry delay based on configuration
     */
    calculateRetryDelay(attemptNumber) {
        if (attemptNumber >= this.retryConfig.retryIntervals.length) {
            return this.retryConfig.retryIntervals[this.retryConfig.retryIntervals.length - 1];
        }
        const baseDelay = this.retryConfig.retryIntervals[attemptNumber];
        if (this.retryConfig.exponentialBackoff) {
            return baseDelay * Math.pow(2, attemptNumber);
        }
        return baseDelay;
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Log delivery attempt to history
     */
    async logDeliveryAttempt(deliveryId, barId, tabId, tabNumber, customerIdentifier, attempt) {
        try {
            let historyEntry = this.deliveryHistory.get(deliveryId);
            if (!historyEntry) {
                historyEntry = {
                    id: deliveryId,
                    barId,
                    receiptId: deliveryId,
                    tabId,
                    tabNumber,
                    customerIdentifier,
                    deliveryStatus: attempt.success ? 'delivered' : 'retrying',
                    attempts: [],
                    finalStatus: attempt.success ? 'success' : 'failure',
                    createdAt: new Date()
                };
            }
            historyEntry.attempts.push(attempt);
            if (attempt.success) {
                historyEntry.deliveryStatus = 'delivered';
                historyEntry.finalStatus = 'success';
                historyEntry.completedAt = new Date();
            }
            else if (historyEntry.attempts.length >= this.retryConfig.maxRetries) {
                historyEntry.deliveryStatus = 'failed';
                historyEntry.finalStatus = 'failure';
                historyEntry.completedAt = new Date();
            }
            this.deliveryHistory.set(deliveryId, historyEntry);
            // Optionally persist to database
            await this.persistDeliveryHistory(historyEntry);
        }
        catch (error) {
            console.error('Failed to log delivery attempt:', error);
        }
    }
    /**
     * Persist delivery history to database
     */
    async persistDeliveryHistory(entry) {
        try {
            // Store in audit_logs table
            await this.supabase
                .from('audit_logs')
                .insert({
                bar_id: entry.barId,
                tab_id: entry.tabId,
                action: 'digital_receipt_delivery',
                details: {
                    receiptId: entry.receiptId,
                    tabNumber: entry.tabNumber,
                    customerIdentifier: entry.customerIdentifier,
                    deliveryStatus: entry.deliveryStatus,
                    attempts: entry.attempts,
                    finalStatus: entry.finalStatus,
                    completedAt: entry.completedAt
                }
            });
        }
        catch (error) {
            console.error('Failed to persist delivery history:', error);
        }
    }
    /**
     * Get delivery history for a specific receipt
     */
    getDeliveryHistory(receiptId) {
        return this.deliveryHistory.get(receiptId);
    }
    /**
     * Get all delivery history for a bar
     */
    getAllDeliveryHistory(barId) {
        return Array.from(this.deliveryHistory.values())
            .filter(entry => entry.barId === barId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * Clear delivery history (for testing or cleanup)
     */
    clearDeliveryHistory() {
        this.deliveryHistory.clear();
    }
    /**
     * Get delivery statistics
     */
    getDeliveryStats(barId) {
        const history = this.getAllDeliveryHistory(barId);
        const totalDeliveries = history.length;
        const successfulDeliveries = history.filter(h => h.finalStatus === 'success').length;
        const failedDeliveries = history.filter(h => h.finalStatus === 'failure').length;
        const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
        const averageAttempts = totalDeliveries > 0
            ? history.reduce((sum, h) => sum + h.attempts.length, 0) / totalDeliveries
            : 0;
        return {
            totalDeliveries,
            successfulDeliveries,
            failedDeliveries,
            successRate,
            averageAttempts
        };
    }
}
/**
 * Create a digital receipt delivery service instance
 */
export function createDigitalReceiptDeliveryService(supabaseUrl, supabaseKey, retryConfig) {
    return new DigitalReceiptDeliveryService(supabaseUrl, supabaseKey, retryConfig);
}
