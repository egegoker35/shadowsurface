import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isReadOnly } from '@/lib/auth';
import crypto from 'crypto';
import { effectivePlan } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/**
 * Seats included in each plan. Pricing sells 1 / 5 / unlimited seats, so the invite
 * endpoint has to enforce the same numbers - before this check any plan could invite
 * without limit, which made the seat pricing meaningless.
 */
const SEAT_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  professional: 5,
};

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await prisma.invite.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ invites: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isReadOnly(user)) return NextResponse.json({ error: 'Read-only account' }, { status: 403 });

    const body = await req.json();
    const email = String(body?.email || '').toLowerCase().trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: user.orgId }, select: { plan: true, name: true } });
    const plan = effectivePlan(org);
    const maxSeats = plan === 'enterprise' ? Number.POSITIVE_INFINITY : (SEAT_LIMITS[plan] ?? 1);

    const [members, pending] = await Promise.all([
      prisma.user.count({ where: { orgId: user.orgId } }),
      prisma.invite.count({ where: { orgId: user.orgId, accepted: false, expiresAt: { gt: new Date() } } }),
    ]);
    if (Number.isFinite(maxSeats) && members + pending >= maxSeats) {
      return NextResponse.json(
        { error: `The ${plan} plan includes ${maxSeats} seat(s). Upgrade the plan to invite more people.` },
        { status: 403 },
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

    const duplicate = await prisma.invite.findFirst({
      where: { orgId: user.orgId, email, accepted: false, expiresAt: { gt: new Date() } },
    });
    if (duplicate) {
      return NextResponse.json({ error: 'An invitation for this email is already pending', link: `/invite/${duplicate.token}` }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invite = await prisma.invite.create({
      data: { email, token, role: 'user', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), orgId: user.orgId },
    });
    return NextResponse.json({ invite, link: `/invite/${invite.token}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.invite.deleteMany({ where: { id, orgId: user.orgId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
