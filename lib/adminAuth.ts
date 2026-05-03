import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function isAdmin(headers: Headers): { valid: boolean; decoded?: any; reason?: string } {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return { valid: false, reason: 'No Bearer token' };
  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return { valid: false, reason: 'JWT_SECRET not set' };
  try {
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.role !== 'admin') return { valid: false, reason: 'Not admin' };
    return { valid: true, decoded };
  } catch (e: any) {
    return { valid: false, reason: `JWT error: ${e.message}` };
  }
}

export function adminForbidden(reason?: string) {
  return NextResponse.json({ error: 'Forbidden', reason }, { status: 403 });
}
