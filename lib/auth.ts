import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
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
  } catch {
    return null;
  }
}

export async function getUserFromRequest(headers: Headers) {
  const auth = headers.get('authorization');
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
