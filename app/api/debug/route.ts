import { NextRequest, NextResponse } from 'next/server';
import { createToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    const testToken = createToken({ userId: 'admin', email: 'test@test.com', role: 'admin' }, '1h');
    const decoded = verifyToken<any>(testToken);
    return NextResponse.json({
      jwtSecretExists: !!jwtSecret,
      jwtSecretLength: jwtSecret?.length,
      jwtSecretPreview: jwtSecret ? jwtSecret.substring(0, 8) + '...' : null,
      testTokenCreated: !!testToken,
      testTokenLength: testToken?.length,
      decoded,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const decoded = verifyToken<any>(token);
    return NextResponse.json({ decoded });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
