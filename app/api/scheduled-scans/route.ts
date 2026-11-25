import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { configForPlan, effectivePlan, VALID_SCAN_TYPES } from '@/lib/plans';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput } from '@/lib/middleware/security';

export const dynamic = 'force-dynamic';

function parseCron(cron: string): Date {
  // Simple: daily, weekly, monthly presets
  const now = new Date();
  switch (cron) {
    case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await prisma.scheduledScan.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ scheduledScans: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { name, target, scanType, cron } = body;
    if (!name || !target || !scanType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const type = String(scanType).toLowerCase();
    if (!VALID_SCAN_TYPES.includes(type) || type === 'bulk') {
      return NextResponse.json({ error: 'Invalid scan type for a scheduled scan' }, { status: 400 });
    }
    if (hasSuspiciousInput(String(target))) return NextResponse.json({ error: 'Suspicious input' }, { status: 400 });
    const cleanTarget = sanitizeTarget(String(target).trim());
    if (isBlockedTarget(cleanTarget)) return NextResponse.json({ error: 'Target blocked' }, { status: 403 });

    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    // An expired paid period must not keep scheduled-scan limits.
    const plan = effectivePlan(org);
    const config = configForPlan(plan);
    if (!config.allowedTypes.includes(type)) {
      return NextResponse.json({ error: `${type} scan is not included in the ${plan} plan. Upgrade at /pricing` }, { status: 403 });
    }

    const item = await prisma.scheduledScan.create({
      data: { name, target: cleanTarget, scanType: type, cron: cron || 'daily', nextRun: parseCron(cron || 'daily'), orgId: user.orgId },
    });
    return NextResponse.json({ scheduledScan: item });
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
    await prisma.scheduledScan.deleteMany({ where: { id, orgId: user.orgId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
