import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET?.trim();

export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      return NextResponse.json({ error: 'Server misconfigured: JWT_SECRET missing' }, { status: 503 });
    }
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Server misconfigured: admin credentials missing' }, { status: 503 });
    }
    const body = await req.json();
    const { email, password } = body || {};
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = jwt.sign({ userId: 'admin', email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
    return NextResponse.json({ token, success: true });
  } catch (e: any) {
    console.error('[AdminLogin Error]', e);
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}
