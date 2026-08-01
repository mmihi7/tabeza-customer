import { redis } from './redis'

/**
 * Cache-aside (lazy-loading) helper with TTL.
 *
 * Pattern:
 * 1. Check Redis first
 * 2. On miss → call fetcher(), write result to Redis with TTL
 * 3. On hit → return cached value
 *
 * Fails safe: if Redis is unreachable, falls through to fetcher().
 *
 * @param key       Redis cache key (e.g. "venue:discounts:bar-123")
 * @param ttlSeconds Time-to-live in seconds before cache expires
 * @param fetcher    Async function that returns fresh data from source (e.g. Supabase)
 * @returns The data, either from cache or freshly fetched
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) {
      return cached
    }
  } catch {
    // Redis miss or error — fall through to fetcher
  }

  const fresh = await fetcher()

  try {
    await redis.set(key, fresh as any, { ex: ttlSeconds })
  } catch {
    // Failed to write cache — non-fatal, data was still returned
  }

  return fresh
}

/**
 * Invalidate cache keys matching a glob pattern.
 * Uses Redis KEYS command — only suitable for low-frequency invalidation
 * (e.g., when a staff member saves discount settings).
 * For high-throughput environments, use a key set or SCAN.
 *
 * @param pattern Glob pattern (e.g. "venue:discounts:*")
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return keys.length
  } catch {
    return 0
  }
}