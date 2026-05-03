import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isAdmin(headers: Headers): { valid: boolean; reason?: string; decoded?: any } {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { valid: false, reason: 'No Bearer token' };
  }
  const token = auth.slice(7);
  const decoded = verifyToken<{ userId: string; email: string; role?: string }>(token);
  if (!decoded) {
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET;
      jwt.verify(token, secret || '');
    } catch (e: any) {
      return { valid: false, reason: `JWT verify failed: ${e.message}` };
    }
    return { valid: false, reason: 'Token decoded null but no error' };
  }
  if (decoded.role !== 'admin') {
    return { valid: false, reason: `Role is '${decoded.role}', expected 'admin'` };
  }
  return { valid: true, decoded };
}

export async function GET(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) {
      return NextResponse.json({ error: 'Forbidden', reason: check.reason, envSecretExists: !!process.env.JWT_SECRET }, { status: 403 });
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
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
