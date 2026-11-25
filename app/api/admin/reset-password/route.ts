import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Issue a one-time temporary password for a user.
 *
 * Customer email is not deliverable until a sending domain is verified with the mail
 * provider, so a support-driven reset is the only guaranteed recovery path today. The
 * plaintext password is returned exactly once and never stored.
 */
export async function POST(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const { userId } = await req.json().catch(() => ({}));
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const tempPassword = `Ss-${crypto.randomBytes(9).toString('base64url')}`;
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(tempPassword) } });

    // Any outstanding reset link should stop working once support has intervened.
    await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

    console.log(`[Admin] Temporary password issued for ${user.email}`);
    return NextResponse.json({ success: true, email: user.email, tempPassword });
  } catch (e: any) {
    console.error('[Admin Reset Password]', e);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
