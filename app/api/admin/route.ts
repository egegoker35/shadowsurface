import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isAdmin(headers: Headers): { valid: boolean; reason?: string; decoded?: any } {
  const auth = headers.get('authorization');
  console.log('[AdminAPI] Auth header exists:', !!auth);
  if (!auth?.startsWith('Bearer ')) {
    return { valid: false, reason: 'No Bearer token' };
  }
  const token = auth.slice(7);
  console.log('[AdminAPI] Token length:', token.length);
  const decoded = verifyToken<{ userId: string; email: string; role?: string }>(token);
  console.log('[AdminAPI] Decoded:', decoded);
  if (!decoded) {
    return { valid: false, reason: 'Token invalid or expired' };
  }
  if (decoded.role !== 'admin') {
    return { valid: false, reason: `Role is '${decoded.role}', expected 'admin'` };
  }
  return { valid: true, decoded };
}

export async function GET(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    console.log('[AdminAPI] Auth check:', check);
    if (!check.valid) {
      return NextResponse.json({ error: 'Forbidden', reason: check.reason }, { status: 403 });
    }

    const [totalUsers, totalScans, totalRevenue, recentUsers, recentScans, recentPayments] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, email: true, createdAt: true, role: true, org: { select: { plan: true } } } }),
      prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, target: true, status: true, scanType: true, createdAt: true } }),
      prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, txHash: true, email: true, plan: true, amount: true, createdAt: true } }),
    ]);
    return NextResponse.json({ totalUsers, totalScans, totalRevenue: totalRevenue._sum.amount || 0, recentUsers, recentScans, recentPayments });
  } catch (e: any) {
    console.error('[AdminAPI Error]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
