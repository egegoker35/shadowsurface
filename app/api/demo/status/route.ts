import { NextRequest, NextResponse } from 'next/server';
import { getDemoResult } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const scanId = req.nextUrl.searchParams.get('scanId');
    if (!scanId) return NextResponse.json({ error: 'Missing scanId' }, { status: 400 });

    const result = await getDemoResult(scanId);
    if (result) return NextResponse.json({ status: 'completed', result });

    return NextResponse.json({ status: 'pending', scanId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
