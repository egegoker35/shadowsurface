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
  return PLAN_CONFIG[plan || 'free'] || PLAN_CONFIG.starter;
}
