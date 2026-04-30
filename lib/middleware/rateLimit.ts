import { redis } from '@/lib/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / windowSeconds);
  const redisKey = `rate:${key}:${windowKey}`;

  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, windowSeconds);

  const results = await pipeline.exec();
  const current = (results?.[0]?.[1] as number) || 1;

  return {
    success: current <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - current),
    reset: (windowKey + 1) * windowSeconds,
  };
}

export async function rateLimitByIP(
  ip: string,
  maxRequests = 10,
  windowSeconds = 60
): Promise<RateLimitResult> {
  return rateLimit(`ip:${ip}`, maxRequests, windowSeconds);
}

export async function rateLimitByUser(
  userId: string,
  maxRequests = 50,
  windowSeconds = 60
): Promise<RateLimitResult> {
  return rateLimit(`user:${userId}`, maxRequests, windowSeconds);
}

export async function rateLimitByEndpoint(
  ip: string,
  endpoint: string,
  maxRequests = 5,
  windowSeconds = 60
): Promise<RateLimitResult> {
  return rateLimit(`ep:${endpoint}:${ip}`, maxRequests, windowSeconds);
}

export async function slidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `sw:${key}`;

  // Remove old entries
  await redis.zremrangebyscore(redisKey, 0, windowStart);
  // Count current
  const current = await redis.zcard(redisKey);
  // Add current request
  await redis.zadd(redisKey, now, `${now}:${Math.random()}`);
  // Set expiry on the key
  await redis.pexpire(redisKey, windowMs);

  return {
    success: current < maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - current - 1),
    reset: Math.floor((now + windowMs) / 1000),
  };
}
