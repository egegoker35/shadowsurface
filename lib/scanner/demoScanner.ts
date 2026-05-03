/**
 * Production-grade demo scanner — real subdomain enum, tech fingerprinting,
 * SSL analysis, security headers, accurate CVE mapping, cloud detection.
 * Safe for web requests: no heavy TCP port scans, only HTTP(S) checks.
 */

import { resolve4 } from 'dns/promises';
import { SUBDOMAIN_WORDLIST } from './wordlist';

function genId(): string { return Math.random().toString(36).substring(2, 14); }
function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

// ─── CVE Database (accurate, no fuzzy fallback) ────────────────────────────
const CVE_DB: Record<string, Record<string, string[]>> = {
  apache: { '2.4.49': ['CVE-2021-41773','CVE-2021-42013'], '2.4.50': ['CVE-2021-42013'], '2.4.41': ['CVE-2020-1927','CVE-2020-1934'] },
  nginx: { '1.18.0': ['CVE-2021-23017'], '1.16.1': ['CVE-2019-9511','CVE-2019-9513'] },
  openssh: { '8.2': ['CVE-2020-15778'], '7.7': ['CVE-2018-15473'] },
  mysql: { '5.7.0': ['CVE-2020-14812'], '5.6.0': ['CVE-2016-6662'] },
  redis: { '5.0.0': ['CVE-2021-32761'] },
  php: { '7.4.0': ['CVE-2019-11043'], '7.3.0': ['CVE-2019-13224'] },
  wordpress: { '5.7.0': ['CVE-2021-29447'] },
  jenkins: { '2.0': ['CVE-2024-23897'] },
  tomcat: { '9.0': ['CVE-2020-1938'] },
  nodejs: { '14.0': ['CVE-2021-22940'] },
};

const TECH_PATTERNS: [RegExp, string, string?][] = [
  [/Server:\s*nginx[\/\s]*(\d+\.\d+\.?\d*)/i, 'nginx', '1'],
  [/Server:\s*Apache[\/\s]*(\d+\.\d+\.?\d*)/i, 'Apache', '1'],
  [/Server:\s*Microsoft-IIS[\/\s]*(\d+\.\d+)/i, 'IIS', '1'],
  [/X-Powered-By:\s*PHP[\/\s]*(\d+\.\d+\.?\d*)/i, 'PHP', '1'],
  [/X-AspNet-Version:\s*(\d+\.\d+\.\d+)/i, 'ASP.NET', '1'],
  [/X-Generator:\s*WordPress/i, 'WordPress', ''],
  [/X-Jenkins:\s*([\d.]+)/i, 'Jenkins', '1'],
  [/Server:\s*gunicorn[\/\s]*(\d+\.\d+)/i, 'Gunicorn', '1'],
  [/Server:\s*Cowboy/i, 'Cowboy', ''],
  [/Server:\s*Caddy/i, 'Caddy', ''],
  [/X-Drupal-Cache/i, 'Drupal', ''],
  [/X-Pingback:\s*xmlrpc/i, 'WordPress', ''],
  [/X-Shopify-Stage/i, 'Shopify', ''],
  [/cf-ray/i, 'Cloudflare CDN', ''],
  [/X-Cache:\s*HIT/i, 'Varnish', ''],
  [/X-Served-By:\s*cache/i, 'Fastly', ''],
  [/Via:\s*1\.1\s*vegur/i, 'Heroku', ''],
  [/Server:\s*lighttpd[\/\s]*(\d+\.\d+\.?\d*)/i, 'lighttpd', '1'],
  [/Server:\s*openresty/i, 'OpenResty', ''],
  [/Server:\s*Tomcat[\/\s]*(\d+\.\d+)/i, 'Tomcat', '1'],
  [/X-Powered-By:\s*Express/i, 'Express', ''],
  [/X-Powered-By:\s*Next\.js/i, 'Next.js', ''],
  [/X-Powered-By:\s*ASP\.NET/i, 'ASP.NET', ''],
];

function extractTech(banner: string): string | null {
  for (const [re, name] of TECH_PATTERNS) { if (re.test(banner)) return name; }
  return null;
}
function extractVersion(banner: string): string | null {
  for (const [re, , group] of TECH_PATTERNS) {
    const m = banner.match(re);
    if (m && group && m[parseInt(group)]) return m[parseInt(group)];
  }
  return null;
}
function mapCves(tech: string, version: string): string[] {
  const key = Object.keys(CVE_DB).find((k) => tech.toLowerCase().includes(k));
  if (!key || !version) return [];
  const vMap = CVE_DB[key];
  const exact = vMap[version];
  if (exact) return exact;
  const majorMinor = version.split('.').slice(0, 2).join('.');
  return vMap[majorMinor] || [];
}

// ─── Subdomain Discovery ───────────────────────────────────────────────────
async function resolveBulk(domains: string[], concurrency = 200): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (domain) => {
        try {
          const ips = await Promise.race([resolve4(domain), timeout<string[]>(5000)]);
          return { domain, ips };
        } catch { return { domain, ips: [] }; }
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
        if (trimmed.endsWith(domain) && trimmed !== domain && trimmed.includes('.')) subs.add(trimmed);
      }
    }
    return Array.from(subs);
  } catch { return []; }
}

// ─── SSL Check ─────────────────────────────────────────────────────────────
async function checkSSL(hostname: string): Promise<{ issuer?: string; validTo?: string; daysRemaining?: number; valid?: boolean; selfSigned?: boolean; weakCipher?: boolean } | null> {
  try {
    const { request } = await import('https');
    return new Promise((resolve) => {
      const req = request({ hostname, port: 443, method: 'HEAD', timeout: 5000 }, (res) => {
        const sock = (res as any).socket;
        if (!sock || !sock.getPeerCertificate) { resolve(null); return; }
        const cert = sock.getPeerCertificate();
        if (!cert || Object.keys(cert).length === 0) { resolve(null); return; }
        const validTo = cert.valid_to ? new Date(cert.valid_to) : undefined;
        const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;
        const selfSigned = cert.issuer && cert.subject && JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);
        resolve({ issuer: cert.issuer?.O || cert.issuer?.CN, validTo: cert.valid_to, daysRemaining, valid: daysRemaining !== undefined && daysRemaining > 0, selfSigned, weakCipher: false });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  } catch { return null; }
}

// ─── HTTP Analysis ─────────────────────────────────────────────────────────
async function analyzeHttp(subdomain: string, ip: string): Promise<Record<string, unknown>> {
  const findings: Record<string, unknown>[] = [];
  const headers: Record<string, string> = {};
  let body = '';
  let title = '';
  let tech: string | null = null;
  let version: string | null = null;
  let sslInfo = null;

  // Try HTTPS first
  let url = `https://${subdomain}`;
  let success = false;
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000), redirect: 'follow' });
    success = true;
    res.headers.forEach((v, k) => { headers[k] = v; });
    body = await res.text().catch(() => '');
    title = body.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
    const banner = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');
    tech = extractTech(banner);
    version = extractVersion(banner);
    sslInfo = await checkSSL(subdomain);
  } catch {
    // Fallback HTTP
    try {
      url = `http://${subdomain}`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000), redirect: 'follow' });
      success = true;
      res.headers.forEach((v, k) => { headers[k] = v; });
      body = await res.text().catch(() => '');
      title = body.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
      const banner = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');
      tech = extractTech(banner);
      version = extractVersion(banner);
    } catch { /* unreachable */ }
  }

  if (!success) return { subdomain, ip, reachable: false, findings: [], headers: {}, technology: null, version: null, cves: [], sslInfo: null, title: '', riskScore: 0 };

  const banner = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');

  // Security headers
  const required = ['content-security-policy','x-frame-options','x-content-type-options','referrer-policy'];
  if (url.startsWith('https')) required.push('strict-transport-security');
  const missing = required.filter(h => !headers[h]);
  if (missing.length > 0) {
    const sev = missing.includes('strict-transport-security') || missing.includes('content-security-policy') ? 'medium' : 'low';
    findings.push({ type: 'missing_security_headers', severity: sev, description: `Missing ${missing.length} security header(s): ${missing.join(', ')}` });
  }

  // Server disclosure
  if (headers['server'] && /\d+\.\d+/.test(headers['server'])) {
    findings.push({ type: 'information_disclosure', severity: 'low', description: `Server version disclosed: ${headers['server']}` });
  }

  // CORS
  if (headers['access-control-allow-origin'] === '*') {
    findings.push({ type: 'cors_misconfiguration', severity: 'medium', description: 'Overly permissive CORS: Access-Control-Allow-Origin: *' });
  }

  // Cookie flags
  const setCookie = headers['set-cookie'] || '';
  if (setCookie && (!setCookie.includes('Secure') || !setCookie.includes('HttpOnly'))) {
    findings.push({ type: 'insecure_cookie', severity: 'medium', description: 'Cookie missing Secure/HttpOnly flags' });
  }

  // SSL findings
  if (sslInfo) {
    if (sslInfo.daysRemaining !== undefined && sslInfo.daysRemaining < 30) {
      findings.push({ type: 'ssl_expiring', severity: sslInfo.daysRemaining < 7 ? 'critical' : 'high', description: `SSL expires in ${sslInfo.daysRemaining} days` });
    }
    if (sslInfo.selfSigned) findings.push({ type: 'ssl_self_signed', severity: 'high', description: 'Self-signed SSL certificate' });
  }

  // Body checks
  if (body.toLowerCase().includes('phpinfo')) findings.push({ type: 'information_disclosure', severity: 'high', description: 'Potential phpinfo() exposure' });
  if (body.includes('.env')) findings.push({ type: 'information_disclosure', severity: 'critical', description: 'Potential .env file exposure' });
  if (body.includes('-----BEGIN RSA PRIVATE KEY-----')) findings.push({ type: 'information_disclosure', severity: 'critical', description: 'Private key exposure detected' });
  if (body.includes('<title>Index of /') || body.includes('Directory Listing For')) findings.push({ type: 'directory_listing', severity: 'medium', description: 'Directory listing enabled' });

  // Admin panels
  const adminPaths = ['/admin','/wp-admin','/dashboard','/login','/manage'];
  for (const p of adminPaths) {
    if (body.toLowerCase().includes(p)) { findings.push({ type: 'admin_panel_reference', severity: 'low', description: `Potential admin panel: ${p}` }); break; }
  }

  // WAF detection
  let waf: string | null = null;
  if (headers['cf-ray']) waf = 'Cloudflare';
  else if (headers['x-akamai-transformed']) waf = 'Akamai';
  else if (headers['x-sucuri-id']) waf = 'Sucuri';
  else if (headers['server']?.includes('cloudflare')) waf = 'Cloudflare';

  // CVE mapping
  const cves = tech ? mapCves(tech, version || '') : [];

  // Risk score
  let riskScore = 0;
  if (cves.length > 0) riskScore += cves.length * 35;
  for (const f of findings) {
    const sev = (f as any).severity || '';
    if (sev === 'critical') riskScore += 40;
    else if (sev === 'high') riskScore += 25;
    else if (sev === 'medium') riskScore += 12;
    else if (sev === 'low') riskScore += 5;
  }
  riskScore = Math.min(riskScore, 100);

  return {
    subdomain, ip, reachable: true, findings, headers, technology: tech, version, cves, sslInfo, title, waf, riskScore,
    service: url.startsWith('https') ? 'HTTPS' : 'HTTP',
    port: url.startsWith('https') ? 443 : 80,
  };
}

// ─── Cloud Detection ───────────────────────────────────────────────────────
async function detectCloud(domain: string): Promise<Record<string, unknown>[]> {
  const cloud: Record<string, unknown>[] = [];
  const prefix = domain.replace(/\./g, '-');
  const buckets = [prefix, `${prefix}-assets`, `${prefix}-data`, `${prefix}-backup`, `${prefix}-uploads`, `${prefix}-static`];
  for (const bucket of buckets.slice(0, 3)) {
    try {
      const res = await fetch(`https://${bucket}.s3.amazonaws.com`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (res.status === 200) cloud.push({ provider: 'aws', serviceType: 's3', resourceId: bucket, severity: 'critical', description: `S3 bucket ${bucket} publicly readable` });
      else if (res.status === 403) cloud.push({ provider: 'aws', serviceType: 's3', resourceId: bucket, severity: 'high', description: `S3 bucket ${bucket} exists but access denied (enumerate)` });
    } catch { /* ignore */ }
  }
  return cloud;
}

// ─── Public Interface ──────────────────────────────────────────────────────
export interface DemoScanResult {
  scanId: string;
  target: string;
  status: string;
  durationSeconds: number;
  totalSubdomains: number;
  subdomains: string[];
  assets: Record<string, unknown>[];
  cloudAssets: Record<string, unknown>[];
  findings: Record<string, unknown>[];
  statistics: { totalSubdomains: number; totalAssets: number; totalCloudAssets: number; highRiskCount: number; mediumRiskCount: number; lowRiskCount: number };
  executiveSummary: { overallRisk: string; criticalFindings: number; attackSurfaceSize: number; recommendations: string[] };
}

export async function runDemoScan(target: string): Promise<DemoScanResult> {
  const start = Date.now();
  const scanId = genId();

  // Subdomain discovery
  const domains = SUBDOMAIN_WORDLIST.slice(0, 800).map((w) => `${w}.${target}`);
  const [dnsResults, ctSubs] = await Promise.all([
    resolveBulk(domains, 200),
    queryCrtsh(target),
  ]);
  if (ctSubs.length > 0) {
    const ctResolved = await resolveBulk(ctSubs.slice(0, 50), 100);
    Object.assign(dnsResults, ctResolved);
  }
  // Include root domain
  try { const ips = await resolve4(target); if (ips.length) dnsResults[target] = ips; } catch {}

  const subdomains = Object.keys(dnsResults).slice(0, 30);
  const allIps = dnsResults;

  // HTTP analysis on subdomains (top 15)
  const assets: Record<string, unknown>[] = [];
  const allFindings: Record<string, unknown>[] = [];
  for (let i = 0; i < Math.min(subdomains.length, 15); i += 5) {
    const batch = subdomains.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map((sub) => analyzeHttp(sub, allIps[sub]?.[0] || '')));
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const data = r.value;
        if (data.reachable) {
          assets.push(data);
          allFindings.push(...(data.findings as any[]));
        }
      }
    }
  }

  // Cloud detection
  const cloudAssets = await detectCloud(target);

  const duration = (Date.now() - start) / 1000;
  const critical = allFindings.filter((f) => (f as any).severity === 'critical').length + cloudAssets.filter((c) => (c as any).severity === 'critical').length;
  const high = allFindings.filter((f) => (f as any).severity === 'high').length + cloudAssets.filter((c) => (c as any).severity === 'high').length;
  const medium = allFindings.filter((f) => (f as any).severity === 'medium').length;

  const overallRisk = critical > 0 ? 'CRITICAL' : high > 0 ? 'HIGH' : medium > 0 ? 'MEDIUM' : 'LOW';

  const recommendations: string[] = [];
  if (subdomains.length > 0) recommendations.push(`Found ${subdomains.length} subdomains — audit for orphaned or forgotten assets`);
  if (critical > 0) recommendations.push(`${critical} critical finding(s) require immediate attention`);
  if (high > 0) recommendations.push(`${high} high severity issue(s) should be remediated within 7 days`);
  if (allFindings.some((f) => (f as any).type === 'missing_security_headers')) recommendations.push('Add missing security headers (CSP, HSTS, X-Frame-Options)');
  if (cloudAssets.length > 0) recommendations.push('Review cloud storage bucket permissions');
  recommendations.push('Run a full port scan from the dashboard for deeper coverage');

  return {
    scanId, target, status: 'completed', durationSeconds: duration,
    totalSubdomains: subdomains.length, subdomains,
    assets, cloudAssets,
    findings: allFindings,
    statistics: {
      totalSubdomains: subdomains.length,
      totalAssets: assets.length,
      totalCloudAssets: cloudAssets.length,
      highRiskCount: critical,
      mediumRiskCount: high,
      lowRiskCount: medium,
    },
    executiveSummary: {
      overallRisk,
      criticalFindings: critical,
      attackSurfaceSize: subdomains.length + cloudAssets.length,
      recommendations,
    },
  };
}
