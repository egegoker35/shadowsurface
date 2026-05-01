import { resolve4 } from 'dns/promises';
import { createConnection } from 'net';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { SUBDOMAIN_WORDLIST } from './wordlist';
import { DiscoveredAsset, CloudAsset, ScanResult } from './types';

const TOP_PORTS = [80,443,8080,8443,21,22,23,25,53,110,143,3306,3389,5432,6379,9200,27017,5900,8000,8081,8888,9000,9090,5000,3000,4444,5555,6666,7777,9999,10000,81,82,83,84,85,88,89,90,91,92,93,94,95,96,97,98,99,101,102,103,104,105,106,107,108,109,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,144,145,146,147,148,149,150];

const CVE_DATABASE: Record<string, Record<string, string[]>> = {
  apache: { '2.4.49': ['CVE-2021-41773'], '2.4.50': ['CVE-2021-42013'] },
  nginx: { '1.18.0': ['CVE-2021-23017'] },
  openssh: { '8.2': ['CVE-2020-15778'] },
  mysql: { '5.7.0': ['CVE-2020-14812'] },
  redis: { '5.0.0': ['CVE-2021-32761'] },
};

function genId(): string { return Math.random().toString(36).substring(2, 14); }

function timeout<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function tcpConnect(ip: string, port: number, ms = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: ip, port, timeout: ms }, () => { socket.end(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

const SERVICE_NAMES: Record<number, string> = {
  21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3',
  143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
  6379: 'Redis', 8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt', 9200: 'Elasticsearch', 27017: 'MongoDB',
};

const TECH_PATTERNS: [RegExp, string, string?][] = [
  [/Server:\s*nginx[\/\s]*(\d+\.\d+\.\d+)?/i, 'nginx', '1'],
  [/Server:\s*Apache[\/\s]*(\d+\.\d+\.\d+)?/i, 'Apache', '1'],
  [/Server:\s*Microsoft-IIS[\/\s]*(\d+\.\d+)?/i, 'IIS', '1'],
  [/X-Powered-By:\s*PHP[\/\s]*(\d+\.\d+)?/i, 'PHP', '1'],
  [/X-Powered-By:\s*Express/i, 'Express', ''],
  [/X-AspNet-Version:\s*(\d+\.\d+\.\d+)?/i, 'ASP.NET', '1'],
  [/X-Generator:\s*WordPress/i, 'WordPress', ''],
  [/wp-content/i, 'WordPress', ''],
  [/drupal/i, 'Drupal', ''],
  [/jquery/i, 'jQuery', ''],
  [/react/i, 'React', ''],
  [/laravel/i, 'Laravel', ''],
  [/django/i, 'Django', ''],
  [/spring/i, 'Spring', ''],
  [/fastapi/i, 'FastAPI', ''],
  [/flask/i, 'Flask', ''],
  [/cloudflare/i, 'Cloudflare', ''],
  [/akamai/i, 'Akamai', ''],
];

async function grabBanner(ip: string, port: number, ms = 3000): Promise<string> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: ip, port, timeout: ms }, () => {
      if ([80,8080,8000,3000,5000,8081,8443].includes(port)) {
        socket.write('GET / HTTP/1.1\r\nHost: ' + ip + '\r\nUser-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n');
      } else if ([21,22,23,25,110,143].includes(port)) {
        // banner will come from server
      }
    });
    let data = '';
    socket.on('data', (chunk) => { data += chunk.toString(); if (data.length > 2048) socket.end(); });
    socket.on('error', () => resolve(''));
    socket.on('timeout', () => { socket.destroy(); resolve(data); });
    socket.on('close', () => resolve(data.slice(0, 1024)));
    setTimeout(() => { socket.destroy(); resolve(data.slice(0, 1024)); }, ms);
  });
}

async function checkSSL(subdomain: string): Promise<{ issuer?: string; subject?: string; validFrom?: string; validTo?: string; daysRemaining?: number } | null> {
  return new Promise((resolve) => {
    const client = httpsRequest({ hostname: subdomain, port: 443, method: 'HEAD', timeout: 5000 }, (res) => {
      const cert = (res as any).socket?.getPeerCertificate?.();
      if (cert && cert.subject) {
        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;
        resolve({ issuer: cert.issuer?.O, subject: cert.subject?.CN, validFrom: cert.valid_from, validTo: cert.valid_to, daysRemaining });
      } else resolve(null);
    });
    client.on('error', () => resolve(null));
    client.on('timeout', () => { client.destroy(); resolve(null); });
    client.end();
  });
}

async function fetchHeaders(url: string, ms = 8000): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? httpsRequest : httpRequest;
    const req = client(url, { method: 'GET', timeout: ms }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; if (body.length > 65536) res.destroy(); });
      res.on('end', () => {
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) headers[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
        resolve({ status: res.statusCode || 0, headers, body: body.slice(0, 32768) });
      });
    });
    req.on('error', () => resolve({ status: 0, headers: {}, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {}, body: '' }); });
    req.end();
  });
}

async function queryCrtsh(domain: string): Promise<string[]> {
  try {
    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ name_value: string }>;
    const subs = new Set<string>();
    for (const entry of data) {
      for (const n of entry.name_value.split('\n')) {
        const trimmed = n.trim().replace('*.', '');
        if (trimmed.endsWith(domain) && trimmed !== domain) subs.add(trimmed);
      }
    }
    return Array.from(subs);
  } catch { return []; }
}

async function resolveBulk(domains: string[], concurrency = 200): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(async (domain) => {
      try { const ips = await Promise.race([resolve4(domain), timeout<string[]>(5000)]); return { domain, ips }; }
      catch { return { domain, ips: [] }; }
    }));
    for (const s of settled) { if (s.status === 'fulfilled' && s.value.ips.length > 0) results[s.value.domain] = s.value.ips; }
  }
  return results;
}

function extractTech(server: string): string | null {
  const map: Record<string, string> = { apache: 'Apache', nginx: 'nginx', 'microsoft-iis': 'Microsoft-IIS', lighttpd: 'lighttpd' };
  const lower = server.toLowerCase();
  for (const [k, v] of Object.entries(map)) if (lower.includes(k)) return v;
  return null;
}

function extractVersion(header: string): string | null { const m = header.match(/(\d+\.\d+\.?\d*)/); return m ? m[1] : null; }

function mapCves(tech: string, version: string): string[] {
  for (const [dbTech, versions] of Object.entries(CVE_DATABASE)) {
    if (tech.toLowerCase().includes(dbTech)) for (const [v, cves] of Object.entries(versions)) if (version.startsWith(v)) return cves;
  }
  return [];
}

export class ShadowSurfaceEngine {
  target: string;
  scanResult: ScanResult;
  constructor(target: string) {
    this.target = target;
    this.scanResult = {
      scanId: genId(), target, startedAt: new Date().toISOString(),
      assets: [], cloudAssets: [],
      statistics: { totalSubdomains: 0, totalAssets: 0, totalCloudAssets: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 },
      executiveSummary: { overallRisk: 'LOW', criticalFindings: 0, attackSurfaceSize: 0, recommendations: [] },
    };
  }

  async enumerateSubdomains(): Promise<Record<string, string[]>> {
    const domains = SUBDOMAIN_WORDLIST.slice(0, 300).map((w) => `${w}.${this.target}`);
    const dnsResults = await resolveBulk(domains, 200);
    const ct = await queryCrtsh(this.target);
    if (ct.length > 0) { const ctResults = await resolveBulk(ct.slice(0, 200), 100); Object.assign(dnsResults, ctResults); }
    return dnsResults;
  }

  async scanPortsOnAssets(subdomainIps: Record<string, string[]>, ports: number[] = [80,443,8080,8443]): Promise<DiscoveredAsset[]> {
    const assets: DiscoveredAsset[] = [];
    const allTargets: { subdomain: string; ip: string; port: number }[] = [];
    for (const [subdomain, ips] of Object.entries(subdomainIps)) {
      for (const ip of ips.slice(0, 3)) for (const port of ports.slice(0, 30)) allTargets.push({ subdomain, ip, port });
    }
    for (let i = 0; i < allTargets.length; i += 100) {
      const batch = allTargets.slice(i, i + 100);
      const results = await Promise.allSettled(batch.map(async (t) => {
        const open = await tcpConnect(t.ip, t.port, 2000);
        if (!open) return null;
        const banner = await grabBanner(t.ip, t.port, 2000);
        return { id: genId(), domain: this.target, subdomain: t.subdomain, ip: t.ip, port: t.port, service: SERVICE_NAMES[t.port] || '', banner, technology: null, version: null, cves: [], cloudProvider: null, riskScore: 0, findings: [], headers: {}, sslInfo: null, waf: null, firstSeen: new Date().toISOString() } as DiscoveredAsset;
      }));
      for (const r of results) { if (r.status === 'fulfilled' && r.value) assets.push(r.value); }
    }
    return assets;
  }

  async analyzeWebAssets(assets: DiscoveredAsset[]): Promise<DiscoveredAsset[]> {
    const webAssets = assets.filter((a) => [80,443,8080,8443].includes(a.port));
    for (let i = 0; i < webAssets.length; i += 20) {
      const batch = webAssets.slice(i, i + 20);
      await Promise.allSettled(batch.map(async (asset) => {
        const proto = asset.port === 443 || asset.port === 8443 ? 'https' : 'http';
        const url = `${proto}://${asset.subdomain || asset.ip}:${asset.port}`;
        try {
          const { headers, body } = await fetchHeaders(url, 8000);
          asset.headers = headers;
          const server = headers['server'] || '';
          const powered = headers['x-powered-by'] || '';
          const cfRay = headers['cf-ray'] || '';
          const akamai = headers['x-akamai-transformed'] || '';

          // WAF/CDN Detection
          if (cfRay) asset.waf = 'Cloudflare';
          else if (akamai) asset.waf = 'Akamai';
          else if (headers['x-amzn-requestid']) asset.waf = 'AWS CloudFront';
          else if (headers['x-sucuri-id']) asset.waf = 'Sucuri';
          else if (headers['server']?.toLowerCase().includes('cloudflare')) asset.waf = 'Cloudflare';

          if (server) { asset.technology = extractTech(server); asset.version = extractVersion(server); }
          if (powered && !asset.technology) asset.technology = extractTech(powered);
          if (asset.technology && asset.version) asset.cves = mapCves(asset.technology, asset.version);

          // SSL Certificate Check
          if (asset.port === 443 || asset.port === 8443) {
            asset.sslInfo = await checkSSL(asset.subdomain || asset.ip || '');
            if (asset.sslInfo && asset.sslInfo.daysRemaining !== undefined && asset.sslInfo.daysRemaining < 30) {
              asset.findings.push({ type: 'ssl_expiring', severity: asset.sslInfo.daysRemaining < 7 ? 'critical' : 'high', description: `SSL certificate expires in ${asset.sslInfo.daysRemaining} days` });
            }
            if (!asset.sslInfo) {
              asset.findings.push({ type: 'ssl_invalid', severity: 'high', description: 'SSL certificate missing or invalid' });
            }
          }

          // Security Headers
          const securityHeaders = ['strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'];
          const missing = securityHeaders.filter(h => !headers[h]);
          if (missing.length > 0) {
            asset.findings.push({ type: 'missing_security_headers', severity: missing.length > 3 ? 'medium' : 'low', description: `Missing ${missing.length} headers: ${missing.join(', ')}` });
          }

          // Admin Panel References
          for (const p of ['/admin','/administrator','/wp-admin','/dashboard']) {
            if (body.toLowerCase().includes(p)) asset.findings.push({ type: 'admin_panel_reference', severity: 'low', description: `Potential admin panel reference: ${p}` });
          }

          // Information Disclosure
          if (body.toLowerCase().includes('phpinfo')) asset.findings.push({ type: 'information_disclosure', severity: 'high', description: 'Potential phpinfo() exposure detected' });
          if (body.includes('stack trace') || body.includes('.java:')) asset.findings.push({ type: 'information_disclosure', severity: 'medium', description: 'Potential stack trace in response' });
          if (headers['x-debug-token']) asset.findings.push({ type: 'debug_mode', severity: 'high', description: 'Debug mode potentially enabled' });
        } catch {}
      }));
    }
    return assets;
  }

  async scanCloudInfrastructure(): Promise<CloudAsset[]> {
    const assets: CloudAsset[] = [];
    const prefixes = [this.target.replace(/\./g, '-'), this.target.replace(/\./g, ''), this.target.split('.')[0]];
    for (const prefix of prefixes) {
      for (const bucket of [prefix, `${prefix}-data`, `${prefix}-assets`, `${prefix}-backup`, `${prefix}-uploads`, `${prefix}-public`, `${prefix}-private`, `${prefix}-dev`, `${prefix}-prod`]) {
        try {
          const res = await fetch(`https://${bucket}.s3.amazonaws.com`, { method: 'GET', signal: AbortSignal.timeout(5000) });
          if (res.status === 200 || res.status === 403) {
            const text = await res.text();
            const permissions: string[] = [];
            if (text.includes('<ListBucketResult')) permissions.push('ListBucket');
            if (res.status === 200) permissions.push('GetObject');
            const misconfigs: Record<string, unknown>[] = [];
            misconfigs.push(res.status === 200 ? { type: 's3_public', severity: 'critical', description: `S3 bucket ${bucket} is publicly accessible` } : { type: 's3_listable', severity: 'high', description: `S3 bucket ${bucket} may be listable` });
            assets.push({ id: genId(), provider: 'aws', serviceType: 's3', resourceId: bucket, url: `https://${bucket}.s3.amazonaws.com`, permissions, misconfigurations: misconfigs, riskScore: res.status === 200 ? 90 : 75, severity: res.status === 200 ? 'critical' : 'high' });
          }
        } catch {}
      }
      for (const bucket of [prefix, `${prefix}-data`, `${prefix}-assets`]) {
        try {
          const res = await fetch(`https://storage.googleapis.com/${bucket}`, { method: 'GET', signal: AbortSignal.timeout(5000) });
          if (res.status === 200) {
            const text = await res.text();
            if (text.includes('items') || text.includes('kind') || text.includes('<ListBucketResult')) {
              assets.push({ id: genId(), provider: 'gcp', serviceType: 'gcs', resourceId: bucket, url: `https://storage.googleapis.com/${bucket}`, permissions: ['ListObjects'], misconfigurations: [{ type: 'gcs_public', severity: 'high', description: `GCS bucket ${bucket} is publicly accessible` }], riskScore: 75, severity: 'high' });
            }
          }
        } catch {}
      }
      for (const storage of [`${prefix}.blob.core.windows.net`, `${prefix}storage.blob.core.windows.net`]) {
        try {
          const res = await fetch(`https://${storage}`, { method: 'GET', signal: AbortSignal.timeout(5000) });
          if (res.status === 200) assets.push({ id: genId(), provider: 'azure', serviceType: 'blob', resourceId: storage, url: `https://${storage}`, permissions: ['ListContainers'], misconfigurations: [{ type: 'azure_blob_public', severity: 'high', description: `Azure Blob ${storage} may be publicly accessible` }], riskScore: 70, severity: 'high' });
        } catch {}
      }
    }
    return assets;
  }

  calculateRiskScores(assets: DiscoveredAsset[], cloud: CloudAsset[]) {
    for (const asset of assets) {
      let score = 0;
      const ps: Record<number, number> = { 3389:80, 23:85, 21:40, 3306:75, 5432:70, 6379:60, 9200:50, 27017:70 };
      score += ps[asset.port] || 0;
      score += asset.cves.length * 50;
      for (const f of asset.findings) { const type = (f as any).type || ''; if (type.includes('admin')) score += 30; if (type.includes('missing')) score += 15; }
      asset.riskScore = Math.min(score, 100);
    }
    for (const c of cloud) c.riskScore = c.severity === 'critical' ? 90 : c.severity === 'high' ? 75 : 50;
  }

  generateRecommendations(assets: DiscoveredAsset[], cloud: CloudAsset[]): string[] {
    const recs: string[] = [];
    const writable = cloud.filter((a) => a.permissions.includes('PutObject'));
    if (writable.length > 0) recs.push(`URGENT: ${writable.length} writable cloud bucket(s)`);
    const listable = cloud.filter((a) => a.permissions.includes('ListBucket') || a.permissions.includes('ListObjects'));
    if (listable.length > 0) recs.push(`HIGH: ${listable.length} publicly listable bucket(s)`);
    const exposedDbs = assets.filter((a) => [3306,5432,27017,6379,9200].includes(a.port));
    if (exposedDbs.length > 0) recs.push(`CRITICAL: ${exposedDbs.length} exposed database port(s)`);
    const outdated = assets.filter((a) => a.cves.length > 0);
    if (outdated.length > 0) recs.push(`HIGH: ${outdated.length} asset(s) with known CVEs`);
    recs.push('Implement continuous monitoring', 'Review cloud storage policies', 'Deploy WAF for public assets');
    return recs;
  }

  async runFullScan(portLimit = 100): Promise<ScanResult> {
    const start = Date.now();
    const subdomainIps = await this.enumerateSubdomains();
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    const cloudAssets = await this.scanCloudInfrastructure();
    await this.analyzeWebAssets(assets);
    this.calculateRiskScores(assets, cloudAssets);
    const duration = (Date.now() - start) / 1000;
    const crit = assets.filter((a) => a.riskScore >= 70).length + cloudAssets.filter((a) => a.severity === 'critical').length;
    this.scanResult.assets = assets;
    this.scanResult.cloudAssets = cloudAssets;
    this.scanResult.completedAt = new Date().toISOString();
    this.scanResult.durationSeconds = duration;
    this.scanResult.statistics = {
      totalSubdomains: Object.keys(subdomainIps).length, totalAssets: assets.length, totalCloudAssets: cloudAssets.length,
      highRiskCount: crit, mediumRiskCount: assets.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, lowRiskCount: assets.filter((a) => a.riskScore < 40).length,
    };
    this.scanResult.executiveSummary = {
      overallRisk: crit > 0 ? 'CRITICAL' : assets.some((a) => a.riskScore >= 70) ? 'HIGH' : assets.some((a) => a.riskScore >= 40) ? 'MEDIUM' : 'LOW',
      criticalFindings: crit, attackSurfaceSize: Object.keys(subdomainIps).length + cloudAssets.length,
      recommendations: this.generateRecommendations(assets, cloudAssets),
    };
    return this.scanResult;
  }
}
