export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'retrying';
interface RealtimeSubscriptionConfig {
    channelName: string;
    table: string;
    filter?: string;
    event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    handler: (payload: any) => void;
}
interface UseRealtimeSubscriptionOptions {
    maxRetries?: number;
    retryDelay?: number[];
    debounceMs?: number;
    onConnectionChange?: (status: ConnectionStatus, configs: RealtimeSubscriptionConfig[]) => void;
}
export declare const useRealtimeSubscription: (configs: RealtimeSubscriptionConfig[], dependencies?: any[], options?: UseRealtimeSubscriptionOptions) => {
    connectionStatus: ConnectionStatus;
    retryCount: number;
    reconnect: () => void;
    isConnected: boolean;
};
export {};
