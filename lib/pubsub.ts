import { redis } from './redis'

/**
 * Redis Pub/Sub event bus for cross-app server-to-server communication.
 *
 * Channels follow the pattern: tabeza:events:<domain>
 *
 * Examples:
 *   tabeza:events:orders        — order placed, accepted, declined
 *   tabeza:events:payments      — payment received, M-Pesa confirmed
 *   tabeza:events:tabs          — tab opened, closed, overdue
 *   tabeza:events:marketplace   — hire request sent, accepted, declined
 *   tabeza:events:shifts        — crew checked in/out, shift started/ended
 *   tabeza:events:notifications — cross-app notification fan-out
 *
 * Usage (publish from an API route):
 *   await publishEvent('orders', { action: 'accepted', tabId, orderId })
 *
 * Usage (subscribe from a server-side handler — not supported in browser):
 *   This module works with Upstash Redis over HTTP. True pub/sub subscribe
 *   requires the TCP-based `ioredis` client or Upstash's WebSocket support.
 *   For server-to-server fan-out, use publish here and handle events in
 *   each app's API route that receives the notification.
 */

/** Standard event channel prefix */
const CHANNEL_PREFIX = 'tabeza:events'

/** Well-known event domains */
export type EventDomain =
  | 'orders'
  | 'payments'
  | 'tabs'
  | 'marketplace'
  | 'shifts'
  | 'notifications'
  | 'loyalty'

/** Shape of a published event */
export interface PubSubEvent {
  /** Domain/namespace for this event */
  domain: EventDomain
  /** Action that occurred (e.g. "placed", "accepted", "confirmed") */
  action: string
  /** ISO timestamp when event was published */
  timestamp: string
  /** Arbitrary payload — keep as flat as possible, avoid nested objects */
  payload: Record<string, unknown>
}

/**
 * Publish an event to a Redis pub/sub channel.
 * All apps subscribing to this channel will receive the event.
 *
 * @param domain  Event domain (orders, payments, tabs, etc.)
 * @param action  What happened (placed, accepted, confirmed, etc.)
 * @param payload Flat key-value payload (avoid nested objects)
 */
export async function publishEvent(
  domain: EventDomain,
  action: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = `${CHANNEL_PREFIX}:${domain}`
  const message: PubSubEvent = {
    domain,
    action,
    timestamp: new Date().toISOString(),
    payload,
  }

  try {
    await redis.publish(channel, JSON.stringify(message))
  } catch (error) {
    // Pub/sub publish failure is non-fatal — the event still exists
    // in the source-of-truth database (Postgres/Supabase).
    console.error(`[pubsub] Failed to publish to ${channel}:`, error)
  }
}

/**
 * Key-Value based event fan-out (fallback when pub/sub subscribe isn't available).
 *
 * Instead of real-time pub/sub, this stores the event in a Redis list
 * that consumers poll (or process via a lightweight mechanism).
 * Useful when the consuming app doesn't have a persistent subscriber connection.
 *
 * @param domain  Event domain
 * @param action  What happened
 * @param payload Flat key-value payload
 */
export async function enqueueEvent(
  domain: EventDomain,
  action: string,
  payload: Record<string, unknown>
): Promise<void> {
  const key = `${CHANNEL_PREFIX}:queue:${domain}`
  const message: PubSubEvent = {
    domain,
    action,
    timestamp: new Date().toISOString(),
    payload,
  }

  try {
    // Push to a capped list (keep last 100 events per domain)
    await redis.lpush(key, JSON.stringify(message))
    await redis.ltrim(key, 0, 99)
  } catch (error) {
    console.error(`[pubsub] Failed to enqueue event to ${key}:`, error)
  }
}

/**
 * Dequeue pending events from a domain's queue.
 * Primarily useful for cron-based or polling consumers.
 *
 * @param domain Event domain to drain
 * @param count  Max number of events to fetch (default 50)
 * @returns Array of PubSubEvent objects (oldest first)
 */
export async function dequeueEvents(
  domain: EventDomain,
  count: number = 50
): Promise<PubSubEvent[]> {
  try {
    const key = `${CHANNEL_PREFIX}:queue:${domain}`
    const items = await redis.lrange(key, -count, -1)

    // Trim processed events
    if (items.length > 0) {
      await redis.ltrim(key, 0, -(items.length + 1))
    }

    return items
      .map((item: string) => {
        try {
          return JSON.parse(item) as PubSubEvent
        } catch {
          return null
        }
      })
      .filter((e): e is PubSubEvent => e !== null)
  } catch {
    return []
  }
}