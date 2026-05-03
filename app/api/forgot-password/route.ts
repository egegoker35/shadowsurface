import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimitByIP(ip, 3, 3600);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many password reset requests. Try again later.' }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await sendPasswordResetEmail(user.email, token);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Forgot Password]', e);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
