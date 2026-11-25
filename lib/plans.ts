export type PlanConfig = {
  perHour: number;
  perMonth: number;
  portLimit: number;
  allowedTypes: string[];
  bulkDomains: number;
};

export const VALID_SCAN_TYPES = ['subdomain', 'port', 'cve', 'cloud', 'full', 'bulk'];

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  free: { perHour: 1, perMonth: 2, portLimit: 10, allowedTypes: ['subdomain', 'port'], bulkDomains: 1 },
  starter: { perHour: 5, perMonth: 20, portLimit: 20, allowedTypes: ['subdomain', 'port', 'cve'], bulkDomains: 1 },
  professional: { perHour: 20, perMonth: 200, portLimit: 50, allowedTypes: ['subdomain', 'port', 'cve', 'cloud', 'full'], bulkDomains: 5 },
  enterprise: { perHour: 100, perMonth: 9999, portLimit: 100, allowedTypes: ['subdomain', 'port', 'cve', 'cloud', 'full', 'bulk'], bulkDomains: 50 },
};

export function configForPlan(plan?: string | null): PlanConfig {
  // Unknown plan strings must not fall back to a paid tier: an org row with a stale or
  // hand-edited value would otherwise receive starter limits for free.
  return PLAN_CONFIG[plan || 'free'] || PLAN_CONFIG.free;
}

/**
 * Plans are sold per month, so access has to end when the month does.
 *
 * Before this, a single payment granted the plan forever: there was no expiry field,
 * no renewal and no downgrade. An organization whose paid period has lapsed falls back
 * to the free tier rather than losing its data, which is what the pricing page implies.
 */
export function effectivePlan(org?: { plan?: string | null; planExpiresAt?: Date | string | null } | null): string {
  const plan = org?.plan || 'free';
  if (plan === 'free') return 'free';
  const expires = org?.planExpiresAt ? new Date(org.planExpiresAt) : null;
  if (!expires) return plan; // legacy/manual grants without an end date stay as-is
  return expires.getTime() > Date.now() ? plan : 'free';
}

export function isExpired(org?: { plan?: string | null; planExpiresAt?: Date | string | null } | null): boolean {
  if (!org?.planExpiresAt || (org?.plan || 'free') === 'free') return false;
  return new Date(org.planExpiresAt).getTime() <= Date.now();
}

/** One billing period, added to now or to the current end date for a renewal. */
export function nextPeriodEnd(from?: Date | string | null, days = 30): Date {
  const base = from ? new Date(from) : new Date();
  const start = base.getTime() > Date.now() ? base : new Date();
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function daysLeft(expires?: Date | string | null): number | null {
  if (!expires) return null;
  return Math.ceil((new Date(expires).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}
