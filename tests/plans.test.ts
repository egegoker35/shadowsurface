import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_CONFIG, configForPlan, effectivePlan, isExpired, nextPeriodEnd, daysLeft } from '../lib/plans';

const DAY = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(Date.now() + n * DAY);

test('unknown and empty plans resolve to the free tier, never a paid one', () => {
  for (const plan of [undefined, null, '', 'bogus', 'PRO', 'enterprise ']) {
    assert.equal(configForPlan(plan as any), PLAN_CONFIG.free, `plan ${JSON.stringify(plan)}`);
  }
});

test('known plans keep their own limits', () => {
  assert.equal(configForPlan('starter'), PLAN_CONFIG.starter);
  assert.equal(configForPlan('professional'), PLAN_CONFIG.professional);
  assert.equal(configForPlan('enterprise'), PLAN_CONFIG.enterprise);
});

test('a paid plan inside its billing period stays active', () => {
  assert.equal(effectivePlan({ plan: 'enterprise', planExpiresAt: inDays(10) }), 'enterprise');
});

test('a paid plan past its billing period falls back to free', () => {
  assert.equal(effectivePlan({ plan: 'enterprise', planExpiresAt: inDays(-1) }), 'free');
});

test('free never becomes paid through the expiry check', () => {
  assert.equal(effectivePlan({ plan: 'free', planExpiresAt: inDays(30) }), 'free');
  assert.equal(effectivePlan({ plan: 'free' }), 'free');
  assert.equal(effectivePlan(null), 'free');
});

test('legacy paid grants without an end date are left alone', () => {
  assert.equal(effectivePlan({ plan: 'professional', planExpiresAt: null }), 'professional');
});

test('isExpired only reports lapsed paid periods', () => {
  assert.equal(isExpired({ plan: 'starter', planExpiresAt: inDays(-2) }), true);
  assert.equal(isExpired({ plan: 'starter', planExpiresAt: inDays(2) }), false);
  assert.equal(isExpired({ plan: 'free', planExpiresAt: inDays(-2) }), false);
  assert.equal(isExpired({ plan: 'starter' }), false);
});

test('renewing an active plan extends its existing end date', () => {
  const currentEnd = inDays(10);
  const next = nextPeriodEnd(currentEnd);
  const added = Math.round((next.getTime() - currentEnd.getTime()) / DAY);
  assert.equal(added, 30);
});

test('renewing a lapsed plan starts a new period from today', () => {
  const next = nextPeriodEnd(inDays(-5));
  const added = Math.round((next.getTime() - Date.now()) / DAY);
  assert.equal(added, 30);
});

test('daysLeft rounds up and is null without an end date', () => {
  assert.equal(daysLeft(inDays(5)), 5);
  assert.equal(daysLeft(inDays(5.5)), 6);
  assert.equal(daysLeft(null), null);
});
