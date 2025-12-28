/**
 * Simple In-Memory Rate Limiter
 * For production, use Redis-based solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // No entry or expired entry
    if (!entry || entry.resetTime < now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetIn: config.windowMs,
      };
    }

    // Entry exists and not expired
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Discussion creation: 10 per minute
  createDiscussion: { windowMs: 60000, maxRequests: 10 },
  // Stream start: 5 per minute (expensive operation)
  startStream: { windowMs: 60000, maxRequests: 5 },
  // Moderator messages: 30 per minute
  moderatorMessage: { windowMs: 60000, maxRequests: 30 },
  // Panel operations: 20 per minute
  panelOperations: { windowMs: 60000, maxRequests: 20 },
  // General API: 100 per minute
  general: { windowMs: 60000, maxRequests: 100 },
} as const;

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[limitType];
  return rateLimiter.check(`${limitType}:${identifier}`, config);
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user-agent + accept-language (not ideal but better than nothing)
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const acceptLang = request.headers.get('accept-language') || 'unknown';
  return `anon:${hashString(userAgent + acceptLang)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(resetIn: number) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: Math.ceil(resetIn / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(resetIn / 1000)),
      },
    }
  );
}
