import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { z } from 'zod';
import { clientIp } from '@/lib/middleware/security';

export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(16).max(128),
  password: z.string().min(8).max(200),
});

/** Look up an invitation so the accept page can show who it is for before asking for a password. */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ valid: false, error: 'Missing invitation token' }, { status: 400 });

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { org: { select: { name: true } } },
    });
    if (!invite) return NextResponse.json({ valid: false, error: 'Invitation not found' }, { status: 404 });
    if (invite.accepted) return NextResponse.json({ valid: false, error: 'This invitation has already been used' }, { status: 410 });
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ valid: false, error: 'This invitation has expired' }, { status: 410 });
    }

    return NextResponse.json({ valid: true, email: invite.email, organization: invite.org.name });
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * Redeem an invitation. The invite endpoint refuses to create an invitation for an email
 * that already has an account, so acceptance always provisions a new user inside the
 * inviting organization.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    const rl = await rateLimitByIP(ip, 10, 3600);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const { token, password } = parsed.data;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { org: { select: { name: true } } },
    });
    if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    if (invite.accepted) return NextResponse.json({ error: 'This invitation has already been used' }, { status: 410 });
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    const email = invite.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in instead.' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, passwordHash, verified: true, role: invite.role || 'user', orgId: invite.orgId },
      });
      // Keep the invitation for the team page's audit trail, but mark it consumed so the
      // token cannot create a second account.
      await tx.invite.update({ where: { id: invite.id }, data: { accepted: true } });
      return created;
    });

    const jwt = createToken({ userId: user.id, email: user.email, orgId: user.orgId });
    return NextResponse.json({
      token: jwt,
      user: { id: user.id, email: user.email, verified: user.verified, role: user.role },
      organization: invite.org.name,
    });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
