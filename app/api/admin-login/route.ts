import { NextRequest, NextResponse } from 'next/server';
export const runtime = "nodejs";
import { createToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    console.log('[AdminLogin] Request received');
    console.log('[AdminLogin] JWT_SECRET exists:', !!JWT_SECRET, 'length:', JWT_SECRET?.length);
    console.log('[AdminLogin] ADMIN_EMAIL exists:', !!ADMIN_EMAIL);
    console.log('[AdminLogin] ADMIN_PASSWORD exists:', !!ADMIN_PASSWORD);

    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      return NextResponse.json({ error: 'Server misconfigured: JWT_SECRET missing or too short' }, { status: 503 });
    }
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Server misconfigured: admin credentials missing' }, { status: 503 });
    }

    const body = await req.json();
    const { email, password } = body || {};
    console.log('[AdminLogin] Received email:', email);
    console.log('[AdminLogin] Email match:', email === ADMIN_EMAIL);
    console.log('[AdminLogin] Password match:', password === ADMIN_PASSWORD);

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({ userId: 'admin', email: ADMIN_EMAIL, role: 'admin' }, '30d');
    console.log('[AdminLogin] Token created, length:', token.length);
    return NextResponse.json({ token, success: true });
  } catch (e: any) {
    console.error('[AdminLogin Error]', e);
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}
