import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isReadOnly } from '@/lib/auth';
import { rateLimitByUser } from '@/lib/middleware/rateLimit';
import { newDomainToken, normalizeDomainInput, verificationRecordName } from '@/lib/domains';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_DOMAINS_PER_ORG = 25;

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const domains = await prisma.domain.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
    });
    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { requireDomainVerification: true },
    });
    return NextResponse.json({
      domains: domains.map((d) => ({
        ...d,
        recordName: verificationRecordName(d.domain),
      })),
      requireDomainVerification: org?.requireDomainVerification ?? false,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isReadOnly(user)) return NextResponse.json({ error: 'Read-only account' }, { status: 403 });

    const rl = await rateLimitByUser(user.id, 20, 3600);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const domain = normalizeDomainInput(body?.domain);
    if (!domain) return NextResponse.json({ error: 'Enter a valid domain, for example example.com' }, { status: 400 });

    const count = await prisma.domain.count({ where: { orgId: user.orgId } });
    if (count >= MAX_DOMAINS_PER_ORG) {
      return NextResponse.json({ error: `Limit of ${MAX_DOMAINS_PER_ORG} domains per organization` }, { status: 403 });
    }

    const existing = await prisma.domain.findUnique({ where: { orgId_domain: { orgId: user.orgId, domain } } });
    if (existing) {
      return NextResponse.json({ error: 'This domain is already on your list', domain: existing }, { status: 409 });
    }

    const created = await prisma.domain.create({
      data: { domain, orgId: user.orgId, token: newDomainToken() },
    });
    return NextResponse.json({
      domain: { ...created, recordName: verificationRecordName(created.domain) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isReadOnly(user)) return NextResponse.json({ error: 'Read-only account' }, { status: 403 });
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.domain.deleteMany({ where: { id, orgId: user.orgId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
