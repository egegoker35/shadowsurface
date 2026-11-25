import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: object, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken<T>(token: string): T | null {
  try {
    return jwt.verify(token, getJwtSecret()) as T;
  } catch (e: any) {
    console.error('[verifyToken] Error:', e.message);
    return null;
  }
}

export async function getUserFromRequest(headers: Headers) {
  const auth = headers.get('authorization');

  // API keys are issued by /api/api-keys and sold as "API access" on paid plans,
  // but nothing used to verify them: every request still needed a 7-day JWT.
  const presentedKey = headers.get('x-api-key') || (auth?.startsWith('Bearer ss_') ? auth.slice(7).trim() : null);
  if (presentedKey?.startsWith('ss_')) {
    const keyHash = crypto.createHash('sha256').update(presentedKey).digest('hex');
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey) return null;
    if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) return null;
    // A key belongs to the organization, so it acts as the organization's founding
    // user: scan rows carry a createdById foreign key and need a real user id.
    const owner = await prisma.user.findFirst({
      where: { orgId: apiKey.orgId },
      orderBy: { createdAt: 'asc' },
      include: { org: true },
    });
    if (!owner) return null;
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(() => {});
    return owner;
  }

  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const decoded = verifyToken<{ userId: string; email: string; orgId: string }>(token);
  if (!decoded) return null;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { org: true },
  });
  return user;
}
