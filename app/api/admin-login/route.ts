import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'egegoker35@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({ userId: 'admin', email: ADMIN_EMAIL, role: 'admin' }, '30d');
    return NextResponse.json({ token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}
