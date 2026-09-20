import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { resolve4, resolveCname } from 'dns/promises';
import { URL } from 'url';

export interface AgentSurfaceFinding {
  type: 'mcp_exposure' | 'agent_secret' | 'agent_endpoint' | 'agent_typosquat';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  host: string;
  description: string;
  evidence: string;
  remediation: string;
  confidence: 'confirmed' | 'likely' | 'potential';
}

export interface AgentSurfaceResult {
  findings: AgentSurfaceFinding[];
  exposedMcpServers: { host: string; url: string; transport: string; authentication: string }[];
  leakedSecrets: { host: string; pattern: string; snippet: string }[];
  agentEndpoints: { host: string; url: string; service: string; authRequired: string }[];
  summary: {
    totalFindings: number;
    exposedMcpCount: number;
    leakedSecretCount: number;
    agentEndpointCount: number;
    scannedHosts: number;
  };
}

// ─── MCP / AI-agent exposure probe paths ──────────────────────────────────
const MCP_PATHS = [
  '/.well-known/mcp',
  '/.well-known/mcp.json',
  '/mcp',
  '/mcp/sse',
  '/mcp/message',
  '/sse',
  '/api/mcp',
  '/api/mcp/sse',
  '/mcp-server',
  '/v1/mcp',
];

const AGENT_PATHS: { path: string; service: string }[] = [
  { path: '/v1/chat/completions', service: 'OpenAI-compatible chat API' },
  { path: '/v1/messages', service: 'Anthropic Messages API' },
  { path: '/api/agents', service: 'Agent management API' },
  { path: '/v1/tools', service: 'Tool registry API' },
  { path: '/tools/call', service: 'Tool call endpoint' },
  { path: '/api/tools', service: 'Tool registry API' },
  { path: '/v1/assistants', service: 'Assistants API' },
];

const SECRET_PATTERNS: { name: string; regex: RegExp; severity: 'critical' | 'high' }[] = [
  { name: 'OpenAI API key', regex: /\bsk-(?:proj|svcacct)-[A-Za-z0-9_\-]{16,}/, severity: 'critical' },
  { name: 'Anthropic API key', regex: /\bsk-ant-[A-Za-z0-9_\-]{16,}/, severity: 'critical' },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_\-]{20,}/, severity: 'high' },
  { name: 'GitHub personal token', regex: /\bghp_[A-Za-z0-9]{36}\b/, severity: 'critical' },
  { name: 'GitHub fine-grained PAT', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}/, severity: 'critical' },
  { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/, severity: 'critical' },
  { name: 'Slack bot token', regex: /\bxox[baprs]-[A-Za-z0-9\-]{10,}/, severity: 'high' },
  { name: 'MCP server credential', regex: /\b(?:mcp[_\-\.]?)?(?:token|key|secret)\s*[=:]\s*[A-Za-z0-9_\-]{16,}/i, severity: 'high' },
  { name: 'AI agent env variable', regex: /\b(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|MCP_SERVER_URL|MCP_API_KEY|AGENT_API_KEY|OPENAI_BASE_URL)\s*=\s*[^\s"']+/gi, severity: 'high' },
];

interface HttpProbe {
  status: number;
  headers: Record<string, string>;
  body: string;
}

function fetchUrl(urlStr: string, timeoutMs = 3500, method: 'GET' | 'POST' = 'GET'): Promise<HttpProbe | null> {
  return new Promise((resolve) => {
    let settled = false;
    let u: URL;
    try { u = new URL(urlStr); } catch { resolve(null); return; }
    const mod = u.protocol === 'https:' ? httpsRequest : httpRequest;
    const opts: any = {
      headers: {
        'User-Agent': 'ShadowSurface-ASM/1.0 (securityassessment)',
        Accept: 'application/json, text/event-stream, */*',
      },
      timeout: timeoutMs,
      method,
    };
    if (method === 'POST') opts.headers['Content-Type'] = 'application/json';
    const req = mod(u, opts, (res: any) => {
      if (settled) return;
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => {
        chunks.push(c);
        if (Buffer.concat(chunks).length > 70000) { req.destroy(); }
      });
      res.on('end', () => {
        if (settled) return;
        settled = true;
        resolve({ status: res.statusCode || 0, headers: res.headers as Record<string, string>, body: Buffer.concat(chunks).toString('utf8').slice(0, 70000) });
      });
    });
    req.on('error', () => { if (!settled) { settled = true; resolve(null); } });
    req.on('timeout', () => { req.destroy(); });
    req.on('close', () => { if (!settled) { settled = true; resolve(null); } });
    if (method === 'POST') req.write('{}');
    req.end();
    setTimeout(() => { if (!settled) { settled = true; req.destroy(); resolve(null); } }, timeoutMs + 800);
  });
}

function redactSnippet(snippet: string): string {
  return snippet.replace(/=([A-Za-z0-9_\-]{8,})/gi, '=<redacted>').replace(/\bBearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer <redacted>');
}

/**
 * Lite Agent Attack Surface scanner.
 * Discovers exposed MCP servers, leaked AI-agent credentials/tokens and
 * publicly reachable agent/LLM API endpoints on the given hosts.
 * Never throws; each host is bounded and the whole run is wrapped in the
 * caller's overall scan timeout.
 */
export async function scanAgentSurface(target: string, hosts: string[]): Promise<AgentSurfaceResult> {
  const result: AgentSurfaceResult = {
    findings: [],
    exposedMcpServers: [],
    leakedSecrets: [],
    agentEndpoints: [],
    summary: { totalFindings: 0, exposedMcpCount: 0, leakedSecretCount: 0, agentEndpointCount: 0, scannedHosts: 0 },
  };
  const deadline = Date.now() + 40000;
  const probeHosts = Array.from(new Set([target, ...(hosts || [])])).slice(0, 6);

  for (const host of probeHosts) {
    if (Date.now() > deadline) break;
    result.summary.scannedHosts += 1;
    await scanHost(host, result, deadline);
  }

  // Typosquat check on the apex domain (max ~6 lookups)
  if (Date.now() < deadline) {
    await typosquatCheck(target, result, deadline);
  }

  result.summary.totalFindings = result.findings.length;
  result.summary.exposedMcpCount = result.exposedMcpServers.length;
  result.summary.leakedSecretCount = result.leakedSecrets.length;
  result.summary.agentEndpointCount = result.agentEndpoints.length;
  return result;
}

async function scanHost(host: string, result: AgentSurfaceResult, deadline: number): Promise<void> {
  // Control path detection: SPA catch-all hosts (200 on everything) are skipped
  const ctrlPath = `/zzz-ss-control-${Math.random().toString(36).slice(2, 8)}`;
  const ctrl = await fetchUrl(`https://${host}${ctrlPath}`, 3500);
  const catchAll = !!ctrl && ctrl.status < 400 && ctrl.status > 0;

  // MCP server exposure probes
  for (const path of MCP_PATHS) {
    if (Date.now() > deadline) return;
    const res = await fetchUrl(`https://${host}${path}`, 3200);
    if (!res || res.status === 0) continue;
    const ct = (res.headers['content-type'] || '').toLowerCase();
    const bodyLower = res.body.toLowerCase();
    const looksMcp =
      res.status >= 200 && res.status < 300 &&
      !catchAll &&
      (ct.includes('text/event-stream') || ct.startsWith('application/json') ||
        bodyLower.includes('jsonrpc') || bodyLower.includes('tools/list') || bodyLower.includes('"mcp"'));
    if (!looksMcp) continue;
    const auth = res.status === 401 || res.status === 403 || res.status === 407 ? 'required' : 'NONE (unauthenticated)';
    result.exposedMcpServers.push({ host, url: `https://${host}${path}`, transport: ct.includes('text/event-stream') ? 'SSE' : 'JSON-RPC', authentication: auth });
    result.findings.push({
      type: 'mcp_exposure',
      severity: auth === 'required' ? 'medium' : 'high',
      host,
      description: `Exposed MCP (Model Context Protocol) server at ${path}`,
      evidence: `GET https://${host}${path} -> HTTP ${res.status} (${ct || 'unknown content-type'}) authentication: ${auth}`,
      remediation: 'Protect MCP endpoints with authentication and IP allowlisting. Remove public access to internal tool-calling servers.',
      confidence: auth === 'required' ? 'likely' : 'confirmed',
    });
  }

  // Agent / LLM API endpoint discovery (POST -> 401/400/200 signals a real route)
  for (const ep of AGENT_PATHS) {
    if (Date.now() > deadline) return;
    const res = await fetchUrl(`https://${host}${ep.path}`, 3200, 'POST');
    if (!res || res.status === 0 || res.status === 404) continue;
    const auth = res.status === 401 || res.status === 403 ? 'required' : res.status === 200 ? 'NONE (unauthenticated)' : 'maybe';
    result.agentEndpoints.push({ host, url: `https://${host}${ep.path}`, service: ep.service, authRequired: auth });
    if (auth === 'NONE (unauthenticated)' || res.status === 200) {
      result.findings.push({
        type: 'agent_endpoint',
        severity: auth === 'NONE (unauthenticated)' ? 'high' : 'medium',
        host,
        description: `Publicly reachable ${ep.service} at ${ep.path}`,
        evidence: `POST https://${host}${ep.path} -> HTTP ${res.status}; authentication: ${auth}`,
        remediation: 'Verify these agent endpoints are not bypassing auth. Rotate any API keys discoverable via them.',
        confidence: auth === 'NONE (unauthenticated)' ? 'confirmed' : 'potential',
      });
    }
  }

  // Secret / token leak scanning on the homepage body
  const home = await fetchUrl(`https://${host}/`, 3200);
  let bodiesToScan = home?.body || '';
  const webmanifest = await fetchUrl(`https://${host}/.well-known/mcp.json`, 3000);
  if (webmanifest?.body) bodiesToScan += '\n' + webmanifest.body;
  for (const p of SECRET_PATTERNS) {
    if (!bodiesToScan) break;
    const m = bodiesToScan.match(p.regex);
    if (!m) continue;
    const snippet = redactSnippet(m[0].slice(0, 120));
    result.leakedSecrets.push({ host, pattern: p.name, snippet: `${m[0].slice(0, 24)}...` });
    result.findings.push({
      type: 'agent_secret',
      severity: p.severity,
      host,
      description: `Possible ${p.name} leaked in publicly accessible content`,
      evidence: `Homepage/endpoint body matched ${p.name} pattern; matched snippet: ${snippet}`,
      remediation: 'Rotate the exposed credential immediately and remove it from client-side code, configs and env dumps.',
      confidence: 'likely',
    });
  }
}

async function typosquatCheck(target: string, result: AgentSurfaceResult, deadline: number): Promise<void> {
  let apex = target.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  // strip common single-label input (allow only domain-like targets)
  if (!apex.includes('.') || apex.includes(' ')) return;
  if (apex.startsWith('www.')) apex = apex.slice(4);
  const parts = apex.split('.');
  if (parts.length < 2) return;
  const base = parts[0];
  const tld = '.' + parts.slice(1).join('.');
  const candidates = [
    base.replace(/(.)$/, '$1$1') + tld,                 // exaample.com
    base.slice(0, -1) + tld,                             // exaple.com
    base.replace('o', '0') + tld,                        // ex0ple.com
    base.replace('i', 'l') + tld,                        // examp1e style
    base + 's' + tld,                                    // examples.com
    base + tld.replace(/\./g, '.'), // keep
  ];
  const seen = Array.from(new Set<string>(candidates));
  let checked = 0;
  for (const cand of seen) {
    if (Date.now() > deadline || checked >= 5) break;
    if (cand === apex) continue;
    checked++;
    try {
      const [ips, cnames] = await Promise.all([resolve4(cand), resolveCname(cand)]);
      const addrs = [...(ips || []), ...(cnames || [])];
      if (addrs.length === 0) continue;
      const res = await fetchUrl(`https://${cand}/`, 2500);
      const body = res?.body.toLowerCase() || '';
      const looksAgent = body.includes('mcp') || body.includes('agent') || body.includes('llm') || body.includes('login');
      if (!res || res.status >= 400) continue;
      result.findings.push({
        type: 'agent_typosquat',
        severity: looksAgent ? 'medium' : 'low',
        host: cand,
        description: `Potential typosquat / lookalike domain of ${apex}`,
        evidence: `${cand} resolves to ${addrs.slice(0, 2).join(', ')} and serves HTTP ${res.status}`,
        remediation: 'Monitor registrations of lookalike domains. Consider defensive registrations for high-value brands.',
        confidence: 'potential',
      });
    } catch {
      // no DNS record -> fine, domain not registered (or no A)
    }
  }
}