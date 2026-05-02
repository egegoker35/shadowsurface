import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createToken } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin login not configured' }, { status: 503 });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({ userId: 'admin', email: ADMIN_EMAIL, role: 'admin' }, '30d');
    return NextResponse.json({ token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}
