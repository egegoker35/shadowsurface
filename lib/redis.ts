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

export async function publishScanJob(scanId: string, payload: object) {
  await redis.lpush('scan:queue', JSON.stringify({ scanId, payload, enqueuedAt: Date.now() }));
}

export async function getJobStatus(scanId: string) {
  const data = await redis.get(`scan:status:${scanId}`);
  return data ? JSON.parse(data) : null;
}

export async function setJobStatus(scanId: string, status: object) {
  await redis.setex(`scan:status:${scanId}`, 3600, JSON.stringify(status));
}

// Demo scan helpers (no DB dependency)
export async function setDemoResult(scanId: string, result: object) {
  await redis.setex(`demo:result:${scanId}`, 3600, JSON.stringify(result));
}

export async function getDemoResult(scanId: string) {
  const data = await redis.get(`demo:result:${scanId}`);
  return data ? JSON.parse(data) : null;
}
