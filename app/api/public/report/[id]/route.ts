import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public (unauthenticated) report endpoint.
// Only serves scans explicitly shared by their owner via the Share toggle.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        target: true,
        scanType: true,
        status: true,
        resultJson: true,
        statistics: true,
        executiveSummary: true,
        durationSeconds: true,
        isPublic: true,
        sharedAt: true,
        createdAt: true,
        assets: { select: { subdomain: true, ip: true, port: true, service: true, technology: true, version: true, cves: true, riskScore: true, findings: true, headers: true, sslInfo: true, waf: true } },
        cloudAssets: { select: { provider: true, serviceType: true, resourceId: true, url: true, permissions: true, misconfigurations: true, riskScore: true, severity: true } },
      },
    });
    if (!scan || scan.status !== 'completed') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (!scan.isPublic) {
      return NextResponse.json({ error: 'This report is not public' }, { status: 404 });
    }
    return NextResponse.json({ scan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}