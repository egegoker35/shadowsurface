import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scan = await prisma.scan.findFirst({ where: { id: params.id, orgId: user.orgId }, include: { assets: true, cloudAssets: true } });
    if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // The dashboard reads fields that only exist in the persisted engine result
    // (webVulns, sslGrade, dnsAnalysis, coverage, cveDetails, discoveredEndpoints).
    // Serving only the relational columns silently hid those sections, so merge the
    // full result over the row and keep the database identity fields authoritative.
    const { resultJson, ...row } = scan as any;
    const result = (resultJson && typeof resultJson === 'object' ? resultJson : {}) as any;
    const merged = {
      ...row,
      ...result,
      id: row.id,
      orgId: row.orgId,
      status: row.status,
      scanType: row.scanType,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      assets: Array.isArray(result.assets) && result.assets.length > 0 ? result.assets : row.assets,
      cloudAssets: Array.isArray(result.cloudAssets) && result.cloudAssets.length > 0 ? result.cloudAssets : row.cloudAssets,
      durationSeconds: row.durationSeconds ?? result.durationSeconds ?? null,
      executiveSummary: result.executiveSummary ?? row.executiveSummary ?? null,
      statistics: result.statistics ?? row.statistics ?? null,
    };
    return NextResponse.json({ scan: merged });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
