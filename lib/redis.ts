import { Redis } from '@upstash/redis'

/**
 * Upstash Redis client singleton.
 * Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment variables.
 * Works over HTTPS — no persistent TCP connection required, ideal for Next.js/Vercel serverless.
 *
 * Add to .env.local:
 *   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=your-token
 */
export const redis = Redis.fromEnv()