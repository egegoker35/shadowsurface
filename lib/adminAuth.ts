import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function isAdmin(headers: Headers): { valid: boolean; decoded?: any; reason?: string } {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return { valid: false };
  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return { valid: false };
  try {
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.role !== 'admin') return { valid: false };
    return { valid: true, decoded };
  } catch {
    return { valid: false };
  }
}

export function adminForbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
