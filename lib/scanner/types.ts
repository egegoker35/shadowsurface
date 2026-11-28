export interface Finding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  port?: number;
  service?: string;
  description: string;
  evidence?: string;
  cvss?: number;
  cwe?: string;
  owasp?: string;
  remediation?: string;
  references?: string[];
  exploitAvailable?: boolean;
}

export type WebVulnType =
  | 'sqli'
  | 'xss'
  | 'lfi'
  | 'rfi'
  | 'open_redirect'
  | 'cors'
  | 'csrf'
  | 'idor'
  | 'info_disclosure'
  | 'weak_auth'
  | 'backup_file'
  | 'sensitive_file'
  | 'xxe'
  | 'ssrf'
  | 'rce'
  | 'command_injection'
  | 'file_upload'
  | 'path_traversal'
  | 'missing_header'
  | 'cookie_issue'
  | 'insecure_method'
  | 'api_exposure'
  | 'directory_listing'
  | 'brute_force'
  | 'wordpress_issue'
  | 'graphql_issue'
  | 'exposed_admin';

export interface WebVuln {
  type: WebVulnType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  url: string;
  parameter?: string;
  payload?: string;
  description: string;
  evidence?: string;
  confidence: 'confirmed' | 'likely' | 'potential';
}

export interface SSLInfo {
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  valid?: boolean;
  selfSigned?: boolean;
  weakCipher?: boolean;
  tlsVersion?: string;
  cipherSuite?: string;
  hsts?: boolean;
  certificateTransparency?: boolean;
  sni?: boolean;
  beastPoodle?: boolean;
  heartbleed?: boolean;
  logjam?: boolean;
  crime?: boolean;
  breach?: boolean;
  renegotiationSecure?: boolean;
  ocspStapling?: boolean;
  tls13?: boolean;
  tls12?: boolean;
  tls11?: boolean;
  tls10?: boolean;
  weakProtocols?: string[];
  certSubject?: string;
  certIssuer?: string;
  certValidFrom?: string;
  certValidTo?: string;
  certDaysLeft?: number;
  certExpired?: boolean;
  certFingerprint?: string;
  certSANs?: string[];
  /** True only when a peer certificate was actually retrieved. Absent means "no TLS evidence". */
  certPresent?: boolean;
  /** True only when the negotiated protocol was actually observed. */
  protocolKnown?: boolean;
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CNAME' | 'PTR' | 'SRV' | 'CAA';
  value: string;
  priority?: number;
}

export interface DiscoveredAsset {
  id: string;
  domain: string;
  subdomain: string;
  ip: string | null;
  port: number;
  service: string;
  banner: string;
  technology: string | null;
  version: string | null;
  cves: string[];
  /** Every technology detected on this asset, not just the primary one. */
  technologies?: Array<{ name: string; version?: string | null; category?: string }>;
  /** CVE matches with the exact component and version that triggered them. */
  cveDetails?: Array<{ id: string; component: string; version?: string | null; cvss: number; exploitAvailable: boolean }>;
  cveConfidence: 'high' | 'medium' | 'low';
  cloudProvider: string | null;
  riskScore: number;
  findings: Finding[];
  headers: Record<string, string>;
  sslInfo?: SSLInfo | null;
  sslGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'T' | 'X';
  waf?: string | null;
  dnsRecords?: DNSRecord[];
  webVulns?: WebVuln[];
  discoveredEndpoints?: string[];
  title?: string;
  redirects?: string[];
  firstSeen: string;
  osFingerprint?: string;
  uptime?: string;
  traceroute?: string[];
  exploitAvailable?: boolean;
  cvssMax?: number;
}

export interface CloudAsset {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'firebase' | 'heroku' | 'oracle' | 'ibm' | 'alibaba';
  serviceType: string;
  resourceId: string;
  url: string;
  permissions: string[];
  misconfigurations: Finding[];
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  exposureLevel?: 'public' | 'authenticated' | 'private';
}

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
  summary: { totalFindings: number; exposedMcpCount: number; leakedSecretCount: number; agentEndpointCount: number; scannedHosts: number };
}

export interface ScanResult {
  scanId: string;
  target: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  assets: DiscoveredAsset[];
  cloudAssets: CloudAsset[];
  statistics: {
    totalSubdomains: number;
    totalAssets: number;
    totalCloudAssets: number;
    criticalFindings: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    infoCount: number;
    totalCVEs: number;
    totalWebVulns: number;
    sslIssues: number;
    totalExploits: number;
    weakSSLCount: number;
    missingHeaderCount: number;
    exposedDBCount: number;
    exposedAdminCount: number;
  };
  /** How much of the resolved attack surface actually produced a response. */
  coverage?: {
    resolvedSubdomains: number;
    scannedAssets: number;
    unreachable: number;
    /** True when nothing responded at all: the report must not be read as clean. */
    inconclusive: boolean;
  };
  executiveSummary: {
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'INCONCLUSIVE';
    riskScore: number;
    criticalFindings: number;
    attackSurfaceSize: number;
    recommendations: string[];
    threatActors: string[];
    mitreTactics?: string[];
    /** Explicit statements about what this scan could not observe. */
    scanLimitations?: string[];
  };
  dnsAnalysis?: {
    records: DNSRecord[];
    spfPolicy?: string;
    dmarcPolicy?: string;
    dkimPresent?: boolean;
    dnssec?: boolean;
    caa?: string[];
    subdomainTakeover?: string[];
    zoneTransfer?: boolean;
  };
  agentSurface?: AgentSurfaceResult;
}
