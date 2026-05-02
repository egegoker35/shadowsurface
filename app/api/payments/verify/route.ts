import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const MY_ADDRESS = 'THZzRBItyb8bhGczJgSFVNGjjt6x4MC3PL';

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 99,
  professional: 499,
  enterprise: 1999,
};

export async function POST(req: NextRequest) {
  try {
    const { txHash, email, plan } = await req.json();
    if (!txHash || !email || !plan) {
      return NextResponse.json({ error: 'txHash, email, plan required' }, { status: 400 });
    }

    const expectedAmount = PLAN_AMOUNTS[plan];
    if (!expectedAmount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Verify via TronScan API
    const res = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return NextResponse.json({ error: 'TronScan API failed' }, { status: 500 });

    const data = await res.json();

    // Check if it's a USDT TRC20 transfer
    const trigger = data.triggers?.[0];
    if (!trigger) return NextResponse.json({ error: 'Not a token transfer' }, { status: 400 });

    const contract = trigger.contract_address;
    const to = trigger.parameter_value?._to || trigger.parameter_value?.to;
    const amountStr = trigger.parameter_value?._value || trigger.parameter_value?.value;

    if (contract?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
      return NextResponse.json({ error: 'Not a USDT transfer' }, { status: 400 });
    }

    if (to?.toLowerCase() !== MY_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Recipient address mismatch' }, { status: 400 });
    }

    // USDT has 6 decimals
    const amount = parseInt(amountStr) / 1_000_000;
    const tolerance = 1; // $1 tolerance
    if (amount < expectedAmount - tolerance) {
      return NextResponse.json({ error: `Insufficient amount. Expected ${expectedAmount} USDT, got ${amount.toFixed(2)} USDT` }, { status: 400 });
    }

    // Check confirmations
    if (data.confirmations < 1) {
      return NextResponse.json({ error: 'Transaction not yet confirmed. Wait 1-2 minutes and try again.' }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    
    if (!user) {
      // Auto-create user and org
      const { hashPassword } = await import('@/lib/auth');
      const tempPassword = Math.random().toString(36).slice(2, 10);
      const org = await prisma.organization.create({ data: { name: email.split('@')[0], plan } });
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: await hashPassword(tempPassword),
          verified: true,
          orgId: org.id,
        },
      });
    } else {
      await prisma.organization.update({
        where: { id: user.orgId },
        data: { plan },
      });
    }

    return NextResponse.json({ success: true, message: `Payment verified! ${plan} plan activated.` });
  } catch (e: any) {
    console.error('[Payment Verify]', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
