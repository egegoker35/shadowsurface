import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: object, expiresIn: string | number = '7d'): string {
  const secret = getSecret();
  const exp = typeof expiresIn === 'number' ? expiresIn : undefined;
  const jwt = new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();
  if (exp) jwt.setExpirationTime(Math.floor(Date.now() / 1000) + exp);
  else jwt.setExpirationTime(expiresIn as string);
  return jwt.sign(secret);
}

export function verifyToken<T>(token: string): T | null {
  try {
    const secret = getSecret();
    const { payload } = jwtVerify(token, secret, { clockTolerance: 60 });
    return payload as T;
  } catch (e: any) {
    console.error('[verifyToken] Error:', e.message);
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
