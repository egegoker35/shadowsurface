import { NextRequest, NextResponse } from 'next/server';
export const runtime = "nodejs";
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function isAdmin(headers: Headers): { valid: boolean; reason?: string; decoded?: any } {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { valid: false, reason: 'No Bearer token in header' };
  }
  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return { valid: false, reason: 'JWT_SECRET not set on server' };
  }
  try {
    const decoded = jwt.verify(token, secret) as any;
    console.log('[AdminAPI] Decoded:', decoded);
    if (decoded.role !== 'admin') {
      return { valid: false, reason: `Role is '${decoded.role}', expected 'admin'` };
    }
    return { valid: true, decoded };
  } catch (e: any) {
    console.log('[AdminAPI] JWT verify error:', e.message);
    return { valid: false, reason: `JWT verify error: ${e.message}` };
  }
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
