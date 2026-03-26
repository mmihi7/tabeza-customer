export interface ResponseTimeOptions {
    timeframe?: '24h' | '7d' | '30d' | 'all';
    includeMessages?: boolean;
    includeOrders?: boolean;
    timezone?: string;
}
export interface ResponseTimeResult {
    averageMinutes: number;
    formattedString: string;
    sampleCount: number;
    breakdown: {
        orders: {
            count: number;
            avgMinutes: number;
        };
        messages: {
            count: number;
            avgMinutes: number;
        };
    };
    error?: string;
}
export interface ResponseTimeData {
    orders: Array<{
        created_at: string;
        confirmed_at: string;
        initiated_by: string;
    }>;
    messages: Array<{
        created_at: string;
        staff_acknowledged_at: string;
        initiated_by: string;
    }>;
}
/**
 * Calculate average response time for a bar
 * @param barId - The bar ID to calculate response time for
 * @param options - Configuration options
 * @returns Promise<ResponseTimeResult>
 */
export declare function calculateResponseTime(barId: string, options?: ResponseTimeOptions): Promise<ResponseTimeResult>;
/**
 * Format response time in minutes to a human-readable string
 * @param minutes - Response time in minutes
 * @returns Formatted string (e.g., "2.5m", "<1m", "1h 30m")
 */
export declare function formatResponseTime(minutes: number): string;
/**
 * Calculate response time from in-memory tab data (for performance)
 * @param tabs - Array of tab objects with orders and messages
 * @param options - Configuration options
 * @returns ResponseTimeResult
 */
export declare function calculateResponseTimeFromTabs(tabs: any[], options?: ResponseTimeOptions): ResponseTimeResult;
