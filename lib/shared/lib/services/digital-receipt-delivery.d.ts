/**
 * Digital Receipt Delivery Service
 * Handles conversion of POS print data to digital receipts and delivery to customers
 *
 * CORE TRUTH: Manual service always exists. Digital authority is singular.
 * Tabeza adapts to the venue — never the reverse.
 */
export interface ReceiptItem {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
}
export interface PrintDataReceipt {
    items: ReceiptItem[];
    total: number;
    subtotal?: number;
    tax?: number;
    customerInfo?: {
        tableNumber?: number;
        phone?: string;
        name?: string;
    };
    metadata?: {
        posSystemId?: string;
        transactionId?: string;
        timestamp: Date;
    };
    rawReceipt?: string;
}
export interface DigitalReceipt {
    id: string;
    barId: string;
    tabId: string;
    orderId: string;
    items: ReceiptItem[];
    total: number;
    subtotal?: number;
    tax?: number;
    deliveryStatus: 'pending' | 'delivered' | 'failed';
    deliveredAt?: Date;
    failureReason?: string;
    retryCount: number;
    createdAt: Date;
}
export interface DeliveryAttempt {
    attemptNumber: number;
    timestamp: Date;
    success: boolean;
    error?: string;
}
export interface DeliveryResult {
    receiptId: string;
    tabId: string;
    tabNumber: number;
    customerIdentifier: string;
    success: boolean;
    orderId?: string;
    error?: string;
    deliveredAt?: Date;
}
export interface DeliveryHistoryEntry {
    id: string;
    barId: string;
    receiptId: string;
    tabId: string;
    tabNumber: number;
    customerIdentifier: string;
    deliveryStatus: 'delivered' | 'failed' | 'retrying';
    attempts: DeliveryAttempt[];
    finalStatus: 'success' | 'failure';
    createdAt: Date;
    completedAt?: Date;
}
export interface RetryConfig {
    maxRetries: number;
    retryIntervals: number[];
    exponentialBackoff: boolean;
}
export declare class DigitalReceiptDeliveryService {
    private supabase;
    private retryConfig;
    private deliveryHistory;
    constructor(supabaseUrl: string, supabaseKey: string, retryConfig?: RetryConfig);
    /**
     * Convert POS print data to digital receipt format
     */
    convertPrintDataToDigitalReceipt(printData: PrintDataReceipt, barId: string, tabId: string): Omit<DigitalReceipt, 'id' | 'orderId' | 'createdAt'>;
    /**
     * Deliver digital receipt to a single customer
     */
    deliverToCustomer(receipt: PrintDataReceipt, tabId: string, tabNumber: number, customerIdentifier: string, barId: string): Promise<DeliveryResult>;
    /**
     * Deliver digital receipts to multiple customers
     */
    deliverToMultipleCustomers(receipt: PrintDataReceipt, customers: Array<{
        tabId: string;
        tabNumber: number;
        customerIdentifier: string;
    }>, barId: string): Promise<DeliveryResult[]>;
    /**
     * Retry failed delivery
     */
    retryFailedDelivery(receipt: PrintDataReceipt, tabId: string, tabNumber: number, customerIdentifier: string, barId: string, previousAttempts?: number): Promise<DeliveryResult>;
    /**
     * Calculate retry delay based on configuration
     */
    private calculateRetryDelay;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
    /**
     * Log delivery attempt to history
     */
    private logDeliveryAttempt;
    /**
     * Persist delivery history to database
     */
    private persistDeliveryHistory;
    /**
     * Get delivery history for a specific receipt
     */
    getDeliveryHistory(receiptId: string): DeliveryHistoryEntry | undefined;
    /**
     * Get all delivery history for a bar
     */
    getAllDeliveryHistory(barId: string): DeliveryHistoryEntry[];
    /**
     * Clear delivery history (for testing or cleanup)
     */
    clearDeliveryHistory(): void;
    /**
     * Get delivery statistics
     */
    getDeliveryStats(barId: string): {
        totalDeliveries: number;
        successfulDeliveries: number;
        failedDeliveries: number;
        successRate: number;
        averageAttempts: number;
    };
}
/**
 * Create a digital receipt delivery service instance
 */
export declare function createDigitalReceiptDeliveryService(supabaseUrl: string, supabaseKey: string, retryConfig?: RetryConfig): DigitalReceiptDeliveryService;
