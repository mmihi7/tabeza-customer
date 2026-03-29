import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'retrying'

interface RealtimeSubscriptionConfig {
  channelName: string
  table: string
  filter?: string
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  handler: (payload: any) => void
}

interface PostgresChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: any
  old: any
  table: string
  schema: string
}

interface UseRealtimeSubscriptionOptions {
  maxRetries?: number
  retryDelay?: number[]
  debounceMs?: number
  onConnectionChange?: (status: ConnectionStatus, configs: RealtimeSubscriptionConfig[]) => void
}

export const useRealtimeSubscription = (
  configs: RealtimeSubscriptionConfig[],
  dependencies: any[] = [],
  options: UseRealtimeSubscriptionOptions = {}
) => {
  const {
    maxRetries = 5,
    retryDelay = [1000, 2000, 5000, 10000, 30000],
    debounceMs = 300,
    onConnectionChange
  } = options

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const channelRef = useRef<any>(null)
  const debouncedHandlersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  // Keep a live ref to configs so handlers always call the latest version
  // even after the channel is subscribed (avoids stale closure issues).
  const configsRef = useRef(configs)
  useEffect(() => {
    configsRef.current = configs
  })

  // Debounced handler to prevent rapid updates
  const createDebouncedHandler = useCallback((config: RealtimeSubscriptionConfig, index: number) => {
    return (payload: any) => {
      // Use index to make the key unique per subscription so handlers don't stomp each other
      const key = `${config.channelName}-${config.table}-${config.event || '*'}-${index}`
      
      // Clear existing timeout
      const existingTimeout = debouncedHandlersRef.current.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Set new timeout — call through configsRef so we always use the latest handler,
      // not the one captured at subscription time (avoids stale closure).
      const timeout = setTimeout(() => {
        const liveConfig = configsRef.current[index]
        if (liveConfig) {
          liveConfig.handler(payload)
        }
        debouncedHandlersRef.current.delete(key)
      }, debounceMs)

      debouncedHandlersRef.current.set(key, timeout)
    }
  }, [debounceMs])

  // Create subscription with retry logic
  const createSubscription = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    setConnectionStatus('connecting')

    const channelName = configsRef.current[0]?.channelName || `realtime-${Date.now()}`
    const channel = supabase.channel(channelName)

    // Add all event handlers — use configsRef so we register against the live config list
    configsRef.current.forEach((config, index) => {
      const debouncedHandler = createDebouncedHandler(config, index)
      
      channel.on('postgres_changes' as any, {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
        filter: config.filter
      }, debouncedHandler)
    })

    // Subscribe with status tracking
    channel.subscribe((status: string) => {
      console.log(`📡 Realtime status for ${channelName}:`, status)
      
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected')
        setRetryCount(0)
        onConnectionChange?.('connected', configs)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnectionStatus('error')
        onConnectionChange?.('error', configs)
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          const delay = retryDelay[Math.min(retryCount, retryDelay.length - 1)]
          setConnectionStatus('retrying')
          onConnectionChange?.('retrying', configs)
          
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev: number) => prev + 1)
            createSubscription()
          }, delay)
        } else {
          setConnectionStatus('disconnected')
          onConnectionChange?.('disconnected', configs)
        }
      } else if (status === 'CLOSED') {
        setConnectionStatus('disconnected')
        onConnectionChange?.('disconnected', configs)
      }
    })

    channelRef.current = channel
    return channel
  }, [retryCount, maxRetries, retryDelay, createDebouncedHandler, onConnectionChange])

  // Initialize subscription
  useEffect(() => {
    if (!configs.length) return

    const channel = createSubscription()

    return () => {
      // Cleanup
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      
      // Clear all debounced handlers
      debouncedHandlersRef.current.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
      debouncedHandlersRef.current.clear()
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, dependencies) // Re-subscribe when dependencies change

  // Manual reconnection
  const reconnect = useCallback(() => {
    setRetryCount(0)
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }
    createSubscription()
  }, [createSubscription])

  return {
    connectionStatus,
    retryCount,
    reconnect,
    isConnected: connectionStatus === 'connected'
  }
}
