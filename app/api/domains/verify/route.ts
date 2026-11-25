import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isReadOnly } from '@/lib/auth';
import { fetchVerificationRecords, verificationRecordName } from '@/lib/domains';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Re-check the TXT record for one claimed domain. Verification is idempotent so a
 * customer can re-run it after editing DNS without deleting the row.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isReadOnly(user)) return NextResponse.json({ error: 'Read-only account' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const domain = await prisma.domain.findFirst({ where: { id, orgId: user.orgId } });
    if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

    const records = await fetchVerificationRecords(domain.domain);
    const matched = records.some((value) => value === domain.token);

    if (!matched) {
      return NextResponse.json(
        {
          verified: false,
          recordName: verificationRecordName(domain.domain),
          // Showing what is published helps the customer fix a typo without support.
          found: records.slice(0, 5),
          expected: domain.token,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: { verified: true, verifiedAt: new Date() },
    });
    return NextResponse.json({
      verified: true,
      domain: { ...updated, recordName: verificationRecordName(updated.domain) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
