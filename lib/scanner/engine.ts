import { resolve4, resolveMx, resolveTxt } from 'dns/promises';
import { createConnection } from 'net';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { SUBDOMAIN_WORDLIST } from './wordlist';
import { DiscoveredAsset, CloudAsset, ScanResult } from './types';

// ─── Port & Service Definitions ───────────────────────────────────────────
const TOP_PORTS = [
  80,443,8080,8443,21,22,23,25,53,110,143,3306,3389,5432,6379,9200,27017,
  5900,8000,8081,8888,9000,9090,5000,3000,4444,5555,6666,7777,9999,10000,
  81,82,83,84,85,88,89,90,91,92,93,94,95,96,97,98,99,101,102,103,104,105,
  106,107,108,109,111,112,113,114,115,116,117,118,119,120,121,122,123,124,
  125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,
  144,145,146,147,148,149,150
];

const SERVICE_NAMES: Record<number, string> = {
  21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 80: 'HTTP',
  81: 'HTTP-Alt', 88: 'Kerberos', 110: 'POP3', 111: 'RPCbind', 135: 'MSRPC',
  139: 'NetBIOS', 143: 'IMAP', 161: 'SNMP', 162: 'SNMP-Trap', 389: 'LDAP',
  443: 'HTTPS', 445: 'SMB', 636: 'LDAPS', 993: 'IMAPS', 995: 'POP3S',
  2049: 'NFS', 3000: 'Node.js', 3128: 'Squid', 3306: 'MySQL', 3389: 'RDP',
  4444: 'Metasploit', 5000: 'UPnP/Flask', 5432: 'PostgreSQL', 5433: 'PgBouncer',
  5672: 'RabbitMQ', 5900: 'VNC', 5984: 'CouchDB', 6379: 'Redis', 6443: 'Kubernetes',
  7001: 'WebLogic', 7547: 'TR-069', 8000: 'HTTP-Alt', 8008: 'HTTP',
  8009: 'AJP', 8080: 'HTTP-Proxy', 8081: 'HTTP-Alt', 8089: 'Splunk',
  8443: 'HTTPS-Alt', 8888: 'HTTP-Alt', 9000: 'PHP-FPM', 9090: 'WebSM',
  9200: 'Elasticsearch', 9300: 'ES-Transport', 11211: 'Memcached',
  15672: 'RabbitMQ-Mgmt', 27017: 'MongoDB', 27018: 'MongoDB-Shard',
  32768: 'RPC'
};

// ─── CVE Database ──────────────────────────────────────────────────────────
const CVE_DATABASE: Record<string, Record<string, string[]>> = {
  apache: {
    '2.4.49': ['CVE-2021-41773','CVE-2021-42013'],
    '2.4.50': ['CVE-2021-42013'],
    '2.4.41': ['CVE-2020-1927','CVE-2020-1934'],
    '2.4.29': ['CVE-2018-1312','CVE-2018-1283'],
    '2.4.18': ['CVE-2016-5387'],
  },
  nginx: {
    '1.18.0': ['CVE-2021-23017'],
    '1.17.6': ['CVE-2019-20372'],
    '1.16.1': ['CVE-2019-9511','CVE-2019-9513'],
    '1.14.0': ['CVE-2018-16843'],
  },
  openssh: {
    '8.2': ['CVE-2020-15778'],
    '7.7': ['CVE-2018-15473'],
    '7.4': ['CVE-2016-10009'],
  },
  mysql: {
    '5.7.0': ['CVE-2020-14812'],
    '5.6.0': ['CVE-2016-6662'],
    '8.0.0': ['CVE-2021-2299'],
  },
  redis: {
    '5.0.0': ['CVE-2021-32761'],
    '4.0.0': ['CVE-2018-11218'],
    '3.2.0': ['CVE-2016-8339'],
  },
  php: {
    '7.4.0': ['CVE-2019-11043'],
    '7.3.0': ['CVE-2019-13224'],
    '5.6.0': ['CVE-2016-10158'],
  },
  wordpress: {
    '5.7.0': ['CVE-2021-29447'],
    '5.0.0': ['CVE-2019-8942'],
  },
  jenkins: {
    '2.0': ['CVE-2024-23897'],
    '2.100': ['CVE-2018-1000861'],
  },
  docker: {
    '20.10': ['CVE-2024-21626'],
  },
  kubernetes: {
    '1.20': ['CVE-2021-25741'],
  },
  tomcat: {
    '9.0': ['CVE-2020-1938'],
    '8.5': ['CVE-2019-0232'],
  },
  nodejs: {
    '14.0': ['CVE-2021-22940'],
    '12.0': ['CVE-2020-8265'],
  },
  iis: {
    '10.0.19041': ['CVE-2021-31166'],
    '10.0.19042': ['CVE-2021-31166'],
  },
  python: {
    '3.8': ['CVE-2021-3177'],
    '2.7': ['CVE-2019-11340'],
  },
};

// ─── Technology Fingerprints ────────────────────────────────────────────────
const TECH_PATTERNS: [RegExp, string, string?][] = [
  [/Server:\s*nginx[\/\s]*(\d+\.\d+\.?\d*)/i, 'nginx', '1'],
  [/Server:\s*Apache[\/\s]*(\d+\.\d+\.?\d*)/i, 'Apache', '1'],
  [/Server:\s*Microsoft-IIS[\/\s]*(\d+\.\d+)/i, 'IIS', '1'],
  [/X-Powered-By:\s*PHP[\/\s]*(\d+\.\d+\.?\d*)/i, 'PHP', '1'],
  [/X-Powered-By:\s*Express/i, 'Express', ''],
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
];

function genId(): string { return Math.random().toString(36).substring(2, 14); }

// ─── TCP Connection ────────────────────────────────────────────────────────
async function tcpConnect(ip: string, port: number, ms = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: ip, port, timeout: ms }, () => { socket.end(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

// ─── Banner Grabber ────────────────────────────────────────────────────────
async function grabBanner(ip: string, port: number, ms = 3000): Promise<string> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: ip, port, timeout: ms }, () => {
      if ([80,8080,8000,3000,5000,8081,8443].includes(port)) {
        socket.write('GET / HTTP/1.1\r\nHost: ' + ip + '\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\nAccept: */*\r\nConnection: close\r\n\r\n');
      }
    });
    let data = '';
    socket.on('data', (chunk) => { data += chunk.toString(); if (data.length > 4096) socket.end(); });
    socket.on('error', () => resolve(''));
    socket.on('timeout', () => { socket.destroy(); resolve(data); });
    socket.on('close', () => resolve(data.slice(0, 2048)));
    setTimeout(() => { socket.destroy(); resolve(data.slice(0, 2048)); }, ms);
  });
}

// ─── SSL Check ─────────────────────────────────────────────────────────────
async function checkSSL(subdomain: string): Promise<{ issuer?: string; subject?: string; validFrom?: string; validTo?: string; daysRemaining?: number; valid?: boolean; selfSigned?: boolean; weakCipher?: boolean } | null> {
  return new Promise((resolve) => {
    const client = httpsRequest({ hostname: subdomain, port: 443, method: 'HEAD', timeout: 5000, rejectUnauthorized: false }, (res) => {
      const cert = (res as any).socket?.getPeerCertificate?.();
      if (cert && cert.subject) {
        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;
        const issuerO = cert.issuer?.O || '';
        const selfSigned = issuerO === cert.subject?.O || issuerO === '';
        const weakCipher = ['RC4', 'DES', '3DES', 'MD5'].some(c => (cert.algorithm || '').includes(c));
        resolve({ issuer: issuerO, subject: cert.subject?.CN, validFrom: cert.valid_from, validTo: cert.valid_to, daysRemaining, valid: daysRemaining !== undefined && daysRemaining > 0, selfSigned, weakCipher });
      } else resolve(null);
    });
    client.on('error', () => resolve(null));
    client.on('timeout', () => { client.destroy(); resolve(null); });
    client.end();
  });
}

// ─── HTTP Request ──────────────────────────────────────────────────────────
async function fetchHeaders(url: string, ms = 12000): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const doFetch = (targetUrl: string, timeoutMs: number): Promise<{ status: number; headers: Record<string, string>; body: string }> => {
    return new Promise((resolve) => {
      const client = targetUrl.startsWith('https:') ? httpsRequest : httpRequest;
      const req = client(
        targetUrl,
        {
          method: 'GET',
          timeout: timeoutMs,
          rejectUnauthorized: false,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'identity',
            'Connection': 'close',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith('/')) {
              const parsed = new URL(targetUrl);
              redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
            }
            if (!redirectUrl.startsWith('http')) {
              const parsed = new URL(targetUrl);
              redirectUrl = `${parsed.protocol}//${parsed.host}/${redirectUrl}`;
            }
            resolve(doFetch(redirectUrl, Math.max(timeoutMs - 2000, 2000)));
            return;
          }
          let body = '';
          res.on('data', (c) => { body += c; if (body.length > 262144) res.destroy(); });
          res.on('end', () => {
            const headers: Record<string, string> = {};
            for (const [k, v] of Object.entries(res.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
            resolve({ status: res.statusCode || 0, headers, body: body.slice(0, 65536) });
          });
        }
      );
      req.on('error', () => resolve({ status: 0, headers: {}, body: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {}, body: '' }); });
      req.end();
    });
  };
  return doFetch(url, ms);
}

// ─── Subdomain Discovery ───────────────────────────────────────────────────
async function queryCrtsh(domain: string): Promise<string[]> {
  try {
    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, { signal: AbortSignal.timeout(15000) });
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

async function resolveBulk(domains: string[], concurrency = 200): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((d) => resolve4(d).catch(() => [])));
    for (let j = 0; j < batch.length; j++) {
      const r = settled[j];
      results[batch[j]] = r.status === 'fulfilled' ? (r.value as string[]) : [];
    }
  }
  return results;
}

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
  const key = Object.keys(CVE_DATABASE).find((k) => tech.toLowerCase().includes(k));
  if (!key || !version) return [];
  const vMap = CVE_DATABASE[key];
  // Confidence check: IIS needs a 3-segment version (build number) for CVE matching
  // because IIS 10.0 exists on Server 2016/2019/2022 but CVE-2021-31166 only affects specific Windows builds
  if (key === 'iis' && version.split('.').length < 3) return [];
  // Only return CVEs when version matches exactly or major.minor matches
  const exact = vMap[version];
  if (exact) return exact;
  const majorMinor = version.split('.').slice(0, 2).join('.');
  const partial = vMap[majorMinor];
  if (partial) return partial;
  // No fuzzy fallback to avoid false positives
  return [];
}

// ─── Main Engine ───────────────────────────────────────────────────────────
export class ShadowSurfaceEngine {
  scanResult: ScanResult;
  private targetDomain: string;

  constructor(target: string) {
    this.targetDomain = target;
    this.scanResult = {
      scanId: genId(),
      target,
      startedAt: new Date().toISOString(),
      assets: [],
      cloudAssets: [],
      statistics: { totalSubdomains: 0, totalAssets: 0, totalCloudAssets: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 },
      executiveSummary: { overallRisk: 'LOW', criticalFindings: 0, attackSurfaceSize: 0, recommendations: [] },
    };
  }

  async enumerateSubdomains(): Promise<Record<string, string[]>> {
    const [wordlistSubs, crtSubs] = await Promise.all([
      Promise.all(SUBDOMAIN_WORDLIST.slice(0, 500).map(async (w) => {
        const sub = `${w}.${this.targetDomain}`;
        try { const ips = await resolve4(sub); return { sub, ips }; } catch { return null; }
      })),
      queryCrtsh(this.targetDomain),
    ]);

    const result: Record<string, string[]> = {};
    for (const r of wordlistSubs) { if (r && r.ips.length > 0) result[r.sub] = r.ips; }
    for (const sub of crtSubs) {
      if (!result[sub]) {
        try { const ips = await resolve4(sub); if (ips.length > 0) result[sub] = ips; } catch {}
      }
    }
    // Always include main domain
    try { const ips = await resolve4(this.targetDomain); if (ips.length > 0) result[this.targetDomain] = ips; } catch {}
    return result;
  }

  async scanPortsOnAssets(subdomainIps: Record<string, string[]>, ports: number[]): Promise<DiscoveredAsset[]> {
    const assets: DiscoveredAsset[] = [];
    const entries = Object.entries(subdomainIps);

    for (let i = 0; i < entries.length; i += 10) {
      const batch = entries.slice(i, i + 10);
      const results = await Promise.allSettled(batch.map(async ([subdomain, ips]) => {
        if (!ips[0]) return null;
        const ip = ips[0];
        const openPorts: number[] = [];
        for (const port of ports) { if (await tcpConnect(ip, port, 1500)) openPorts.push(port); }
        if (openPorts.length === 0) return null;

        // Prioritize HTTPS ports for richer fingerprinting, then HTTP, then others
        const priority = [443, 8443, 80, 8080];
        openPorts.sort((a, b) => {
          const pa = priority.indexOf(a);
          const pb = priority.indexOf(b);
          if (pa !== -1 && pb !== -1) return pa - pb;
          if (pa !== -1) return -1;
          if (pb !== -1) return 1;
          return a - b;
        });
        const primaryPort = openPorts[0];

        const asset: DiscoveredAsset = {
          id: genId(), domain: this.targetDomain, subdomain, ip, port: primaryPort,
          service: SERVICE_NAMES[primaryPort] || 'Unknown', banner: '', technology: null,
          version: null, cves: [], cloudProvider: null, riskScore: 0, findings: [],
          headers: {}, firstSeen: new Date().toISOString(),
        };

        // Grab banner for primary open port
        const banner = await grabBanner(ip, primaryPort, 2000);
        asset.banner = banner;

        // Detect tech from banner
        const tech = extractTech(banner);
        const version = extractVersion(banner);
        if (tech) { asset.technology = tech; asset.version = version; }

        // Detect additional ports as findings
        if (openPorts.length > 1) {
          for (const p of openPorts.slice(1)) {
            asset.findings.push({ type: 'open_port', severity: 'info', port: p, service: SERVICE_NAMES[p] || 'Unknown', description: `Port ${p} (${SERVICE_NAMES[p] || 'Unknown'}) is open` });
          }
        }

        // Risk from dangerous ports
        const dangerPorts: Record<number, { severity: string; desc: string; score: number }> = {
          3389: { severity: 'critical', desc: 'RDP exposed to internet', score: 85 },
          23: { severity: 'critical', desc: 'Telnet (cleartext) exposed', score: 90 },
          21: { severity: 'high', desc: 'FTP exposed - potential anonymous access', score: 65 },
          3306: { severity: 'critical', desc: 'MySQL database exposed', score: 80 },
          5432: { severity: 'critical', desc: 'PostgreSQL exposed', score: 75 },
          6379: { severity: 'high', desc: 'Redis exposed without auth', score: 70 },
          9200: { severity: 'high', desc: 'Elasticsearch exposed', score: 65 },
          27017: { severity: 'critical', desc: 'MongoDB exposed', score: 75 },
          5900: { severity: 'high', desc: 'VNC exposed', score: 70 },
          445: { severity: 'high', desc: 'SMB exposed', score: 70 },
          111: { severity: 'medium', desc: 'RPCbind exposed', score: 45 },
          2049: { severity: 'medium', desc: 'NFS exposed', score: 50 },
        };
        for (const p of openPorts) {
          const d = dangerPorts[p];
          if (d) asset.findings.push({ type: 'exposed_service', severity: d.severity, port: p, description: d.desc });
        }

        return asset;
      }));
      for (const r of results) { if (r.status === 'fulfilled' && r.value) assets.push(r.value); }
    }
    return assets;
  }

  async analyzeWebAssets(assets: DiscoveredAsset[], cveLimit: 'lite' | 'full' = 'full'): Promise<DiscoveredAsset[]> {
    const webAssets = assets.filter((a) => [80,443,8080,8443].includes(a.port));

    for (let i = 0; i < webAssets.length; i += 20) {
      const batch = webAssets.slice(i, i + 20);
      await Promise.allSettled(batch.map(async (asset) => {
        const proto = asset.port === 443 || asset.port === 8443 ? 'https' : 'http';
        const url = `${proto}://${asset.subdomain || asset.ip}:${asset.port}`;
        try {
          let { headers, body, status } = await fetchHeaders(url, 12000);
          // Fallback: if HTTPS fails, try HTTP and vice versa
          if (status === 0) {
            const fallbackUrl = proto === 'https' ? url.replace('https://', 'http://') : url.replace('http://', 'https://');
            const fb = await fetchHeaders(fallbackUrl, 8000);
            if (fb.status !== 0) { headers = fb.headers; body = fb.body; status = fb.status; }
          }
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
          else if (server.toLowerCase().includes('cloudflare')) asset.waf = 'Cloudflare';
          else if (body.includes('cdn-cgi')) asset.waf = 'Cloudflare';
          else if (body.includes('sucuri')) asset.waf = 'Sucuri';
          else if (body.includes('__cf_bm')) asset.waf = 'Cloudflare';
          else if (headers['x-waf-event']) asset.waf = 'Generic WAF';

          // Technology Detection - Headers
          if (server) { asset.technology = extractTech(server) || asset.technology; asset.version = extractVersion(server) || asset.version; }
          if (powered && !asset.technology) asset.technology = extractTech(powered) || asset.technology;

          // Technology Detection - Body Patterns
          if (!asset.technology) {
            if (body.includes('wp-content') || body.includes('wp-includes')) asset.technology = 'WordPress';
            else if (body.includes('/sites/default/') || body.includes('Drupal')) asset.technology = 'Drupal';
            else if (body.includes('/media/jui/') || body.includes('Joomla')) asset.technology = 'Joomla';
            else if (body.includes('reactroot') || body.includes('data-reactroot')) asset.technology = 'React';
            else if (body.includes('__NEXT_DATA__')) asset.technology = 'Next.js';
            else if (body.includes('_nuxt')) asset.technology = 'Nuxt.js';
            else if (body.includes('laravel') || body.includes('csrf-token')) asset.technology = 'Laravel';
            else if (body.includes('X-CSRFToken') || body.includes('django')) asset.technology = 'Django';
            else if (body.includes('express')) asset.technology = 'Express';
            else if (body.includes('spring')) asset.technology = 'Spring';
            else if (body.includes('fastapi')) asset.technology = 'FastAPI';
            else if (body.includes('flask')) asset.technology = 'Flask';
            else if (body.includes('ruby') || body.includes('rails')) asset.technology = 'Ruby on Rails';
            else if (body.includes('Shopify')) asset.technology = 'Shopify';
          }

          // CVE Mapping
          if (asset.technology && asset.version) {
            const allCves = mapCves(asset.technology, asset.version);
            asset.cves = cveLimit === 'lite' ? allCves.slice(0, 3) : allCves;
          }

          // SSL Certificate Check
          if (asset.port === 443 || asset.port === 8443) {
            asset.sslInfo = await checkSSL(asset.subdomain || asset.ip || '');
            if (asset.sslInfo) {
              if (asset.sslInfo.daysRemaining !== undefined && asset.sslInfo.daysRemaining < 30) {
                asset.findings.push({ type: 'ssl_expiring', severity: asset.sslInfo.daysRemaining < 7 ? 'critical' : 'high', description: `SSL certificate expires in ${asset.sslInfo.daysRemaining} days` });
              }
              if (asset.sslInfo.selfSigned) {
                asset.findings.push({ type: 'ssl_self_signed', severity: 'high', description: 'Self-signed SSL certificate detected' });
              }
              if (asset.sslInfo.weakCipher) {
                asset.findings.push({ type: 'ssl_weak_cipher', severity: 'high', description: 'Weak SSL cipher detected (RC4/DES/MD5)' });
              }
            } else {
              asset.findings.push({ type: 'ssl_invalid', severity: 'high', description: 'SSL certificate missing or invalid' });
            }
          }

          // Security Headers (only for HTTPS)
          const requiredHeaders = ['content-security-policy','x-frame-options','x-content-type-options','referrer-policy'];
          if (asset.port === 443 || asset.port === 8443) requiredHeaders.push('strict-transport-security');
          const missing = requiredHeaders.filter(h => !headers[h]);
          if (missing.length > 0) {
            const severity = missing.includes('strict-transport-security') || missing.includes('content-security-policy') || missing.includes('x-frame-options') ? 'medium' : 'low';
            asset.findings.push({ type: 'missing_security_headers', severity, description: `Missing ${missing.length} header(s): ${missing.join(', ')}` });
          }

          // X-Content-Type-Options
          if (!headers['x-content-type-options']) {
            asset.findings.push({ type: 'missing_security_headers', severity: 'low', description: 'Missing X-Content-Type-Options: nosniff header' });
          }

          // Server header exposure
          if (headers['server'] && (headers['server'].includes('Apache') || headers['server'].includes('nginx') || headers['server'].includes('IIS'))) {
            const sv = headers['server'];
            if (/\d+\.\d+/.test(sv)) {
              asset.findings.push({ type: 'information_disclosure', severity: 'low', description: `Server version disclosed: ${sv}` });
            }
          }

          // Admin Panel References
          const adminPaths = ['/admin','/administrator','/wp-admin','/dashboard','/login','/signin','/manage'];
          for (const p of adminPaths) {
            if (body.toLowerCase().includes(p)) asset.findings.push({ type: 'admin_panel_reference', severity: 'low', description: `Potential admin panel detected: ${p}` });
          }

          // Information Disclosure
          if (body.toLowerCase().includes('phpinfo')) asset.findings.push({ type: 'information_disclosure', severity: 'high', description: 'Potential phpinfo() exposure detected' });
          if (body.includes('.env')) asset.findings.push({ type: 'information_disclosure', severity: 'critical', description: 'Potential .env file exposure' });
          if (body.includes('AWS_ACCESS_KEY_ID')) asset.findings.push({ type: 'information_disclosure', severity: 'critical', description: 'Potential AWS credentials exposure' });
          if (body.includes('-----BEGIN RSA PRIVATE KEY-----')) asset.findings.push({ type: 'information_disclosure', severity: 'critical', description: 'Private key exposure detected' });

          // Directory Listing
          if (body.includes('<title>Index of /') || body.includes('Directory Listing For') || body.includes('<h1>Index of')) {
            asset.findings.push({ type: 'directory_listing', severity: 'medium', description: 'Directory listing enabled' });
          }

          // Open Redirect
          if (body.includes('window.location') || body.includes('location.href') || body.includes('meta http-equiv="refresh"')) {
            asset.findings.push({ type: 'potential_open_redirect', severity: 'low', description: 'Potential open redirect vectors detected' });
          }

          // CORS Misconfiguration
          if (headers['access-control-allow-origin'] === '*') {
            asset.findings.push({ type: 'cors_misconfiguration', severity: 'medium', description: 'Overly permissive CORS: Access-Control-Allow-Origin: *' });
          }

          // Cookie Security
          const setCookie = headers['set-cookie'] || '';
          if (setCookie && (!setCookie.includes('Secure') || !setCookie.includes('HttpOnly'))) {
            asset.findings.push({ type: 'insecure_cookie', severity: 'medium', description: 'Cookie missing Secure/HttpOnly flags' });
          }

        } catch {
          asset.findings.push({ type: 'unreachable', severity: 'info', description: 'Web asset unreachable or connection refused during analysis' });
        }
      }));
    }
    return assets;
  }

  async scanCloudInfrastructure(): Promise<CloudAsset[]> {
    const assets: CloudAsset[] = [];
    const prefix = this.targetDomain.replace(/\./g, '-');
    const s3Buckets = [prefix, `${prefix}-backup`, `${prefix}-assets`, `${prefix}-data`, `${prefix}-dev`, `${prefix}-prod`, `${prefix}-staging`, `${prefix}-uploads`, `${prefix}-static`, `${prefix}-media`];
    const gcsBuckets = [prefix, `${prefix}-data`, `${prefix}-assets`];
    const azureStorages = [`${prefix}.blob.core.windows.net`, `${prefix}storage.blob.core.windows.net`];

    // S3 Check
    for (const bucket of s3Buckets) {
      try {
        const res = await fetch(`https://${bucket}.s3.amazonaws.com`, { method: 'GET', signal: AbortSignal.timeout(4000) });
        if (res.status === 200 || res.status === 403) {
          const text = await res.text();
          const perms: string[] = [];
          if (text.includes('<ListBucketResult')) perms.push('ListBucket');
          if (res.status === 200) perms.push('GetObject');
          const severity = res.status === 200 ? 'critical' : 'high';
          const risk = res.status === 200 ? 95 : 80;
          assets.push({
            id: genId(), provider: 'aws', serviceType: 's3', resourceId: bucket,
            url: `https://${bucket}.s3.amazonaws.com`, permissions: perms,
            misconfigurations: [{ type: res.status === 200 ? 's3_public_read' : 's3_listable', severity, description: `S3 bucket ${bucket} is publicly accessible (${res.status === 200 ? 'read+list' : 'listable'})` }],
            riskScore: risk, severity,
          });
        }
      } catch {}
    }

    // GCS Check
    for (const bucket of gcsBuckets) {
      try {
        const res = await fetch(`https://storage.googleapis.com/${bucket}`, { method: 'GET', signal: AbortSignal.timeout(4000) });
        if (res.status === 200) {
          const text = await res.text();
          if (text.includes('items') || text.includes('kind') || text.includes('<ListBucketResult')) {
            assets.push({
              id: genId(), provider: 'gcp', serviceType: 'gcs', resourceId: bucket,
              url: `https://storage.googleapis.com/${bucket}`, permissions: ['ListObjects'],
              misconfigurations: [{ type: 'gcs_public', severity: 'high', description: `GCS bucket ${bucket} is publicly accessible` }],
              riskScore: 80, severity: 'high',
            });
          }
        }
      } catch {}
    }

    // Azure Blob Check
    for (const storage of azureStorages) {
      try {
        const res = await fetch(`https://${storage}`, { method: 'GET', signal: AbortSignal.timeout(4000) });
        if (res.status === 200) {
          assets.push({
            id: genId(), provider: 'azure', serviceType: 'blob', resourceId: storage,
            url: `https://${storage}`, permissions: ['ListContainers'],
            misconfigurations: [{ type: 'azure_blob_public', severity: 'high', description: `Azure Blob ${storage} may be publicly accessible` }],
            riskScore: 75, severity: 'high',
          });
        }
      } catch {}
    }

    return assets;
  }

  async scanDNS(): Promise<Record<string, unknown>[]> {
    const findings: Record<string, unknown>[] = [];
    try {
      const mx = await resolveMx(this.targetDomain);
      if (mx.length > 0) findings.push({ type: 'dns_mx', severity: 'info', description: `${mx.length} MX record(s) found` });
    } catch {}
    try {
      const txt = await resolveTxt(this.targetDomain);
      const spf = txt.flat().find((t) => t.includes('v=spf1'));
      const dmarc = txt.flat().find((t) => t.includes('v=DMARC1'));
      if (!spf) findings.push({ type: 'missing_spf', severity: 'medium', description: 'No SPF record found - email spoofing risk' });
      else if (spf.includes('+all') || spf.includes('?all')) findings.push({ type: 'weak_spf', severity: 'medium', description: 'Weak SPF policy detected' });
      if (!dmarc) findings.push({ type: 'missing_dmarc', severity: 'medium', description: 'No DMARC record found' });
    } catch {}
    return findings;
  }

  calculateRiskScores(assets: DiscoveredAsset[], cloud: CloudAsset[]) {
    for (const asset of assets) {
      let score = 0;
      const ps: Record<number, number> = { 3389:85, 23:90, 21:60, 3306:80, 5432:75, 6379:65, 9200:55, 27017:75, 5900:65, 445:65, 2049:50 };
      score += ps[asset.port] || 0;
      score += asset.cves.length * 45;
      for (const f of asset.findings) {
        const sev = (f as any).severity || '';
        if (sev === 'critical') score += 40;
        else if (sev === 'high') score += 25;
        else if (sev === 'medium') score += 12;
        else if (sev === 'low') score += 5;
      }
      asset.riskScore = Math.min(score, 100);
    }
    for (const c of cloud) c.riskScore = c.severity === 'critical' ? 95 : c.severity === 'high' ? 80 : 55;
  }

  generateRecommendations(assets: DiscoveredAsset[], cloud: CloudAsset[], dnsFindings: Record<string, unknown>[]): string[] {
    const recs: string[] = [];
    const writable = cloud.filter((a) => a.permissions.includes('PutObject'));
    if (writable.length > 0) recs.push(`URGENT: ${writable.length} writable cloud bucket(s) found`);
    const listable = cloud.filter((a) => a.permissions.includes('ListBucket') || a.permissions.includes('ListObjects'));
    if (listable.length > 0) recs.push(`HIGH: ${listable.length} publicly listable bucket(s)`);
    const exposedDbs = assets.filter((a) => [3306,5432,27017,6379,9200].includes(a.port));
    if (exposedDbs.length > 0) recs.push(`CRITICAL: ${exposedDbs.length} exposed database port(s)`);
    const outdated = assets.filter((a) => a.cves.length > 0);
    if (outdated.length > 0) recs.push(`HIGH: ${outdated.length} asset(s) with known CVEs`);
    const noSpf = dnsFindings.filter((f) => (f as any).type === 'missing_spf');
    if (noSpf.length > 0) recs.push(`MEDIUM: Add SPF/DMARC records to prevent email spoofing`);
    const expiredSsl = assets.filter((a) => a.sslInfo && a.sslInfo.daysRemaining !== undefined && a.sslInfo.daysRemaining < 30);
    if (expiredSsl.length > 0) recs.push(`HIGH: ${expiredSsl.length} SSL certificate(s) expiring soon`);
    const selfSigned = assets.filter((a) => a.sslInfo?.selfSigned);
    if (selfSigned.length > 0) recs.push(`HIGH: Replace self-signed SSL certificates`);
    recs.push('Implement continuous monitoring', 'Review cloud storage policies', 'Deploy WAF for public assets', 'Enable security headers on all endpoints');
    return recs;
  }

  async runScan(type: string = 'full', portLimit = 100, cveLimit: 'lite' | 'full' = 'full'): Promise<ScanResult> {
    switch (type) {
      case 'subdomain': return this.runSubdomainOnly();
      case 'port': return this.runPortOnly(portLimit);
      case 'cve': return this.runCVEOnly(portLimit, cveLimit);
      case 'cloud': return this.runCloudOnly();
      default: return this.runFullScan(portLimit, cveLimit);
    }
  }

  async runSubdomainOnly(): Promise<ScanResult> {
    const start = Date.now();
    const subdomainIps = await this.enumerateSubdomains();
    this.scanResult.assets = []; this.scanResult.cloudAssets = [];
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = { totalSubdomains: Object.keys(subdomainIps).length, totalAssets: 0, totalCloudAssets: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 };
    this.scanResult.executiveSummary = { overallRisk: 'LOW', criticalFindings: 0, attackSurfaceSize: Object.keys(subdomainIps).length, recommendations: ['Run port scan to discover open services'] };
    return this.scanResult;
  }

  async runPortOnly(portLimit = 50): Promise<ScanResult> {
    const start = Date.now();
    const subdomainIps = await this.enumerateSubdomains();
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    this.scanResult.assets = assets; this.scanResult.cloudAssets = [];
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = { totalSubdomains: Object.keys(subdomainIps).length, totalAssets: assets.length, totalCloudAssets: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 };
    this.scanResult.executiveSummary = { overallRisk: 'LOW', criticalFindings: 0, attackSurfaceSize: assets.length, recommendations: ['Run full scan for CVE mapping and cloud checks'] };
    return this.scanResult;
  }

  async runCVEOnly(portLimit = 50, cveLimit: 'lite' | 'full' = 'full'): Promise<ScanResult> {
    const start = Date.now();
    const subdomainIps = await this.enumerateSubdomains();
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    await this.analyzeWebAssets(assets, cveLimit);
    this.calculateRiskScores(assets, []);
    const crit = assets.filter((a) => a.riskScore >= 70).length;
    this.scanResult.assets = assets; this.scanResult.cloudAssets = [];
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = {
      totalSubdomains: Object.keys(subdomainIps).length, totalAssets: assets.length, totalCloudAssets: 0,
      highRiskCount: crit, mediumRiskCount: assets.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, lowRiskCount: assets.filter((a) => a.riskScore < 40).length,
    };
    this.scanResult.executiveSummary = {
      overallRisk: crit > 0 ? 'CRITICAL' : assets.some((a) => a.riskScore >= 70) ? 'HIGH' : assets.some((a) => a.riskScore >= 40) ? 'MEDIUM' : 'LOW',
      criticalFindings: crit, attackSurfaceSize: assets.length, recommendations: this.generateRecommendations(assets, [], []),
    };
    return this.scanResult;
  }

  async runCloudOnly(): Promise<ScanResult> {
    const start = Date.now();
    const cloudAssets = await this.scanCloudInfrastructure();
    const dnsFindings = await this.scanDNS();
    this.scanResult.assets = []; this.scanResult.cloudAssets = cloudAssets;
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = { totalSubdomains: 0, totalAssets: 0, totalCloudAssets: cloudAssets.length, highRiskCount: cloudAssets.filter((a) => a.severity === 'critical').length, mediumRiskCount: cloudAssets.filter((a) => a.severity === 'high').length, lowRiskCount: 0 };
    this.scanResult.executiveSummary = {
      overallRisk: cloudAssets.some((a) => a.severity === 'critical') ? 'CRITICAL' : cloudAssets.some((a) => a.severity === 'high') ? 'HIGH' : 'LOW',
      criticalFindings: cloudAssets.filter((a) => a.severity === 'critical').length, attackSurfaceSize: cloudAssets.length,
      recommendations: this.generateRecommendations([], cloudAssets, dnsFindings),
    };
    return this.scanResult;
  }

  async runFullScan(portLimit = 100, cveLimit: 'lite' | 'full' = 'full'): Promise<ScanResult> {
    const start = Date.now();
    const [subdomainIps, dnsFindings] = await Promise.all([this.enumerateSubdomains(), this.scanDNS()]);
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    const cloudAssets = await this.scanCloudInfrastructure();
    await this.analyzeWebAssets(assets, cveLimit);
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
      recommendations: this.generateRecommendations(assets, cloudAssets, dnsFindings),
    };
    return this.scanResult;
  }
}
