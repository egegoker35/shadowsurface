/**
 * DemoScanner — lightweight scanner for public demo endpoint.
 * NO port scanning, NO cloud scanning, NO heavy TCP connections.
 * Only: subdomain enum (DNS + CT) + basic HTTP header check on :80/:443.
 * Safe to run from web request or worker without CPU spike.
 */

import { resolve4 } from 'dns/promises';
import { SUBDOMAIN_WORDLIST } from './wordlist';

function genId(): string { return Math.random().toString(36).substring(2, 14); }

function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function resolveBulk(domains: string[], concurrency = 200): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (domain) => {
        try {
          const ips = await Promise.race([resolve4(domain), timeout<string[]>(5000)]);
          return { domain, ips };
        } catch {
          return { domain, ips: [] };
        }
      })
    );
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value.ips.length > 0) {
        results[s.value.domain] = s.value.ips;
      }
    }
  }
  return results;
}

async function queryCrtsh(domain: string): Promise<string[]> {
  try {
    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ name_value: string }>;
    const subs = new Set<string>();
    for (const entry of data) {
      for (const n of entry.name_value.split('\n')) {
        const trimmed = n.trim().replace('*.', '');
        if (trimmed.endsWith(domain) && trimmed !== domain) subs.add(trimmed);
      }
    }
    return Array.from(subs).slice(0, 50);
  } catch {
    return [];
  }
}

async function quickHttpCheck(subdomain: string): Promise<Record<string, unknown>[]> {
  const findings: Record<string, unknown>[] = [];
  const url = `https://${subdomain}`;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'follow' });
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    const server = headers['server'] || '';
    for (const h of ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy']) {
      if (!headers[h]) findings.push({ type: 'missing_security_headers', severity: 'low', description: `Missing ${h}` });
    }
    if (server) {
      findings.push({ type: 'technology_detected', severity: 'info', description: `Server: ${server}` });
    }
  } catch {
    // ignore unreachable
  }
  return findings;
}

export interface DemoScanResult {
  scanId: string;
  target: string;
  status: string;
  durationSeconds: number;
  totalSubdomains: number;
  subdomains: string[];
  findings: Record<string, unknown>[];
  statistics: {
    totalSubdomains: number;
    totalAssets: number;
    totalCloudAssets: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  executiveSummary: {
    overallRisk: string;
    criticalFindings: number;
    attackSurfaceSize: number;
    recommendations: string[];
  };
}

export async function runDemoScan(target: string): Promise<DemoScanResult> {
  const start = Date.now();
  const scanId = genId();

  // Limit wordlist to 100 for demo (not 300)
  const domains = SUBDOMAIN_WORDLIST.slice(0, 100).map((w) => `${w}.${target}`);
  const dnsResults = await resolveBulk(domains, 200);

  const ct = await queryCrtsh(target);
  if (ct.length > 0) {
    const ctResults = await resolveBulk(ct.slice(0, 50), 100);
    Object.assign(dnsResults, ctResults);
  }

  const subdomains = Object.keys(dnsResults).slice(0, 30);
  let allFindings: Record<string, unknown>[] = [];

  // Only check top 10 subdomains via HTTP (lightweight)
  for (const sub of subdomains.slice(0, 10)) {
    const findings = await quickHttpCheck(sub);
    allFindings = allFindings.concat(findings);
  }

  const missingHeaders = allFindings.filter((f) => f.type === 'missing_security_headers').length;
  const techFound = allFindings.filter((f) => f.type === 'technology_detected').length;
  const risk = missingHeaders > 5 ? 'HIGH' : missingHeaders > 2 ? 'MEDIUM' : 'LOW';

  const duration = (Date.now() - start) / 1000;

  return {
    scanId,
    target,
    status: 'completed',
    durationSeconds: duration,
    totalSubdomains: subdomains.length,
    subdomains,
    findings: allFindings,
    statistics: {
      totalSubdomains: subdomains.length,
      totalAssets: techFound,
      totalCloudAssets: 0,
      highRiskCount: missingHeaders > 5 ? 1 : 0,
      mediumRiskCount: missingHeaders > 2 && missingHeaders <= 5 ? 1 : 0,
      lowRiskCount: missingHeaders <= 2 ? 1 : 0,
    },
    executiveSummary: {
      overallRisk: risk,
      criticalFindings: 0,
      attackSurfaceSize: subdomains.length,
      recommendations: [
        subdomains.length > 0 ? `Found ${subdomains.length} subdomains — review for orphaned assets` : 'No subdomains found',
        missingHeaders > 0 ? `${missingHeaders} missing security headers detected` : 'Security headers look good',
        'Run a full scan from the dashboard for port and cloud detection',
      ],
    },
  };
}
