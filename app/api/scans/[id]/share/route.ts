import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// POST { public: boolean } — toggle public sharing for a scan
// GET — current share status + public URL
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scan = await prisma.scan.findFirst({ where: { id: params.id, orgId: user.orgId } });
    if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (scan.status !== 'completed') {
      return NextResponse.json({ error: 'Only completed scans can be shared' }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    const makePublic = body?.public === true;
    const updated = await prisma.scan.update({
      where: { id: scan.id },
      data: { isPublic: makePublic, sharedAt: makePublic ? new Date() : null },
    });
    const origin = req.nextUrl.origin;
    return NextResponse.json({
      scan: updated,
      publicUrl: `${origin}/report/${scan.id}`,
      message: makePublic ? 'Report is now public' : 'Public sharing disabled',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scan = await prisma.scan.findFirst({
      where: { id: params.id, orgId: user.orgId },
      select: { id: true, target: true, isPublic: true, sharedAt: true, status: true, createdAt: true },
    });
    if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ scan, publicUrl: `${req.nextUrl.origin}/report/${scan.id}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}