import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'
import { NextResponse } from 'next/server'

/**
 * Rate limiters for tabeza-customer.
 */

/** OTP / verification send — 5 per 15 minutes per phone number */
export const otpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:customer:otp',
})

/** Order placement — 10 per 30s per tab */
export const orderPlacementLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '30 s'),
  analytics: true,
  prefix: 'ratelimit:customer:order',
})

/** Signup attempts — 3 per hour per IP */
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:customer:signup',
})

/**
 * Helper: apply rate limit and return 429 if exceeded.
 * Fails open — allows request through if Redis is down.
 */
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<NextResponse | null> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
          limit,
          remaining,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }
    return null
  } catch {
    console.warn('[ratelimit] Rate limiter failed, allowing request')
    return null
  }
}