import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
export const useRealtimeSubscription = (configs, dependencies = [], options = {}) => {
    const { maxRetries = 5, retryDelay = [1000, 2000, 5000, 10000, 30000], debounceMs = 300, onConnectionChange } = options;
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [retryCount, setRetryCount] = useState(0);
    const channelRef = useRef(null);
    const debouncedHandlersRef = useRef(new Map());
    const retryTimeoutRef = useRef(undefined);
    // Debounced handler to prevent rapid updates
    const createDebouncedHandler = useCallback((config) => {
        return (payload) => {
            const key = `${config.table}-${config.event || '*'}`;
            // Clear existing timeout
            const existingTimeout = debouncedHandlersRef.current.get(key);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            // Set new timeout
            const timeout = setTimeout(() => {
                config.handler(payload);
                debouncedHandlersRef.current.delete(key);
            }, debounceMs);
            debouncedHandlersRef.current.set(key, timeout);
        };
    }, [debounceMs]);
    // Create subscription with retry logic
    const createSubscription = useCallback(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        setConnectionStatus('connecting');
        const channelName = configs[0]?.channelName || `realtime-${Date.now()}`;
        const channel = supabase.channel(channelName);
        // Add all event handlers
        configs.forEach(config => {
            const debouncedHandler = createDebouncedHandler(config);
            channel.on('postgres_changes', {
                event: config.event || '*',
                schema: 'public',
                table: config.table,
                filter: config.filter
            }, debouncedHandler);
        });
        // Subscribe with status tracking
        channel.subscribe((status) => {
            console.log(`📡 Realtime status for ${channelName}:`, status);
            if (status === 'SUBSCRIBED') {
                setConnectionStatus('connected');
                setRetryCount(0);
                onConnectionChange?.('connected', configs);
            }
            else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setConnectionStatus('error');
                onConnectionChange?.('error', configs);
                // Implement retry logic
                if (retryCount < maxRetries) {
                    const delay = retryDelay[Math.min(retryCount, retryDelay.length - 1)];
                    setConnectionStatus('retrying');
                    onConnectionChange?.('retrying', configs);
                    retryTimeoutRef.current = setTimeout(() => {
                        setRetryCount((prev) => prev + 1);
                        createSubscription();
                    }, delay);
                }
                else {
                    setConnectionStatus('disconnected');
                    onConnectionChange?.('disconnected', configs);
                }
            }
            else if (status === 'CLOSED') {
                setConnectionStatus('disconnected');
                onConnectionChange?.('disconnected', configs);
            }
        });
        channelRef.current = channel;
        return channel;
    }, [configs, retryCount, maxRetries, retryDelay, createDebouncedHandler, onConnectionChange]);
    // Initialize subscription
    useEffect(() => {
        if (!configs.length)
            return;
        const channel = createSubscription();
        return () => {
            // Cleanup
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
            // Clear all debounced handlers
            debouncedHandlersRef.current.forEach((timeout) => clearTimeout(timeout));
            debouncedHandlersRef.current.clear();
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, dependencies); // Re-subscribe when dependencies change
    // Manual reconnection
    const reconnect = useCallback(() => {
        setRetryCount(0);
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }
        createSubscription();
    }, [createSubscription]);
    return {
        connectionStatus,
        retryCount,
        reconnect,
        isConnected: connectionStatus === 'connected'
    };
};
