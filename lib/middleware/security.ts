import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rateLimit';

const SUSPICIOUS_PATTERNS = [
  /[<>\"'`;]/,
  /\.{2,}/,
  /(javascript|data):/i,
  /\x00/,
];

const BLOCKED_HOSTS = new Set([
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '169.254.169.254',
  'metadata.google.internal',
  'alibaba.xn--io0a7i',
]);

const BLOCKED_PREFIXES = [
  '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.',
  '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
  '172.28.', '172.29.', '172.30.', '172.31.', '127.', '0.', 'fc00:', 'fe80:',
];

export function isBlockedTarget(target: string): boolean {
  const lower = target.toLowerCase().trim();
  if (BLOCKED_HOSTS.has(lower)) return true;
  if (BLOCKED_PREFIXES.some((p) => lower.startsWith(p))) return true;
  if (lower.includes('@')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(lower)) {
    const parts = lower.split('.').map(Number);
    if (parts[0] === 127 || parts[0] === 0 || parts[0] >= 224) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  }
  return false;
}

export function sanitizeTarget(target: string): string {
  return target.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 128);
}

export function hasSuspiciousInput(input: string): boolean {
  return SUSPICIOUS_PATTERNS.some((p) => p.test(input));
}

export async function abuseCheck(req: NextRequest): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Check if IP is globally banned first
  const { redis } = await import('@/lib/redis');
  const banned = await redis.get(`ban:${ip}`);
  if (banned) {
    return NextResponse.json({ error: 'IP temporarily banned due to abuse.' }, { status: 403 });
  }

  // Global: 10 requests per IP per minute (very strict)
  const global = await rateLimit(`global:${ip}`, 10, 60);
  if (!global.success) {
    await blockIfAbusive(ip, 1);
    return NextResponse.json({ error: 'Abuse detected. Slow down.' }, { status: 429 });
  }

  return null;
}

export async function blockIfAbusive(ip: string, threshold = 2): Promise<void> {
  const abuseKey = `abuse:${ip}`;
  const { redis } = await import('@/lib/redis');
  const count = await redis.incr(abuseKey);
  await redis.expire(abuseKey, 3600);
  if (count >= threshold) {
    await redis.setex(`ban:${ip}`, 7200, '1'); // Ban for 2 hours
    console.warn(`[Security] IP ${ip} banned for abuse. Count: ${count}`);
  }
}
