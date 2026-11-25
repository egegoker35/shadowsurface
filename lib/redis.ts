import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED'];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

redis.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});
