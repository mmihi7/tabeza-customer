import { supabase } from './supabase';
/**
 * Calculate average response time for a bar
 * @param barId - The bar ID to calculate response time for
 * @param options - Configuration options
 * @returns Promise<ResponseTimeResult>
 */
export async function calculateResponseTime(barId, options = {}) {
    const { timeframe = 'all', includeMessages = true, includeOrders = true, timezone = 'UTC' } = options;
    try {
        // Calculate time cutoff based on timeframe
        const now = new Date();
        let cutoffDate = null;
        switch (timeframe) {
            case '24h':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
            default:
                cutoffDate = null;
                break;
        }
        // Build query with time filtering
        let query = supabase
            .from('tabs')
            .select(`
        id,
        orders:tab_orders(id, status, created_at, confirmed_at, initiated_by),
        messages:tab_telegram_messages(id, status, created_at, staff_acknowledged_at, initiated_by)
      `)
            .eq('bar_id', barId);
        const { data: tabsData, error: tabsError } = await query;
        if (tabsError || !tabsData) {
            console.error('Error fetching response time data:', tabsError);
            return {
                averageMinutes: 0,
                formattedString: 'Error',
                sampleCount: 0,
                breakdown: { orders: { count: 0, avgMinutes: 0 }, messages: { count: 0, avgMinutes: 0 } },
                error: tabsError?.message || 'Failed to fetch data'
            };
        }
        // Process orders
        let orderResponseTimes = [];
        if (includeOrders) {
            const confirmedOrders = tabsData.flatMap((tab) => (tab.orders || []).filter((o) => {
                if (o.status !== 'confirmed' || !o.confirmed_at || !o.created_at || o.initiated_by !== 'customer') {
                    return false;
                }
                // Apply time filtering
                if (cutoffDate) {
                    const createdAt = new Date(o.created_at);
                    if (createdAt < cutoffDate)
                        return false;
                }
                return true;
            }));
            orderResponseTimes = confirmedOrders.map((order) => {
                const created = new Date(order.created_at).getTime();
                const confirmed = new Date(order.confirmed_at).getTime();
                return Math.max(0, (confirmed - created) / (1000 * 60)); // Ensure non-negative
            }).filter(time => !isNaN(time) && isFinite(time)); // Filter out invalid times
        }
        // Process messages
        let messageResponseTimes = [];
        if (includeMessages) {
            const acknowledgedMessages = tabsData.flatMap((tab) => (tab.messages || []).filter((m) => {
                if (m.status !== 'acknowledged' || !m.staff_acknowledged_at || !m.created_at || m.initiated_by !== 'customer') {
                    return false;
                }
                // Apply time filtering
                if (cutoffDate) {
                    const createdAt = new Date(m.created_at);
                    if (createdAt < cutoffDate)
                        return false;
                }
                return true;
            }));
            messageResponseTimes = acknowledgedMessages.map((message) => {
                const created = new Date(message.created_at).getTime();
                const acknowledged = new Date(message.staff_acknowledged_at).getTime();
                return Math.max(0, (acknowledged - created) / (1000 * 60)); // Ensure non-negative
            }).filter(time => !isNaN(time) && isFinite(time)); // Filter out invalid times
        }
        // Combine all response times
        const allResponseTimes = [...orderResponseTimes, ...messageResponseTimes];
        // Calculate averages
        const orderAvg = orderResponseTimes.length > 0
            ? orderResponseTimes.reduce((sum, time) => sum + time, 0) / orderResponseTimes.length
            : 0;
        const messageAvg = messageResponseTimes.length > 0
            ? messageResponseTimes.reduce((sum, time) => sum + time, 0) / messageResponseTimes.length
            : 0;
        const overallAvg = allResponseTimes.length > 0
            ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
            : 0;
        // Format the result
        const formattedString = formatResponseTime(overallAvg);
        return {
            averageMinutes: overallAvg,
            formattedString,
            sampleCount: allResponseTimes.length,
            breakdown: {
                orders: { count: orderResponseTimes.length, avgMinutes: orderAvg },
                messages: { count: messageResponseTimes.length, avgMinutes: messageAvg }
            }
        };
    }
    catch (error) {
        console.error('Error calculating response time:', error);
        return {
            averageMinutes: 0,
            formattedString: 'Error',
            sampleCount: 0,
            breakdown: { orders: { count: 0, avgMinutes: 0 }, messages: { count: 0, avgMinutes: 0 } },
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Format response time in minutes to a human-readable string
 * @param minutes - Response time in minutes
 * @returns Formatted string (e.g., "2.5m", "<1m", "1h 30m")
 */
export function formatResponseTime(minutes) {
    if (minutes === 0 || !isFinite(minutes) || isNaN(minutes)) {
        return '0m';
    }
    if (minutes < 1) {
        return '<1m';
    }
    if (minutes < 60) {
        return `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
}
/**
 * Calculate response time from in-memory tab data (for performance)
 * @param tabs - Array of tab objects with orders and messages
 * @param options - Configuration options
 * @returns ResponseTimeResult
 */
export function calculateResponseTimeFromTabs(tabs, options = {}) {
    const { timeframe = 'all', includeMessages = true, includeOrders = true } = options;
    try {
        // Calculate time cutoff
        const now = new Date();
        let cutoffDate = null;
        switch (timeframe) {
            case '24h':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        // Process orders
        let orderResponseTimes = [];
        if (includeOrders) {
            const confirmedOrders = tabs.flatMap(tab => (tab.orders || []).filter((o) => {
                if (o.status !== 'confirmed' || !o.confirmed_at || !o.created_at || o.initiated_by !== 'customer') {
                    return false;
                }
                if (cutoffDate) {
                    const createdAt = new Date(o.created_at);
                    if (createdAt < cutoffDate)
                        return false;
                }
                return true;
            }));
            orderResponseTimes = confirmedOrders.map(order => {
                const created = new Date(order.created_at).getTime();
                const confirmed = new Date(order.confirmed_at).getTime();
                return Math.max(0, (confirmed - created) / (1000 * 60));
            }).filter(time => !isNaN(time) && isFinite(time));
        }
        // Process messages
        let messageResponseTimes = [];
        if (includeMessages) {
            const acknowledgedMessages = tabs.flatMap(tab => (tab.messages || []).filter((m) => {
                if (m.status !== 'acknowledged' || !m.staff_acknowledged_at || !m.created_at || m.initiated_by !== 'customer') {
                    return false;
                }
                if (cutoffDate) {
                    const createdAt = new Date(m.created_at);
                    if (createdAt < cutoffDate)
                        return false;
                }
                return true;
            }));
            messageResponseTimes = acknowledgedMessages.map(message => {
                const created = new Date(message.created_at).getTime();
                const acknowledged = new Date(message.staff_acknowledged_at).getTime();
                return Math.max(0, (acknowledged - created) / (1000 * 60));
            }).filter(time => !isNaN(time) && isFinite(time));
        }
        // Combine and calculate
        const allResponseTimes = [...orderResponseTimes, ...messageResponseTimes];
        const orderAvg = orderResponseTimes.length > 0
            ? orderResponseTimes.reduce((sum, time) => sum + time, 0) / orderResponseTimes.length
            : 0;
        const messageAvg = messageResponseTimes.length > 0
            ? messageResponseTimes.reduce((sum, time) => sum + time, 0) / messageResponseTimes.length
            : 0;
        const overallAvg = allResponseTimes.length > 0
            ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
            : 0;
        return {
            averageMinutes: overallAvg,
            formattedString: formatResponseTime(overallAvg),
            sampleCount: allResponseTimes.length,
            breakdown: {
                orders: { count: orderResponseTimes.length, avgMinutes: orderAvg },
                messages: { count: messageResponseTimes.length, avgMinutes: messageAvg }
            }
        };
    }
    catch (error) {
        console.error('Error calculating response time from tabs:', error);
        return {
            averageMinutes: 0,
            formattedString: 'Error',
            sampleCount: 0,
            breakdown: { orders: { count: 0, avgMinutes: 0 }, messages: { count: 0, avgMinutes: 0 } },
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
