import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [
      totalUsers,
      totalScans,
      totalRevenue,
      recentUsers,
      recentScans,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, email: true, createdAt: true, role: true, org: { select: { plan: true } } } }),
      prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, target: true, status: true, scanType: true, createdAt: true } }),
      prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, txHash: true, email: true, plan: true, amount: true, createdAt: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalScans,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentUsers,
      recentScans,
      recentPayments,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
