import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { nextPeriodEnd } from '@/lib/plans';

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const MY_ADDRESS = 'THZzRBItyb8bhGczJgSFVNGjjt6x4MC3PL';
const MAX_TX_AGE_MS = 72 * 60 * 60 * 1000;

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 99,
  professional: 499,
  enterprise: 1999,
};

type Trc20Transfer = {
  type?: string;
  contract_address?: string;
  to_address?: string;
  amount_str?: string;
  amountStr?: string;
  decimals?: number;
  status?: number;
};

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = await rateLimitByIP(`pay:${ip}`, 10, 600).catch(() => ({ success: true }));
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const { txHash, email, plan } = await req.json();
    if (!txHash || !email || !plan) {
      return NextResponse.json({ error: 'txHash, email, plan required' }, { status: 400 });
    }

    if (plan === 'free') {
      return NextResponse.json({ error: 'Free plan cannot be activated via payment' }, { status: 400 });
    }

    const expectedAmount = PLAN_AMOUNTS[plan];
    if (!expectedAmount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Replay attack prevention
    const existingPayment = await prisma.payment.findUnique({ where: { txHash } });
    if (existingPayment) {
      return NextResponse.json({ error: 'This transaction has already been used' }, { status: 400 });
    }

    // Verify via TronScan API
    const res = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${encodeURIComponent(txHash)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'ShadowSurface/1.0' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'TronScan API failed' }, { status: 500 });

    const data = await res.json();

    if (!data || !data.hash) {
      return NextResponse.json({ error: 'Transaction not found on Tron' }, { status: 400 });
    }
    if (data.contractRet && data.contractRet !== 'SUCCESS') {
      return NextResponse.json({ error: 'Transaction did not succeed on-chain' }, { status: 400 });
    }

    // TronScan exposes TRC20 transfers in trc20TransferInfo; triggers[] is empty for these.
    const transfers: Trc20Transfer[] = Array.isArray(data.trc20TransferInfo) ? data.trc20TransferInfo : [];
    const transfer = transfers.find(
      (t) =>
        (t.type === undefined || t.type === 'Transfer') &&
        t.to_address &&
        t.contract_address &&
        (t.contract_address || '').toLowerCase() === USDT_CONTRACT.toLowerCase(),
    );
    if (!transfer) return NextResponse.json({ error: 'Not a USDT transfer' }, { status: 400 });

    if (typeof transfer.status === 'number' && transfer.status !== 0) {
      return NextResponse.json({ error: 'Transfer failed on-chain' }, { status: 400 });
    }

    if ((transfer.to_address || '').toLowerCase() !== MY_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Recipient address mismatch' }, { status: 400 });
    }

    const decimals = Number.isFinite(transfer.decimals) ? Number(transfer.decimals) : 6;
    const rawAmount = Number(transfer.amount_str ?? transfer.amountStr ?? 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ error: 'Transfer amount missing' }, { status: 400 });
    }
    const amount = rawAmount / 10 ** decimals;
    const tolerance = 1; // $1 tolerance for exchange rounding
    if (amount < expectedAmount - tolerance) {
      return NextResponse.json(
        { error: `Insufficient amount. Expected ${expectedAmount} USDT, got ${amount.toFixed(2)} USDT` },
        { status: 400 },
      );
    }

    const confirmations = Number(data.confirmations || 0);
    if (confirmations < 1 && data.confirmed !== true) {
      return NextResponse.json({ error: 'Transaction not yet confirmed. Wait 1-2 minutes and try again.' }, { status: 400 });
    }

    // A public transfer hash can be copied from the explorer, so only accept recent payments.
    const txTime = Number(data.timestamp);
    if (Number.isFinite(txTime) && txTime > 0 && Date.now() - txTime > MAX_TX_AGE_MS) {
      return NextResponse.json(
        { error: 'This transaction is more than 72 hours old. Email support with the hash for manual activation.' },
        { status: 400 },
      );
    }

    // Find or create user
    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    let tempPassword: string | undefined;

    if (!user) {
      // Auto-create user and org. The buyer has no password yet, so one is issued once
      // and returned to the checkout page; otherwise the success screen would lead to a
      // login they cannot complete.
      const { hashPassword } = await import('@/lib/auth');
      tempPassword = crypto.randomBytes(9).toString('base64url');
      const org = await prisma.organization.create({
        data: { name: normalizedEmail.split('@')[0], plan, planStartedAt: new Date(), planExpiresAt: nextPeriodEnd(null) },
      });
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: await hashPassword(tempPassword),
          verified: true,
          orgId: org.id,
        },
      });
    } else {
      // Paying for the same plan again renews the period; switching plans starts a new one.
      const current = await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { plan: true, planExpiresAt: true },
      });
      const renewal = current?.plan === plan && !!current?.planExpiresAt;
      await prisma.organization.update({
        where: { id: user.orgId },
        data: {
          plan,
          planExpiresAt: nextPeriodEnd(renewal ? current!.planExpiresAt : null),
          ...(renewal ? {} : { planStartedAt: new Date() }),
        },
      });
    }

    await prisma.payment.create({
      data: { txHash, email: normalizedEmail, plan, amount },
    });

    return NextResponse.json({
      success: true,
      message: `Payment verified! ${plan} plan activated.`,
      tempPassword,
    });
  } catch (e: any) {
    console.error('[Payment Verify]', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
