// Fixed-window rate limiter kept in server memory: each key may make `limit`
// requests per `windowMs`. Note: on Vercel every serverless instance has its
// own memory, so this is a best-effort limit; a shared store such as Redis
// would be needed for a strict global limit.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}
