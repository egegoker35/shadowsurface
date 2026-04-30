import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(8), organizationName: z.string().min(2) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { email, password, organizationName } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    const org = await prisma.organization.create({ data: { name: organizationName, plan: 'starter' } });
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash, orgId: org.id } });
    const token = randomUUID();
    await prisma.verificationToken.create({ data: { email, token, expiresAt: new Date(Date.now() + 24*60*60*1000) } });
    await sendVerificationEmail(email, token);
    const jwt = createToken({ userId: user.id, email: user.email, orgId: org.id });
    return NextResponse.json({ token: jwt, user: { id: user.id, email: user.email, verified: user.verified }, organization: org });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
