import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimitByIP(ip, 10, 1800);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many login attempts. Try again in 30 minutes.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { email: rawEmail, password } = parsed.data;
    const email = rawEmail.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email }, include: { org: true } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const token = await createToken({ userId: user.id, email: user.email, orgId: user.orgId });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, verified: user.verified }, organization: user.org });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
