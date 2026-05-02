import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');
    if (!scanId) return NextResponse.json({ error: 'scanId required' }, { status: 400 });

    const scan = await prisma.scan.findFirst({ where: { id: scanId, orgId: user.orgId }, include: { assets: true, cloudAssets: true } });
    if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });

    const summary = (scan.executiveSummary as any) || {};
    const stats = (scan.statistics as any) || {};

    // Generate markdown report since PDF generation in Next.js route is complex
    const lines: string[] = [];
    lines.push(`# ShadowSurface Attack Surface Report`);
    lines.push(`**Target:** ${scan.target}`);
    lines.push(`**Date:** ${new Date(scan.createdAt).toUTCString()}`);
    lines.push(`**Overall Risk:** ${summary.overallRisk || 'N/A'}`);
    lines.push(`**Critical Findings:** ${summary.criticalFindings || 0}`);
    lines.push(`---`);
    lines.push(`## Statistics`);
    lines.push(`- Subdomains: ${stats.totalSubdomains || 0}`);
    lines.push(`- Assets: ${stats.totalAssets || 0}`);
    lines.push(`- Cloud Issues: ${stats.totalCloudAssets || 0}`);
    lines.push(`- High Risk Count: ${stats.highRiskCount || 0}`);
    lines.push(`- Duration: ${Math.round(scan.durationSeconds || 0)}s`);
    lines.push(`---`);
    lines.push(`## Assets`);
    for (const a of scan.assets || []) {
      lines.push(`### ${a.subdomain || a.ip} :${a.port}`);
      lines.push(`- Service: ${a.service || 'N/A'}`);
      lines.push(`- Technology: ${a.technology || 'N/A'} ${a.version || ''}`);
      lines.push(`- Risk Score: ${a.riskScore}`);
      if (a.cves?.length) lines.push(`- CVEs: ${a.cves.join(', ')}`);
      const findings = (a.findings as any[]) || [];
      if (findings.length) {
        lines.push(`- Findings:`);
        for (const f of findings) lines.push(`  - [${f.severity}] ${f.description}`);
      }
    }
    if ((scan.cloudAssets || []).length > 0) {
      lines.push(`---`);
      lines.push(`## Cloud Misconfigurations`);
      for (const c of scan.cloudAssets || []) {
        lines.push(`- **${c.provider}** ${c.serviceType}: ${c.resourceId} (Severity: ${c.severity})`);
      }
    }
    lines.push(`---`);
    lines.push(`## Recommendations`);
    for (const r of summary.recommendations || []) lines.push(`- ${r}`);

    const md = lines.join('\n');
    return new NextResponse(md, {
      headers: { 'Content-Type': 'text/markdown', 'Content-Disposition': `attachment; filename="shadowsurface-report-${scan.target}.md"` },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
