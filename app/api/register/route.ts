import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email(), password: z.string().min(8), organizationName: z.string().min(2) });

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimitByIP(ip, 5, 3600);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many registration attempts. Try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error('[Register] Validation failed:', parsed.error.format());
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email: rawEmail, password, organizationName } = parsed.data;
    const email = rawEmail.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    const org = await prisma.organization.create({ data: { name: organizationName, plan: 'free' } });
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash, verified: true, orgId: org.id } });
    const jwt = createToken({ userId: user.id, email: user.email, orgId: org.id });
    return NextResponse.json({ token: jwt, user: { id: user.id, email: user.email, verified: user.verified }, organization: org });
  } catch (e: any) {
    console.error('[Register API Error]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
